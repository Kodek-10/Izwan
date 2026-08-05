# Rapport de Test Frontend — Izwan

> **Note historique** : ce rapport documente les tests de la première version du prototype. L'application a depuis intégré l'authentification, le dashboard admin, les collections, la constellation, l'i18n, etc. Voir le [`README`](../../frontend/README.md) du frontend pour l'état actuel.

Ce rapport détaille les tests unitaires effectués et l'analyse de l'application du point de vue d'un testeur QA.

## 1. Tests Unitaires (Vitest)

Les tests suivants ont été implémentés et sont tous passés au vert :

- **`utils.test.ts`** : Vérifie la fusion correcte des classes Tailwind avec la fonction `cn`.
- **`button.test.tsx`** : Vérifie le rendu du composant Button, l'application des variants et des tailles, et l'état désactivé.
- **`app-shell.test.tsx`** : Vérifie le rendu de la barre latérale, du logo, du contenu enfant et le basculement du thème (Sombre/Clair).
- **`snippets.test.tsx`** : Vérifie la logique de filtrage par recherche textuelle sur la page des snippets.

## 2. Analyse QA (Exploratoire)

En tant que testeur, voici les points d'amélioration et les bugs identifiés dans le prototype actuel :

### A. Recherche (Search)
- **Bug** : La barre de recherche dans le header (`AppShell`) est statique. Elle ne déclenche aucune action et n'est pas synchronisée avec la recherche de la page des snippets.
- **Amélioration** : La recherche globale devrait permettre de trouver des snippets depuis n'importe quelle page.

### B. Notifications
- **Status** : Fixé. Le bouton de notification ouvre désormais un menu déroulant avec les dernières notifications.
- **Test** : Un test unitaire a été ajouté dans `app-shell.test.tsx` pour vérifier cette fonctionnalité.

### C. Gestion des Snippets
- **Bug** : Le formulaire "Nouveau Snippet" (`/snippets/new`) n'est pas fonctionnel. Les champs Titre, Description et Code ne sont pas reliés à un état et les données ne sont pas enregistrées lors du clic sur "Enregistrer".
- **Manque** : Absence de validation. Il est possible de valider un snippet vide.
- **Manque** : Absence de persistance (même temporaire en mémoire) pour les nouveaux snippets.

### C. Design Adaptatif (Responsive)
- **Bug Majeur** : Absence de menu mobile. Sur les écrans de petite taille, la barre latérale disparaît (`hidden md:flex`) mais aucun bouton "hamburger" n'est présent pour accéder à la navigation. L'application est donc inutilisable sur mobile.

### D. IA Assistant
- **Observation** : Les fonctionnalités de génération de tags et de descriptions utilisent des réponses statiques (mock). C'est correct pour un prototype, mais une intégration réelle avec un backend sera nécessaire.

### E. Navigation
- **Observation** : Certains liens dans le tableau de bord (comme "Voir tous") fonctionnent correctement, mais d'autres parties de l'interface (comme les actions "Plus" sur les snippets) ne sont pas encore implémentées.

## 3. Recommandations
1. **Implémenter un menu mobile** (Sheet/Drawer) pour permettre la navigation sur smartphone.
2. **Connecter les formulaires** au State ou à React Hook Form pour la gestion des données.
3. **Synchroniser la recherche du header** avec les pages de contenu ou implémenter une commande `CMD+K`.
4. **Ajouter des tests d'intégration** pour le flux de création de snippet une fois que le formulaire sera fonctionnel.
