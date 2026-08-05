Cahier des charges — Snippet Manager IA

> **Note historique** : ce cahier des charges correspond au **MVP initial**. L'implémentation actuelle va bien au-delà (JWT + cookies httpOnly, OAuth Google/GitHub, rôles USER/ADMIN, dashboard admin, collections, favoris, constellation, mode air-gapped, multiplateforme). Voir la [feuille de route](../../ajout_supplementaires.md) et les README des composants pour l'état réel.

## 1. Contexte et objectif
Snippet Manager IA est un outil personnel de gestion de snippets destiné à centraliser, retrouver et réutiliser rapidement des morceaux de code. L’objectif est de gagner du temps, de garder une trace propre des solutions passées et, à terme, d’intégrer une extension VS Code pour utiliser les snippets directement dans l’éditeur.

## 2. Vision du projet
Le projet doit permettre de stocker des snippets localement, de les rechercher en langage naturel, d’ajouter automatiquement des tags et une description grâce à l’IA, puis d’exporter le contenu en Markdown ou PDF. La première version doit rester simple, rapide à développer et utile au quotidien.

## 3. Objectifs principaux
- Centraliser tous les snippets dans une base locale.
- Rechercher un snippet par mots-clés ou par intention.
- Copier un snippet en un clic.
- Ajouter automatiquement des tags et une description.
- Préparer une évolution vers une extension VS Code.
- Permettre l’export de la base en Markdown et en PDF.

## 4. Périmètre du MVP
Le MVP doit inclure uniquement les fonctions essentielles suivantes :
- Ajout d’un snippet.
- Modification d’un snippet.
- Suppression d’un snippet.
- Recherche simple par mots-clés.
- Copie rapide du code.
- Stockage local via SQLite.

## 5. Fonctionnalités détaillées

### 5.1 Gestion des snippets
Chaque snippet doit contenir au minimum :
- Un titre.
- Un langage.
- Un code source.
- Une description.
- Des tags.
- Une date de création.
- Une date de mise à jour.

### 5.2 Recherche
Le système doit permettre :
- La recherche par titre.
- La recherche par tags.
- La recherche par description.
- La recherche par intention naturelle, par exemple : « fonction qui filtre un tableau par date ».

### 5.3 Copie rapide
L’utilisateur doit pouvoir copier le code d’un snippet en un seul clic depuis l’interface principale.

### 5.4 Enrichissement par IA
L’IA doit pouvoir :
- Proposer des tags pertinents.
- Générer une courte description.
- Aider à améliorer la recherche sémantique.

### 5.5 Export
Le projet doit permettre :
- L’export complet en Markdown.
- L’export complet en PDF.

## 6. Exigences fonctionnelles
- L’application doit fonctionner en local.
- L’utilisateur doit pouvoir ajouter, lire, modifier et supprimer des snippets.
- L’utilisateur doit pouvoir rechercher rapidement un snippet.
- L’application doit être simple à utiliser.
- Les données doivent être sauvegardées dans une base locale.

## 7. Exigences non fonctionnelles
- L’application doit être rapide.
- L’architecture doit rester simple et évolutive.
- L’interface doit être claire et minimale.
- Le stockage local doit éviter la dépendance au cloud au début.
- Le projet doit être structuré pour accueillir une extension VS Code plus tard.

## 8. Architecture technique proposée
- Backend : Python avec FastAPI.
- Base de données : SQLite.
- IA : LangChain ou un service équivalent.
- Interface : page web minimale ou Streamlit.
- Extension éditeur : VS Code en TypeScript.
- Export PDF : WeasyPrint ou ReportLab.

## 9. Schéma de base de données

### Table `snippets`
- id : identifiant unique.
- title : titre du snippet.
- language : langage de programmation.
- code : contenu du code.
- description : courte description.
- tags : liste de tags.
- created_at : date de création.
- updated_at : date de mise à jour.

### Tables optionnelles
- `tags` : table des tags normalisés.
- `snippet_tags` : table de liaison entre snippets et tags.

## 10. API proposée

### CRUD snippets
- `POST /snippets` : créer un snippet.
- `GET /snippets` : lister les snippets.
- `GET /snippets/{id}` : récupérer un snippet.
- `PUT /snippets/{id}` : mettre à jour un snippet.
- `DELETE /snippets/{id}` : supprimer un snippet.

### Recherche
- `GET /snippets/search` : recherche par mots-clés.
- `GET /snippets/search/semantic` : recherche sémantique.

### IA
- `POST /ai/enrich` : générer tags et description.

### Export
- `GET /export/markdown` : exporter en Markdown.
- `GET /export/pdf` : exporter en PDF.

## 11. Structure du projet
- `backend/` : API et logique métier.
- `vscode-extension/` : extension VS Code.
- `frontend/` : interface légère si nécessaire.
- `database/` : fichier SQLite.
- `README.md` : documentation principale.

## 12. Critères de réussite
Le projet sera considéré comme réussi si :
- l’ajout et la recherche de snippets sont fluides,
- les snippets sont bien stockés localement,
- la copie rapide fonctionne correctement,
- l’IA améliore réellement l’organisation des snippets,
- l’export Markdown et PDF est fonctionnel.

## 13. Évolution future
Après le MVP, le projet pourra évoluer vers :
- une extension VS Code complète,
- une recherche sémantique plus avancée,
- un système de favoris,
- des catégories de snippets,
- une synchronisation cloud optionnelle.

## 14. Priorité de développement
1. Créer la base SQLite.
2. Développer le backend FastAPI.
3. Ajouter la recherche simple.
4. Construire une interface minimale.
5. Ajouter la copie rapide.
6. Intégrer l’IA.
7. Ajouter l’export Markdown et PDF.
8. Préparer l’extension VS Code.

## 15. Conclusion
Snippet Manager IA est un projet utile, réaliste et évolutif. La meilleure approche consiste à commencer par un MVP simple, puis à enrichir progressivement l’outil avec l’IA et l’intégration à VS Code.