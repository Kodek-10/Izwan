# 📝 Résumé des Discussions : Projet Izwan

Ce document récapitule l'analyse du projet Izwan et nos échanges sur son fonctionnement et sa pertinence technique.

---

## 🧐 1. Analyse du Projet
Izwan (ou Izwa) est un écosystème de gestion de snippets de code boosté par l'IA. Il est structuré en monorepo :
- **Backend** : FastAPI, SQLite, recherche sémantique (FastEmbed), intégration IA (Groq/Ollama).
- **Frontend** : React, TypeScript, Shadcn UI.
- **Extension VS Code** : Interface native pour l'accès et l'insertion rapide de snippets.

---

## 🔧 2. Fonctionnement de l'Extension VS Code
L'extension sert de pont entre l'éditeur et le savoir stocké :
- **Sidebar** : Une Webview HTML/JS permettant de naviguer et de cliquer pour insérer.
- **Recherche Sémantique** : Utilisation d'un `QuickPick` pour trouver du code par intention (ex: "comment trier") via le backend.
- **Sécurité** : Gestion des tokens JWT via `vscode.secrets`.
- **Communication** : Système de `postMessage` pour faire le lien entre la Webview isolée et l'API de l'éditeur VS Code.

---

## 🚀 3. Izwan à l'ère du Vibecoding et de l'IA
Dans un monde où Cursor et Claude génèrent du code à la volée, Izwan reste crucial pour :
1. **Source de Vérité** : Fixer les patterns "étalons-or" que l'IA ne doit pas réinventer.
2. **Contexte (RAG Personnel)** : Servir de mémoire externe pour nourrir les LLM avec vos propres habitudes de code.
3. **Zéro Latence** : L'insertion d'un snippet connu reste plus rapide que la rédaction d'un prompt complexe.
4. **Capitalisation** : Transformer les sessions de "vibecoding" éphémères en une base de connaissances durable et documentée.

---

## 📅 Date de la discussion
*Mardi 16 juin 2026*

---
*Document généré par Gemini CLI pour archiver l'analyse et la vision stratégique du projet.*
