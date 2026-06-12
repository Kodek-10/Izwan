# Izwan - Gestionnaire de Snippets IA Multi-Plateforme

Izwan est un écosystème complet pour capturer, organiser et réutiliser vos morceaux de code (snippets) intelligemment grâce à l'IA.

## 🚀 Composants du Projet

Ce projet est un monorepo comprenant :

*   **[Backend](./backend)** : API REST haute performance construite avec **FastAPI**, incluant la recherche sémantique (FastEmbed) et la gestion de base de données (SQLite/SQLAlchemy).
*   **[Frontend](./frontend)** : Interface web moderne et responsive en **React (TypeScript)** pour gérer vos collections.
*   **[Extension VS Code](./vscode-extension)** : Extension intégrée pour accéder et insérer vos snippets directement depuis votre éditeur.

## ✨ Fonctionnalités Clés

- 🧠 **Recherche Sémantique** : Trouvez vos snippets par intention, pas seulement par mots-clés.
- 🔌 **Intégration VS Code** : Insertion en un clic et recherche IA intégrée.
- 📁 **Organisation Intelligente** : Collections, tags et favoris.
- 📤 **Export Flexible** : Exportez vos snippets en Markdown ou PDF.
- 🔒 **Sécurité** : Authentification JWT robuste.

## 🛠️ Installation Rapide

### 1. Backend
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate | Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Extension VS Code
1. Ouvrez le dossier `vscode-extension` dans VS Code.
2. `npm install`
3. Appuyez sur `F5` pour lancer une instance de test.

## 📖 Documentation
La documentation complète de l'API est disponible sur `http://localhost:8000/docs` une fois le backend lancé.

## 📄 Licence
Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---
Développé avec ❤️ par la communauté Izwa.
