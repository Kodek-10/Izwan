import os
from langchain_groq import ChatGroq
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from typing import List, Dict, Any
import json

class AIService:
    def __init__(self):
        # Utilise Groq si une clé est présente, sinon reste sur Ollama (local)
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            self.model = ChatGroq(
                model_name="llama-3.1-8b-instant",
                groq_api_key=api_key,
                temperature=0.3
            )
        else:
            from langchain_ollama import ChatOllama
            self.model = ChatOllama(
                model="gemma2:2b",
                temperature=0.3,
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            )
        self.parser = JsonOutputParser()

    async def generate_tags_and_description(self, code: str, language: str):
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

        chain = prompt | self.model | self.parser

        try:
            result = await chain.ainvoke({"code": code, "language": language})
            return result
        except Exception as e:
            print(f"Erreur Ollama: {e}")
            return {
                "tags": [language.lower(), "snippet"],
                "description": f"Snippet {language} (Analyse IA indisponible)"
            }

    async def chat_with_context(self, query: str, context_snippets: List[Dict[str, Any]]):
        """
        Répond à une question en utilisant des snippets comme contexte (RAG).
        """
        if not context_snippets:
            return "Je n'ai pas trouvé de snippets pertinents dans votre bibliothèque pour répondre à cette question."

        context_text = "\n\n".join([
            f"Snippet: {s['title']} ({s['language']})\nCode:\n{s['code']}\nDescription: {s['description']}"
            for s in context_snippets
        ])

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

        chain = prompt | self.model

        try:
            result = await chain.ainvoke({"context": context_text, "query": query})
            return result.content
        except Exception as e:
            print(f"Erreur Chat Ollama: {e}")
            return "Désolé, je ne peux pas répondre pour le moment. Vérifiez que Ollama est lancé."

    async def explain_code(self, code: str, language: str):
        """
        Explique le code fourni ligne par ligne ou de manière pédagogique.
        """
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

        chain = prompt | self.model

        try:
            result = await chain.ainvoke({"code": code, "language": language})
            return result.content
        except Exception as e:
            print(f"Erreur Explication Ollama: {e}")
            return "Désolé, je ne peux pas expliquer ce code pour le moment."

ai_service = AIService()
