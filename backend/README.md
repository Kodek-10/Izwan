# Izwan - Backend

Le backend est une API REST performante construite avec **FastAPI**, conçue pour gérer efficacement vos snippets de code avec une couche d'intelligence artificielle locale ou distante.

## ✨ Fonctionnalités

- **Authentification JWT** : inscription, connexion, déconnexion, changement de mot de passe et protection des routes.
- **Sessions cookie (httpOnly)** : le token est aussi posé dans un cookie sécurisé pour l'authentification cross-domaine.
- **OAuth Google & GitHub** : connexion en un clic, avec `redirect_uri` et `state` anti-CSRF (callback par URL publique).
- **CRUD Snippets** : gestion complète des morceaux de code, avec pagination.
- **Collections** : organisation thématique des snippets (CRUD + cascade).
- **Recherche hybride** :
  - par mots-clés (titre, tags, description) ;
  - sémantique via **FastEmbed** (proximité vectorielle, cosine similarity).
- **Enrichissement IA** : génération de tags/description, explication de code — via **Groq** (API) ou **Ollama** (local).
- **Admin & Sécurité** :
  - rôles `USER` / `ADMIN` portés par le JWT ;
  - router d'administration `/api/v1/admin/` protégé par un garde de rôle ;
  - journal d'audit, statistiques d'usage IA, gestion des utilisateurs et des snippets ;
  - **rate limiting** sur les endpoints IA ;
  - **révocation de tokens** ;
  - mode **air-gapped** (100 % local : Ollama + FastEmbed, aucune sortie réseau).
- **Exports** :
  - **Markdown** : formatage propre pour la documentation ;
  - **PDF** : rendu professionnel via templates HTML (Jinja2) et `xhtml2pdf`.
- **Sonde `/health`** : statut de la base et du mode IA courant (utilisé par les moniteurs et le dashboard admin).

## 🛠️ Stack Technique

- **Framework** : FastAPI
- **Base de données** : PostgreSQL/Supabase en production, SQLite en local/tests (via SQLAlchemy)
- **Migrations** : Alembic
- **IA/Embeddings** : Groq (Llama) et/ou Ollama + FastEmbed
- **Sécurité** : JWT, Bcrypt, cookies httpOnly, rate limiting
- **Export** : Jinja2, xhtml2pdf, ReportLab

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

3. **Configurer l'environnement :**
   ```bash
   cp .env.example .env      # puis renseigner DATABASE_URL, JWT_SECRET_KEY, etc.
   ```

4. **Appliquer les migrations :**
   ```bash
   alembic upgrade head
   ```

5. **Lancer le serveur :**
   ```bash
   uvicorn app.main:app --reload
   ```

## 📚 Documentation API

Une fois lancé, accédez à la documentation interactive :
- **Swagger UI :** `http://localhost:8000/docs`
- **ReDoc :** `http://localhost:8000/redoc`

## 🧪 Tests

Exécutez la suite de tests depuis la **racine du monorepo** (le dossier parent de `backend/`) : le `conftest.py` importe `backend.app.main` et exige la racine sur le `PYTHONPATH`. La suite couvre l'authentification, l'admin, la recherche, l'export, le rate limiting, la révocation de tokens et le mode air-gapped.

```bash
PYTHONPATH=. pytest backend/tests/           # bash
$env:PYTHONPATH="."; pytest backend/tests/   # PowerShell
```

## 🌍 Déploiement (Render)

Un blueprint est fourni dans [`render.yaml`](../render.yaml) (service web `izwan-backend`) : il applique les migrations Alembic au démarrage puis lance `uvicorn app.main:app`. Les secrets (`DATABASE_URL`, `GROQ_API_KEY`, identifiants OAuth, `CORS_ORIGINS`, ...) se renseignent dans le dashboard Render.
