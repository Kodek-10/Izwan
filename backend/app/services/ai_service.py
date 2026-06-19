import os
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from typing import List, Dict, Any
import json
from ..core.privacy import is_air_gapped

class AIService:
    def __init__(self):
        self.model = None
        self.provider = None
        self.parser = JsonOutputParser()

    def _get_model(self):
        provider = "ollama" if is_air_gapped() or not os.getenv("GROQ_API_KEY") else "groq"
        if self.model is not None and self.provider == provider:
            return self.model

        self.provider = provider
        if provider == "ollama":
            print("INFO: Initialisation de l'IA avec Ollama (gemma2:2b)")
            from langchain_ollama import ChatOllama
            self.model = ChatOllama(
                model="gemma2:2b",
                temperature=0.3,
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            )
            return self.model

        print("INFO: Initialisation de l'IA avec Groq (llama-3.1-8b-instant)")
        from langchain_groq import ChatGroq
        self.model = ChatGroq(
            model_name="llama-3.1-8b-instant",
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.3
        )
        return self.model

    async def generate_tags_and_description(self, code: str, language: str, lang: str = "fr"):
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

        chain = prompt | self._get_model() | self.parser

        try:
            result = await chain.ainvoke({"code": code, "language": language})
            return result
        except Exception as e:
            print(f"Erreur IA: {e}")
            return {
                "tags": [language.lower(), "snippet"],
                "description": f"Snippet {language} (AI Analysis unavailable)" if lang == "en" else f"Snippet {language} (Analyse IA indisponible)"
            }

    async def chat_with_context(self, query: str, context_snippets: List[Dict[str, Any]], lang: str = "fr"):
        """
        Répond à une question en utilisant des snippets comme contexte (RAG).
        """
        if not context_snippets:
            if lang == "en":
                return "I couldn't find any relevant snippets in your library to answer this question."
            return "Je n'ai pas trouvé de snippets pertinents dans votre bibliothèque pour répondre à cette question."

        context_text = "\n\n".join([
            f"Snippet: {s['title']} ({s['language']})\nCode:\n{s['code']}\nDescription: {s['description']}"
            for s in context_snippets
        ])

        if lang == "en":
            prompt_text = (
                "You are Izwan, an expert development assistant. "
                "Use the code snippets provided below to answer the user's question. "
                "If the answer is not in the context, help the user as best as you can with your general knowledge, stating that it is not in their snippets.\n\n"
                "YOUR SNIPPETS CONTEXT:\n"
                "{context}\n\n"
                "QUESTION: {query}\n\n"
                "ANSWER (be concise and precise):"
            )
        else:
            prompt_text = (
                "Tu es Izwa, un assistant expert en développement. "
                "Utilise les extraits de code fournis ci-dessous pour répondre à la question de l'utilisateur. "
                "Si la réponse n'est pas dans le contexte, aide l'utilisateur au mieux avec tes connaissances générales en précisant que ce n'est pas dans ses snippets.\n\n"
                "CONTEXTE DE VOS SNIPPETS :\n"
                "{context}\n\n"
                "QUESTION : {query}\n\n"
                "RÉPONSE (sois concis et précis) :"
            )

        prompt = PromptTemplate(
            template=prompt_text,
            input_variables=["context", "query"],
        )

        chain = prompt | self._get_model()

        try:
            result = await chain.ainvoke({"context": context_text, "query": query})
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

        chain = prompt | self._get_model()

        try:
            result = await chain.ainvoke({"code": code, "language": language})
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

        chain = prompt | self._get_model()

        try:
            result = await chain.ainvoke({"code": code, "language": language, "surrounding_code": surrounding_code})
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

            chain = prompt | self._get_model()

            result = await chain.ainvoke({"code": code, "source_language": source_language, "target_language": target_language})
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
