import os
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from typing import List, Dict, Any
import json
from ..core.privacy import is_air_gapped

OLLAMA_CONTEXT_WINDOWS = (4096, 8192, 16384, 32768)
CHARS_PER_TOKEN_ESTIMATE = 4

class AIService:
    def __init__(self):
        self.models = {}
        self.parser = JsonOutputParser()

    def _estimate_tokens(self, text: str) -> int:
        return max(1, len(text) // CHARS_PER_TOKEN_ESTIMATE)

    def _select_context_window(self, *texts: str) -> int:
        requested_tokens = self._estimate_tokens("\n".join(texts)) + 1024
        forced_context = os.getenv("OLLAMA_CONTEXT_WINDOW")
        if forced_context:
            return int(forced_context)

        for window in OLLAMA_CONTEXT_WINDOWS:
            if requested_tokens <= int(window * 0.75):
                return window
        return OLLAMA_CONTEXT_WINDOWS[-1]

    def _truncate_middle(self, text: str, max_chars: int) -> str:
        if len(text) <= max_chars:
            return text

        marker = "\n\n...[context truncated for model window]...\n\n"
        head_size = max_chars // 2
        tail_size = max_chars - head_size - len(marker)
        return f"{text[:head_size]}{marker}{text[-tail_size:]}"

    def _prepare_context(self, text: str, context_window: int) -> str:
        reserved_output_tokens = 1024
        max_input_chars = max(1000, (context_window - reserved_output_tokens) * CHARS_PER_TOKEN_ESTIMATE)
        return self._truncate_middle(text, max_input_chars)

    def _get_model(self, *context_texts: str):
        provider = "ollama" if is_air_gapped() or not os.getenv("GROQ_API_KEY") else "groq"
        context_window = self._select_context_window(*context_texts)
        groq_model = (
            os.getenv("GROQ_LONG_CONTEXT_MODEL", "llama-3.1-8b-instant")
            if context_window >= 16384
            else os.getenv("GROQ_MODEL_NAME", "llama-3.1-8b-instant")
        )
        cache_key = (provider, context_window if provider == "ollama" else groq_model)
        if cache_key in self.models:
            return self.models[cache_key]

        if provider == "ollama":
            print(f"INFO: Initialisation de l'IA avec Ollama (gemma2:2b, contexte {context_window})")
            from langchain_ollama import ChatOllama
            model = ChatOllama(
                model="gemma2:2b",
                temperature=0.3,
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                num_ctx=context_window,
            )
            self.models[cache_key] = model
            return model

        print(f"INFO: Initialisation de l'IA avec Groq ({groq_model})")
        from langchain_groq import ChatGroq
        model = ChatGroq(
            model_name=groq_model,
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.3
        )
        self.models[cache_key] = model
        return model

    async def generate_tags_and_description(self, code: str, language: str, lang: str = "fr"):
        context_window = self._select_context_window(code)
        prepared_code = self._prepare_context(code, context_window)
        if lang == "en":
            prompt_text = (
                "Analyze this code and generate:\n"
                "1. 3-5 relevant tags (ex: python, filter, date)\n"
                "2. A short natural description (1-2 lines).\n"
                "Code: {code}, Language: {language}.\n"
                "Respond EXACTLY in JSON: {{\"tags\": [\"tag1\", \"tag2\"], \"description\": \"desc\"}}"
            )
        else:
            prompt_text = (
                "Analyse ce code et génère :\n"
                "1. 3-5 tags pertinents (ex: python, filter, date)\n"
                "2. Courte description naturelle (1-2 lignes).\n"
                "Code : {code}, Langage : {language}.\n"
                "Réponds EXACTEMENT en JSON : {{\"tags\": [\"tag1\", \"tag2\"], \"description\": \"desc\"}}"
            )
        
        prompt = PromptTemplate(
            template=prompt_text,
            input_variables=["code", "language"],
        )

        chain = prompt | self._get_model(prepared_code) | self.parser

        try:
            result = await chain.ainvoke({"code": prepared_code, "language": language})
            return result
        except Exception as e:
            print(f"Erreur IA: {e}")
            return {
                "tags": [language.lower(), "snippet"],
                "description": f"Snippet {language} (AI Analysis unavailable)" if lang == "en" else f"Snippet {language} (Analyse IA indisponible)"
            }

    async def chat_with_context(self, query: str, context_snippets: List[Dict[str, Any]], lang: str = "fr", history: List[Dict[str, Any]] = None):
        """
        Répond à une question en s'appuyant sur les snippets pertinents (RAG) ET sur
        l'historique de la conversation (mémoire conversationnelle). Le modèle est
        toujours sollicité, même sans snippet pertinent (réponse générale).
        """
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

        history = history or []

        if context_snippets:
            context_text = "\n\n".join([
                f"Snippet: {s['title']} ({s['language']})\nCode:\n{s['code']}\nDescription: {s['description']}"
                for s in context_snippets
            ])
            context_window = self._select_context_window(query, context_text)
            prepared_context = self._prepare_context(context_text, context_window)
        else:
            prepared_context = ""

        if lang == "en":
            system_text = (
                "You are Izwan, an expert development assistant. Answer the user's questions "
                "clearly and precisely, taking the conversation history into account. "
                "If relevant code snippets from the user's library are provided below, rely on "
                "them; otherwise answer from your general knowledge.\n\n"
                "USER'S SNIPPETS CONTEXT:\n"
                f"{prepared_context or 'No relevant snippet found.'}"
            )
        else:
            system_text = (
                "Tu es Izwan, un assistant expert en développement. Réponds aux questions de "
                "l'utilisateur de façon claire et précise, en tenant compte de l'historique de "
                "la conversation. Si des extraits de code pertinents de sa bibliothèque sont "
                "fournis ci-dessous, appuie-toi dessus ; sinon, réponds avec tes connaissances "
                "générales.\n\n"
                "CONTEXTE DES SNIPPETS :\n"
                f"{prepared_context or 'Aucun snippet pertinent trouvé.'}"
            )

        messages = [SystemMessage(content=system_text)]
        for m in history[-10:]:
            if m.get("role") == "assistant":
                messages.append(AIMessage(content=m.get("content", "")))
            else:
                messages.append(HumanMessage(content=m.get("content", "")))
        messages.append(HumanMessage(content=query))

        try:
            model = self._get_model(query, prepared_context)
            result = await model.ainvoke(messages)
            return result.content
        except Exception as e:
            print(f"Erreur Chat IA: {e}")
            if lang == "en":
                return "Sorry, I can't answer at the moment. Check if the AI service is available."
            return "Désolé, je ne peux pas répondre pour le moment. Vérifiez que le service d'IA est disponible."

    async def explain_code(self, code: str, language: str, lang: str = "fr"):
        """
        Explique le code fourni ligne par ligne ou de manière pédagogique.
        """
        context_window = self._select_context_window(code)
        prepared_code = self._prepare_context(code, context_window)
        if lang == "en":
            prompt_text = (
                "You are an expert programming teacher. "
                "Explain this {language} code clearly and pedagogically. "
                "Detail the important points and what each main section does.\n\n"
                "CODE:\n"
                "{code}\n\n"
                "EXPLANATION (in English, structured with Markdown):"
            )
        else:
            prompt_text = (
                "Tu es un professeur de programmation expert. "
                "Explique ce code {language} de manière claire et pédagogique. "
                "Détaille les points importants et ce que fait chaque section principale.\n\n"
                "CODE :\n"
                "{code}\n\n"
                "EXPLICATION (en français, structurée avec du Markdown) :"
            )

        prompt = PromptTemplate(
            template=prompt_text,
            input_variables=["code", "language"],
        )

        chain = prompt | self._get_model(prepared_code)

        try:
            result = await chain.ainvoke({"code": prepared_code, "language": language})
            return result.content
        except Exception as e:
            print(f"Erreur Explication IA: {e}")
            if lang == "en":
                return "Sorry, I can't explain this code at the moment."
            return "Désolé, je ne peux pas expliquer ce code pour le moment."

    async def adapt_code(self, code: str, language: str, surrounding_code: str, lang: str = "fr"):
        """
        Adapte le snippet de code pour correspondre au contexte du code environnant.
        """
        context_window = self._select_context_window(code, surrounding_code)
        prepared_code = self._prepare_context(code, context_window)
        prepared_surrounding_code = self._prepare_context(surrounding_code, context_window)
        if lang == "en":
            prompt_text = (
                "You are an expert developer assistant. "
                "Your task is to adapt the provided programming snippet so it fits naturally into the surrounding context code.\n"
                "Adjust variables, naming conventions, arguments, imports, styling, etc., to match the surrounding code context.\n"
                "Do not add comments. Return ONLY the adapted code, without any markdown formatting or code blocks.\n\n"
                "SURROUNDING CODE CONTEXT (around cursor):\n"
                "\"\"\"\n"
                "{surrounding_code}\n"
                "\"\"\"\n\n"
                "SNIPPET TO ADAPT:\n"
                "\"\"\"\n"
                "{code}\n"
                "\"\"\"\n\n"
                "ADAPTED SNIPPET:"
            )
        else:
            prompt_text = (
                "Tu es un assistant développeur expert. "
                "Ton but est d'adapter l'extrait de code (snippet) fourni pour qu'il s'insère naturellement dans le contexte du code environnant.\n"
                "Ajuste les variables, les conventions de nommage, les arguments, les imports, le style, etc., pour correspondre au code environnant.\n"
                "N'ajoute pas de commentaires. Retourne UNIQUEMENT le code adapté, sans formatage markdown ni blocs de code.\n\n"
                "CODE ENVIRONNANT (autour du curseur) :\n"
                "\"\"\"\n"
                "{surrounding_code}\n"
                "\"\"\"\n\n"
                "SNIPPET À ADAPTER :\n"
                "\"\"\"\n"
                "{code}\n"
                "\"\"\"\n\n"
                "SNIPPET ADAPTÉ :"
            )

        prompt = PromptTemplate(
            template=prompt_text,
            input_variables=["code", "language", "surrounding_code"],
        )

        chain = prompt | self._get_model(prepared_code, prepared_surrounding_code)

        try:
            result = await chain.ainvoke({
                "code": prepared_code,
                "language": language,
                "surrounding_code": prepared_surrounding_code,
            })
            content = result.content.strip()
            # Clean markdown code blocks if any (e.g. ```python ... ```)
            if content.startswith("```"):
                lines = content.split("\n")
                if len(lines) > 2:
                    content = "\n".join(lines[1:-1])
            return content
        except Exception as e:
            print(f"Erreur Adaptation IA: {e}")
            return code

    async def translate_code(self, code: str, source_language: str, target_language: str, lang: str = "fr"):
        """
        Traduit le code d'un langage vers un autre et génère tags/description.
        """
        try:
            context_window = self._select_context_window(code)
            prepared_code = self._prepare_context(code, context_window)
            if lang == "en":
                prompt_text = (
                    "You are an expert developer assistant. "
                    "Translate the following {source_language} code into {target_language}.\n"
                    "Provide the output EXACTLY in this format:\n"
                    "DESCRIPTION: <1-2 lines of description>\n"
                    "TAGS: <comma-separated tags>\n"
                    "```\n"
                    "<translated code>\n"
                    "```\n\n"
                    "CODE:\n"
                    "\"\"\"\n"
                    "{code}\n"
                    "\"\"\""
                )
            else:
                prompt_text = (
                    "Tu es un assistant développeur expert. "
                    "Traduis le code {source_language} suivant en {target_language}.\n"
                    "Fournis la réponse EXACTEMENT dans ce format :\n"
                    "DESCRIPTION: <1-2 lignes de description>\n"
                    "TAGS: <tags séparés par des virgules>\n"
                    "```\n"
                    "<code traduit>\n"
                    "```\n\n"
                    "CODE :\n"
                    "\"\"\"\n"
                    "{code}\n"
                    "\"\"\""
                )

            prompt = PromptTemplate(
                template=prompt_text,
                input_variables=["code", "source_language", "target_language"],
            )

            chain = prompt | self._get_model(prepared_code)

            result = await chain.ainvoke({
                "code": prepared_code,
                "source_language": source_language,
                "target_language": target_language,
            })
            content = result.content.strip()
            
            import re
            
            # Extract description
            desc_match = re.search(r'DESCRIPTION:\s*(.*?)\n', content, re.IGNORECASE)
            description = desc_match.group(1).strip() if desc_match else ("Traduction" if lang == "fr" else "Translation")
            
            # Extract tags
            tags_match = re.search(r'TAGS:\s*(.*?)\n', content, re.IGNORECASE)
            tags = [t.strip() for t in tags_match.group(1).split(',')] if tags_match else [target_language.lower(), "traduction"]
            
            # Extract code
            code_match = re.search(r'```(?:[\w+\-]+)?\n(.*?)\n```', content, re.DOTALL)
            translated_code = code_match.group(1).strip() if code_match else content
            
            return {
                "translated_code": translated_code,
                "description": description,
                "tags": tags
            }
            
        except Exception as e:
            print(f"Erreur Traduction IA: {e}")
            return {
                "translated_code": f"// Erreur lors de la traduction IA.\n// Code original :\n{code}",
                "description": "Erreur lors de la génération de la description." if lang == "fr" else "Error generating description.",
                "tags": [target_language.lower(), "traduction"]
            }

ai_service = AIService()
