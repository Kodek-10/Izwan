# 🗺️ Feuille de Route Détaillée : Écosystème Izwan

Ce document propose une vision approfondie et pédagogique des évolutions du projet. Chaque étape est expliquée pour comprendre non seulement **ce que** nous allons faire, mais surtout **pourquoi** et **comment**.

---

## 🏗️ ÉTAPE 1 : Amélioration de l'Extension VS Code (Productivité) - [FAIT] ✅
*L'objectif est de transformer l'extension d'un simple visualiseur en un véritable outil de capture et de compréhension du code sans quitter l'éditeur.*

### 1.1 - Flux de données bidirectionnel (Capture de code) - [FAIT] ✅
- **Pourquoi ?** Actuellement, pour ajouter un snippet, l'utilisateur doit quitter VS Code. Cela brise le "flow" de travail.
- **Comment ?** 
    1.  **Sélection** : L'utilisateur sélectionne un bloc de code dans l'éditeur.
    2.  **Commande** : Via un clic droit (menu contextuel) ou `Ctrl+Shift+P`, il lance "Save to Izwan".
    3.  **Collecte** : L'extension récupère le texte sélectionné, le langage du fichier (via l'extension du fichier) et demande un titre via une petite fenêtre d'input.
    4.  **Envoi** : Le code est envoyé au backend via `POST /snippets/`. L'IA s'occupe de générer les tags et la description en arrière-plan.

### 1.2 - Expérience Utilisateur Riche (UI/UX Sidebar) - [FAIT] ✅
- **Pourquoi ?** Une liste plate devient illisible avec le temps. L'utilisateur a besoin de repères visuels.
- **Comment ?**
    - **Tree View** : Utiliser les composants d'arborescence de VS Code pour regrouper les snippets par "Collections".
    - **Syntax Highlighting** : Intégrer `Prism.js` dans la Webview pour colorer le code affiché dans les aperçus.
    - **Badges** : Afficher des pastilles de couleur (ex: jaune pour JS, bleu pour Python) pour une identification instantanée.

### 1.3 - Intelligence Contextuelle (Explication) - [FAIT] ✅
- **Pourquoi ?** On oublie parfois pourquoi on a sauvegardé un code complexe. L'IA peut servir de tuteur.
- **Comment ?** Ajouter une icône d'aide sur chaque carte de snippet. Au clic, l'extension appelle le service IA qui analyse le code et renvoie une explication structurée en Markdown affichée directement dans la barre latérale.

---

## 🛡️ ÉTAPE 2 : Infrastructure Admin & Sécurité (Déploiement)
*Préparer l'application pour le monde réel en isolant les fonctions critiques de gestion des fonctions utilisateurs.*

### 2.1 - Migration du Modèle "User"
- **Pourquoi ?** Un système pro nécessite de distinguer celui qui *utilise* le service de celui qui le *gère*.
- **Comment ?** Modifier la base de données pour passer d'un simple utilisateur à un système de rôles (`Enum: USER, ADMIN`). Le token JWT portera désormais ce rôle pour que le backend sache immédiatement à qui il parle.

### 2.2 - Sécurisation du Backend par Étanchéité
- **Pourquoi ?** Empêcher qu'un utilisateur malveillant puisse appeler des fonctions de gestion (ex: supprimer d'autres utilisateurs).
- **Comment ?** Créer un "Router" dédié aux admins. Toutes les routes sous `/api/v1/admin/` seront protégées par un "Garde de Rôle" (Role Guard). Si le rôle dans le JWT n'est pas "ADMIN", la requête est rejetée avant même de toucher la logique métier.

### 2.3 - Frontend Admin Isolé (Option A)
- **Pourquoi ?** Sécurité par l'obscurité et performance. L'utilisateur n'a pas besoin de charger le code de l'interface d'administration.
- **Comment ?** Déployer deux sites web distincts. L'application utilisateur (`app.izwan.com`) et le dashboard admin (`admin.izwan.com`). L'admin aura accès à des graphiques de charge, la gestion des comptes et la maintenance des modèles d'IA.

---

## ✨ ÉTAPE 3 : Unicité et Valeur Ajoutée (Différenciation) - [FAIT] ✅
*Ce qui fera qu'un développeur choisira Izwan plutôt qu'un simple fichier texte ou une autre application.*

### 3.1 - Smart Insertion (Adaptation intelligente) - [FAIT] ✅
- **Pourquoi ?** Copier-coller demande souvent de renommer les variables après coup pour que le code compile.
- **Comment ?** Avant l'insertion, l'extension envoie le snippet et les 20 lignes autour du curseur à l'IA. L'IA renvoie le code du snippet où les noms de variables ont été ajustés pour correspondre au contexte actuel.

### 3.2 - Polyglottisme (Vibe-Converter) - [FAIT] ✅
- **Pourquoi ?** Un bon algorithme est universel, mais sa syntaxe change selon le langage.
- **Comment ?** Un bouton "Traduire" dans l'interface web qui permet de générer une version TypeScript d'un snippet Python (par exemple) et de la sauvegarder automatiquement comme une nouvelle version ou un nouveau snippet lié.

### 3.3 - Graph de Constellation (Visualisation) - [FAIT] ✅
- **Pourquoi ?** Pour découvrir des liens entre des morceaux de code qu'on n'avait pas vus (ex: tous les snippets qui utilisent telle API ou tel pattern de sécurité).
- **Comment ?** Une vue 2D interactive où chaque snippet est un point, et les liens sont créés par les tags communs ou les recommandations de l'IA.

---

## 🔒 ÉTAPE 4 : Souveraineté et Confidentialité (Privacy)
*Garantir que l'outil est utilisable dans des environnements ultra-sécurisés (banques, défense, etc.).*

### 4.1 - Certification "Air-gapped" (100% Local) - [FAIT] ✅
- **Pourquoi ?** Pour les entreprises qui interdisent l'envoi de code vers le cloud (OpenAI/Claude).
- **Comment ?** Optimisation du backend pour détecter et n'utiliser qu'Ollama (pour la génération) et FastEmbed (pour la recherche). Une option dans les réglages permet de couper toute velléité d'appel réseau externe.

### 4.2 - Suggestions Proactives (Ghost Snippets) - [FAIT] ✅
- **Pourquoi ?** Gagner du temps avant même de chercher.
- **Comment ?** L'extension analyse en temps réel (et localement) ce que l'utilisateur tape. Si le début d'une fonction ressemble à un snippet connu, il apparaît en gris clair (fantôme). Une touche `Tab` et le snippet est inséré.

---

## 📌 Historique des discussions
*(Les nouveaux points abordés seront ajoutés en respectant cette structure)*

---
*Note : Ce fichier est mis à jour par Gemini CLI tant que la discussion porte sur l'amélioration de l'application.*
