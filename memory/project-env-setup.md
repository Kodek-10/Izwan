---
name: project-env-setup
description: Configuration des variables d'environnement et fichier .env pour Izwan
metadata:
  type: project
---

Le projet utilise des variables d'environnement définies dans des fichiers `.env` locaux à chaque couche.

**Règle d'or : Les fichiers `.env` réels ne doivent JAMAIS être commités.**

**Configuration actuelle :**

1.  **Backend (`backend/.env`) :**
    - Le fichier `backend/.env` existe déjà et est chargé automatiquement par `backend/app/main.py`.
    - Un modèle `backend/.env.example` a été créé. Pour ajouter une nouvelle variable, mettre à jour le modèle aussi.
    - Variables actives : `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `GROQ_API_KEY`, `GROQ_MODEL_NAME`, `GROQ_LONG_CONTEXT_MODEL`, `OLLAMA_BASE_URL`, `OLLAMA_CONTEXT_WINDOW`.

2.  **Frontend (`frontend/.env`) :**
    - Le frontend Vite charge automatiquement les variables commençant par `VITE_`.
    - Un modèle `frontend/.env.example` existe.
    - Variable active : `VITE_API_URL` (par défaut `http://localhost:8000/api/v1`).

3.  **VS Code Extension (`vscode-extension/`) :**
    - L'extension accède au backend via le module `api.ts`. Les URLs ou clés API éventuelles devraient être configurées dans les `contributes configuration` du `package.json`.

**Quand je demanderai de configurer une clé API :**
- Apprendre à l'utilisateur à copier-coller sa clé dans le bon `<dossier>/.env` au lieu de la donner dans le chat.
- Si une nouvelle variable d'environnement est ajoutée au code, mettre à jour le fichier `.env.example` correspondant.