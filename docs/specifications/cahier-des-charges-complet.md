C'est un excellent plan de départ pour **Snippet Manager IA**. Je peux maintenant te préparer le **cahier des charges complet** comme proposé, avec tous les détails techniques pour démarrer le développement immédiatement.

> **Note historique** : version détaillée du cahier des charges du **MVP**. Le périmètre réel du projet a depuis évolué (voir les README des composants et la [feuille de route](../../ajout_supplementaires.md)).

Voici le cahier des charges complet de ton projet :

***

## 📋 Cahier des Charges : Snippet Manager IA

### 1. Fonctionnalités Détaillées

#### MVP (Phase 1)
| Fonctionnalité | Description |
|---|---|
| **Ajout de snippet** | Titre, langage de programmation, tags (manuels), code source, description |
| **Recherche** | Par mots-clés (titre, tags, description) + recherche par intention naturelle |
| **Copie rapide** | Bouton "Copier" dans l'interface pour copier le code dans le presse-papier |
| **Stockage local** | Base SQLite sur la machine de l'utilisateur |

#### Phase 2 (IA)
| Fonctionnalité | Description |
|---|---|
| **Génération automatique de tags** | IA propose des tags pertinents basés sur le code |
| **Génération de description** | IA crée une courte description naturelle du snippet |
| **Recherche sémantique** | Compréhension de l'intention ("fonction qui filtre un tableau par date") |

#### Phase 3 (Extensions)
| Fonctionnalité | Description |
|---|---|
| **Extension VS Code** | Accès aux snippets directement depuis l'éditeur |
| **Export Markdown** | Génération de documentation propre en .md |
| **Export PDF** | Documentation formatée en .pdf |

***

### 2. Schéma de Base de Données SQLite

```sql
-- Table principale des snippets
CREATE TABLE snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    tags TEXT,  -- JSON array stored as text: ["python", "filter", "date"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les tags (optionnelle, pour recherche plus rapide)
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- Table de liaison snippets-tags
CREATE TABLE snippet_tags (
    snippet_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (snippet_id, tag_id),
    FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Index pour optimiser la recherche
CREATE INDEX idx_snippets_title ON snippets(title);
CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_tags ON snippet_tags(tag_id);
```

***

### 3. Endpoints API Python (FastAPI)

#### Structure de l'API
```python
# Base URL: http://localhost:8000/api/v1

# ✅ CRUD Snippets
POST   /snippets              # Créer un nouveau snippet
GET    /snippets              # Lister tous les snippets (avec pagination)
GET    /snippets/{id}         # Récupérer un snippet spécifique
PUT    /snippets/{id}         # Mettre à jour un snippet
DELETE /snippets/{id}         # Supprimer un snippet

# 🔍 Recherche
GET    /snippets/search       # Recherche par mots-clés ?q=term&language=python
GET    /snippets/search/semantic  # Recherche sémantique IA ?query=fonction+filtre+date

# 🏷️ Tags
GET    /tags                  # Lister tous les tags
POST   /snippets/{id}/tags    # Ajouter des tags à un snippet
GET    /snippets/tag/{tag}    # Tous les snippets avec un tag donné

# 🤖 IA
POST   /ai/enrich             # Générer tags + description automatiquement
       Body: {code, language}

# 📤 Export
GET    /export/markdown       # Exporter tous les snippets en Markdown
GET    /export/pdf            # Exporter tous les snippets en PDF
```

#### Exemple de request/response
```python
# POST /snippets
Request:
{
  "title": "Filtre tableau par date",
  "language": "python",
  "code": "def filter_by_date(arr, date):\n    return [x for x in arr if x['date'] >= date]",
  "tags": ["python", "filter", "date"],
  "description": "Filtre un tableau d'objets par date minimale"
}

Response:
{
  "id": 1,
  "title": "Filtre tableau par date",
  "language": "python",
  "code": "...",
  "tags": ["python", "filter", "date"],
  "created_at": "2026-06-08T22:30:00Z"
}
```

***

### 4. Structure du Projet

```
snippet-manager-ia/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Point d'entrée FastAPI
│   │   ├── models.py            # Modèles SQLAlchemy/SQLite
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── snippets.py      # Routes snippets
│   │   │   ├── search.py        # Routes recherche
│   │   │   └── ai.py            # Routes IA
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── database.py      # Connexion SQLite
│   │   │   └── config.py        # Variables d'environnement
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── ai_service.py    # LangChain/intégration IA
│   │       └── export_service.py # Export Markdown/PDF
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
│
├── vscode-extension/
│   ├── src/
│   │   ├── extension.ts         # Code principal extension
│   │   ├── sidebar.ts           # Panel latéral VS Code
│   │   └── api.ts               # Appels à l'API Python
│   ├── package.json
│   └── README.md
│
├── frontend/ (optionnel - interface web minimale)
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── database/
│   └── snippets.db              # Fichier SQLite (généré automatiquement)
│
└── README.md
```

***

### 5. Technologies Recommandées

| Composant | Technologie | Pourquoi |
|---|---|---|
| **Backend API** | FastAPI (Python) | Rapide, automatique OpenAPI, async natif |
| **Base de données** | SQLite | Local, léger, pas de serveur à gérer |
| **IA** | LangChain + LLM local (Ollama) ou API (OpenAI) | Génération tags/description, recherche sémantique |
| **Embeddings** | Sentence Transformers (local) | Recherche sémantique hors ligne |
| **Extension VS Code** | TypeScript + VS Code Extension API | Intégration native éditeur |
| **Export PDF** | WeasyPrint ou ReportLab | Génération PDF depuis Markdown |
| **Interface** | Streamlit (rapide) ou React (plus flexible) | MVP rapide avec Streamlit |

***

### 6. Feuille de Route de Développement

| Étape | Tâche | Durée estimée |
|---|---|---|
| **1** | Définir champs snippet + créer schema SQLite | 1h |
| **2** | Créer API FastAPI de base (CRUD snippets) | 2h |
| **3** | Implémenter recherche par mots-clés | 2h |
| **4** | Créer interface minimale (Streamlit ou HTML/JS) | 3h |
| **5** | Tester copie rapide + ajouter tags | 1h |
| **6** | Intégrer IA pour génération tags/description | 4h |
| **7** | Ajouter recherche sémantique (embeddings) | 3h |
| **8** | Développer extension VS Code (connexion API) | 5h |
| **9** | Implémenter export Markdown | 2h |
| **10** | Implémenter export PDF | 3h |

**Total MVP complet**: ~15-20 heures de développement

***

### 7. Prochaines Actions Immédiates

Veux-tu que je :

1. **Génère le code complet du backend** (FastAPI + SQLite + CRUD) ?
2. **Crée le fichier `requirements.txt`** avec toutes les dépendances ?
3. **Prépare le script d'initialisation de la base SQLite** ?
4. **Développe l'interface Streamlit minimale** pour tester rapidement ?
5. **Crée le squelette de l'extension VS Code** ?

Dis-moi par quoi tu veux commencer et je te génère le code correspondant immédiatement ! 🚀