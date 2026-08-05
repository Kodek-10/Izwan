# 📝 Résumé des Discussions : Projet Izwan

Ce document récapitule l'analyse du projet Izwan et nos échanges sur son fonctionnement et sa pertinence technique.

---

## 🧐 1. Analyse du Projet
Izwan (ou Izwa) est un écosystème de gestion de snippets de code boosté par l'IA. Il est structuré en monorepo :
- **Backend** : FastAPI, PostgreSQL/Supabase (SQLite en local), recherche sémantique (FastEmbed), intégration IA (Groq/Ollama), OAuth (Google/GitHub), endpoint admin + audit.
- **Frontend** : React 19 (TanStack Start/SSR), TypeScript, Shadcn UI, Tailwind 4, multi-langue (FR/EN).
- **Extension VS Code** : Interface native pour l'accès et l'insertion rapide de snippets, avec login OAuth navigateur.
- **Desktop** : Application Electron (V2) qui charge l'app hébergée ; zéro backend embarqué.
- **Deploiement** : backend sur Render, frontend sur Cloudflare Pages, base sur Supabase.

---

## 🔧 2. Fonctionnement de l'Extension VS Code
L'extension sert de pont entre l'éditeur et le savoir stocké :
- **Sidebar** : Une Webview HTML/JS permettant de naviguer et de cliquer pour insérer.
- **Recherche Sémantique** : Utilisation d'un `QuickPick` pour trouver du code par intention (ex: "comment trier") via le backend.
- **Enregistrement** : capture directe du code sélectionné depuis l'éditeur.
- **Ghost Snippets** : suggestions locales en temps réel pendant la frappe.
- **Sécurité** : Gestion des tokens JWT via `vscode.secrets` ; connection via flux **OAuth navigateur** (aucune saisie de mot de passe dans l'éditeur).
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
*Mardi 16 juin 2026 (archives ; le projet a largement évolué depuis)*

---

*Document généré pour archiver l'analyse et la vision stratégique du projet.*