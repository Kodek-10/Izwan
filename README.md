# Izwan - Gestionnaire de Snippets IA Multi-Plateforme

Izwan est un écosystème complet pour capturer, organiser et réutiliser vos morceaux de code (snippets) intelligemment grâce à l'IA.

## 🚀 Composants du Projet

Ce projet est un monorepo comprenant :

*   **[Backend](./backend)** : API REST construite avec **FastAPI** — recherche sémantique locale (FastEmbed), IA (Groq en ligne ou Ollama hors-ligne), export, et persistance **PostgreSQL/Supabase** (ou SQLite en local) via SQLAlchemy + migrations Alembic.
*   **[Frontend](./frontend)** : Interface web moderne (SSR) en **TanStack Start / React 19** pour gérer vos collections.
*   **[Extension VS Code](./vscode-extension)** : Extension intégrée pour capturer, rechercher et insérer vos snippets depuis votre éditeur.
*   **[Desktop](./desktop)** : Application de bureau **Electron** (Windows / Linux) qui embarque l'expérience Izwan dans une fenêtre native.

## ✨ Fonctionnalités Clés

- 🧠 **Recherche Sémantique** : Trouvez vos snippets par intention, pas seulement par mots-clés.
- 🔌 **Intégration VS Code** : Insertion en un clic et recherche IA intégrée.
- 📁 **Organisation Intelligente** : Collections, tags et favoris.
- 📤 **Export Flexible** : Exportez vos snippets en Markdown ou PDF.
- 🔒 **Sécurité** : Authentification JWT robuste et isolation stricte Admin/User.

## 🗺️ Vision & Roadmap
Izwan évolue vers un véritable **Cerveau Numérique pour Développeurs** à l'ère du Vibecoding.
- Consultez notre [Feuille de Route Détaillée](./ajout_supplementaires.md) pour les évolutions futures.
- Retrouvez le [Résumé de nos orientations stratégiques](./docs/presentation/vision.md).

## 🌐 Utiliser Izwan (sans rien installer)

Izwan est hébergé et utilisable immédiatement :

*   **Application web** : [izwan.pages.dev](https://izwan.pages.dev) (frontend sur Cloudflare Pages, API sur Render).
*   **Application de bureau** : [dernière version](https://github.com/Kodek-10/Izwan/releases/latest) — installeurs à liens stables :
    *   Windows : [`Izwan-Setup.exe`](https://github.com/Kodek-10/Izwan/releases/latest/download/Izwan-Setup.exe)
    *   Linux : [`Izwan.AppImage`](https://github.com/Kodek-10/Izwan/releases/latest/download/Izwan.AppImage) · [`Izwan.deb`](https://github.com/Kodek-10/Izwan/releases/latest/download/Izwan.deb)
*   **Extension VS Code** : [Marketplace](https://marketplace.visualstudio.com/items?itemName=kodek10.izwan-vscode) (ou `ext install kodek10.izwan-vscode`).

> L'API peut mettre ~1 min à répondre à la première requête après une période d'inactivité (mise en veille de l'hébergement).

## 🛠️ Installation Rapide (développement local)

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

* Toute la documentation du projet (présentation, spécifications, rapports) est organisée dans [`docs/`](./docs/README.md).
* La documentation interactive de l'API est disponible sur `http://localhost:8000/docs` une fois le backend lancé.

## 📄 Licence
Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---
Développé par la communauté Izwan.
