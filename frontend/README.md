# Izwan - Frontend

Une interface utilisateur moderne et réactive pour gérer vos snippets de code, construite avec les dernières technologies de l'écosystème React.

## ✨ Fonctionnalités
- **Dashboard :** Vue d'ensemble de vos statistiques et derniers snippets.
- **Gestion des Snippets :** Éditeur complet avec support multi-langages.
- **Recherche Intelligente :** Interface de recherche hybride (mots-clés et sémantique).
- **Collections & Favoris :** Organisez vos snippets préférés.
- **Export :** Téléchargement direct de vos snippets en PDF ou Markdown.
- **Dark Mode :** Support complet du thème sombre/clair.

## 🛠️ Stack Technique
- **Framework :** React 19 + Vite
- **Routage :** TanStack Router (Type-safe)
- **Gestion d'état :** TanStack Query
- **Stylisation :** Tailwind CSS 4 + Shadcn/UI
- **Validation :** Zod + React Hook Form

## 🚀 Installation

1. **Installer les dépendances (Bun recommandé) :**
   ```bash
   bun install
   # ou
   npm install
   ```

2. **Lancer l'application en mode développement :**
   ```bash
   bun dev
   # ou
   npm run dev
   ```

3. **Build pour la production :**
   ```bash
   bun run build
   ```

## 📂 Structure des Routes
Le projet utilise le routage basé sur les fichiers de TanStack Router :
- `/auth` : Connexion / Inscription
- `/dashboard` : Accueil utilisateur
- `/snippets` : Liste et recherche
- `/snippets/new` : Création de snippet
- `/settings` : Paramètres du compte
- `/statistics` : Visualisation des données

## 🎨 Composants
Les composants UI sont basés sur **Radix UI** et stylisés avec **Tailwind**, garantissant une accessibilité et une esthétique moderne.
