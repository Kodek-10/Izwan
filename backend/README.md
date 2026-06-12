# Izwa - Backend

Le backend est une API REST performante construite avec **FastAPI**, conçue pour gérer efficacement vos snippets de code avec une couche d'intelligence artificielle locale.

## ✨ Fonctionnalités
- **Authentification JWT :** Inscription, connexion et protection des routes.
- **CRUD Snippets :** Gestion complète des morceaux de code.
- **Recherche Sémantique :** Intégration de `FastEmbed` pour une recherche par intention (proximité vectorielle).
- **Pagination :** Optimisation des performances pour les grandes collections.
- **Enrichissement IA :** Intégration LLM via **Groq** (API) ou **Ollama** (Local).
- **Exports :**
  - **Markdown :** Formatage propre pour documentation.
  - **PDF :** Rendu professionnel via templates HTML (Jinja2) et `xhtml2pdf`.

## 🛠️ Stack Technique
- **Framework :** FastAPI
- **Base de données :** SQLite avec SQLAlchemy
- **IA/Embeddings :** FastEmbed
- **Sécurité :** JWT, Bcrypt
- **Export :** Jinja2, xhtml2pdf, ReportLab

## 🚀 Installation

1. **Créer l'environnement virtuel :**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   .\venv\Scripts\activate   # Windows
   ```

2. **Installer les dépendances :**
   ```bash
   pip install -r requirements.txt
   ```

3. **Lancer le serveur :**
   ```bash
   uvicorn app.main:app --reload
   ```

## 📚 Documentation API
Une fois lancé, accédez à la documentation interactive :
- **Swagger UI :** `http://localhost:8000/docs`
- **ReDoc :** `http://localhost:8000/redoc`

## 🧪 Tests
Exécutez la suite de tests unitaires (13 tests couvrant Auth, CRUD, Search, Export) :
```bash
$env:PYTHONPATH="."
pytest tests/
```
