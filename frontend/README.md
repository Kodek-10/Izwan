# Izwan - Frontend

Interface web moderne et réactive pour gérer vos snippets de code, ainsi que le **dashboard administrateur**, construite avec l'écosystème React.

## ✨ Fonctionnalités

- **Landing page** : présentation, hero animé (WebGL), CTA et téléchargements (desktop).
- **Authentification** : connexion / inscription, OAuth Google & GitHub, sessions via cookie httpOnly.
- **Dashboard** : statistiques et derniers snippets.
- **Gestion des snippets** : éditeur complet multi-langages, création/édition/suppression.
- **Collections & Favoris** : organisez et épinglez vos snippets.
- **Recherche intelligente** : interface de recherche hybride (mots-clés + sémantique).
- **Constellation** : vue 2D interactive reliant les snippets partagés par tags.
- **Assistant IA flottant** : explication de code et assistance depuis l'interface.
- **Export** : téléchargement Markdown / PDF.
- **Admin** : gestion des utilisateurs, rôles & permissions, audit, stats IA et santé système.
- **Dark mode** et **i18n** (français / anglais).

## 🛠️ Stack Technique

- **Framework** : React 19 + TanStack Start (SSR) / Vite
- **Routage** : TanStack Router (file-based, type-safe)
- **Gestion d'état / données** : TanStack Query
- **Stylisation** : Tailwind CSS 4 + Shadcn/UI (Radix UI)
- **Validation** : Zod + React Hook Form
- **Animations** : Framer Motion, GSAP
- **Internationalisation** : i18next (FR / EN)
- **Tests** : Vitest

## 🚀 Installation

1. **Installer les dépendances (Bun recommandé) :**
   ```bash
   bun install
   # ou
   npm install
   ```

2. **Lancer l'application en mode développement :**
   ```bash
   bun run dev
   # ou
   npm run dev
   ```

3. **Build pour la production :**
   ```bash
   bun run build
   ```

4. **(Optionnel) Configuration de l'API :**
   Copier `.env.example` en `.env.local` et définir `VITE_API_URL` (par défaut `http://localhost:8000/api/v1`).

## 📂 Structure des Routes

Le routage est basé sur les fichiers de TanStack Router :

**Publiques**
- `/` : landing page
- `/auth` : connexion
- `/signup` : inscription

**Application (authentifiée, sous `AppShell`)**
- `/dashboard` : tableau de bord utilisateur
- `/snippets` : liste et recherche
- `/snippets/new` : création de snippet
- `/snippets/:id` : détail / édition
- `/collections` et `/collections/:id` : gestion des collections
- `/favorites` : favoris
- `/constellation` : vue graphe des snippets
- `/export` : export Markdown / PDF
- `/settings` : paramètres du compte
- `/assistant` : assistant IA

**Administration** (sous `/admin`, réservé au rôle `ADMIN`)
- `/admin` : tableau de bord admin
- `/admin/users` : gestion des utilisateurs
- `/admin/snippets` : modération des snippets
- `/admin/ia-systeme` : statut IA & système
- `/admin/audit` : journal d'audit
- `/admin/roles` : rôles & permissions

## 🎨 Composants

Les composants UI sont basés sur **Radix UI** stylisés avec **Tailwind**, garantissant accessibilité et esthétique moderne.