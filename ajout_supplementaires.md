# 🗺️ Feuille de Route Détaillée : Écosystème Izwan

Ce document propose une vision approfondie et pédagogique des évolutions du projet. Chaque étape est expliquée pour comprendre non seulement **ce que** nous allons faire, mais surtout **pourquoi** et **comment**.

---

## 🏗️ ÉTAPE 1 : Amélioration de l'Extension VS Code (Productivité) - [FAIT] ✅

_L'objectif est de transformer l'extension d'un simple visualiseur en un véritable outil de capture et de compréhension du code sans quitter l'éditeur._

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

## 🛡️ ÉTAPE 2 : Infrastructure Admin & Sécurité (Déploiement) - [FAIT] ✅

_Préparer l'application pour le monde réel en isolant les fonctions critiques de gestion des fonctions utilisateurs._

### 2.1 - Migration du Modèle "User" - [FAIT] ✅

- **Pourquoi ?** Un système pro nécessite de distinguer celui qui _utilise_ le service de celui qui le _gère_.
- **Comment ?** Modifier le modèle User pour supporter les rôles (`USER`, `ADMIN`). Le token JWT porte désormais ce rôle pour que le backend sache immédiatement à qui il parle.

### 2.2 - Sécurisation du Backend par Étanchéité - [FAIT] ✅

- **Pourquoi ?** Empêcher qu'un utilisateur malveillant puisse appeler des fonctions de gestion (ex: supprimer d'autres utilisateurs).
- **Comment ?** Un "Router" dédié aux admins sous `/api/v1/admin/`, protégé par un "Garde de Rôle" (Role Guard). Si le rôle dans le JWT n'est pas "ADMIN", la requête est rejetée avant même de toucher la logique métier. Complété par un journal d'audit, du rate limiting sur les endpoints IA et la révocation des tokens.

### 2.3 - Frontend Admin Isolé (Option B retenue : dashboard intégré) - [FAIT] ✅

- **Pourquoi ?** Faciliter la gestion pour les admins sans multiplier les domaines.
- **Comment ?** Le dashboard admin est intégré à la même application sous `/admin` (routes `admin.*`), avec navigation dédiée et garde de rôle côté frontend. Option A (sous-domaine séparé) reste possible ultérieurement.

---

## ✨ ÉTAPE 3 : Unicité et Valeur Ajoutée (Différenciation) - [FAIT] ✅

_Ce qui fera qu'un développeur choisira Izwan plutôt qu'un simple fichier texte ou une autre application._

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

## 🔒 ÉTAPE 4 : Souveraineté et Confidentialité (Privacy) - [FAIT] ✅

_Garantir que l'outil est utilisable dans des environnements ultra-sécurisés (banques, défense, etc.)._

### 4.1 - Certification "Air-gapped" (100% Local) - [FAIT] ✅

- **Pourquoi ?** Pour les entreprises qui interdisent l'envoi de code vers le cloud (OpenAI/Claude).
- **Comment ?** Optimisation du backend pour détecter et n'utiliser qu'Ollama (pour la génération) et FastEmbed (pour la recherche). Une option dans les réglages permet de couper toute velléité d'appel réseau externe.

### 4.2 - Suggestions Proactives (Ghost Snippets) - [FAIT] ✅

- **Pourquoi ?** Gagner du temps avant même de chercher.
- **Comment ?** L'extension analyse en temps réel (et localement) ce que l'utilisateur tape. Si le début d'une fonction ressemble à un snippet connu, il apparaît en gris clair (fantôme). Une touche `Tab` et le snippet est inséré.

---

## 🚀 ÉTAPE 5 : Gestion des Snippets Longs (Performance & Scalabilité)

_Permettre à Izwan de manipuler des fichiers de code complets sans perte de précision ou de confort._

### 5.1 - Recherche Sémantique Profonde (Chunking) - [FAIT] ✅

- **Pourquoi ?** Actuellement, la recherche sémantique ne "lit" que le début des snippets longs (limite de ~500 tokens).
- **Comment ?** Découper les snippets longs en segments (chunks) et générer un vecteur d'embedding pour chaque segment. Cela permet de retrouver un snippet même si le mot-clé se trouve à la ligne 1000.

### 5.2 - Contexte IA Étendu (Large Context Window) - [FAIT] ✅

- **Pourquoi ?** L'IA locale (Ollama) ou distante (Groq) peut perdre le fil si le snippet est trop long ou si le contexte global est saturé.
- **Comment ?** Configurer dynamiquement la fenêtre de contexte dans `ai_service.py` selon la taille du code et les capacités du hardware local, ou utiliser des modèles à large contexte (ex: Llama 3.1 128k via Groq).

### 5.3 - Interface Adaptative (Fluid Editor) - [FAIT] ✅

- **Pourquoi ?** Un champ de texte fixe est inconfortable pour de gros fichiers ou des scripts complexes.
- **Comment ?** Remplacer le `Textarea` classique par un éditeur de code plus robuste (type Monaco ou CodeMirror) avec auto-expansion, mode plein écran, et "minimap" pour naviguer dans les longs scripts.

---

## 🔐 ÉTAPE 6 : Simplification de l'Authentification VS Code - [FAIT] ✅

_Améliorer l'expérience de connexion pour l'extension Izwan afin de la rendre plus fluide et sécurisée._

### 6.1 - Option B : Authentification par Navigateur (OAuth Flow) - [FAIT] ✅

- **Pourquoi ?** Offrir une expérience "un clic" sans aucune saisie de texte dans VS Code, comme les extensions professionnelles (GitHub, Sentry).
- **Comment ?**
  1.  **Déclenchement** : L'utilisateur clique sur "Se connecter" dans VS Code.
  2.  **Ouverture navigateur** : VS Code ouvre la page d'authentification Izwan avec un `redirect_uri` sécurisé et un `state` anti-CSRF.
  3.  **Validation Web** : L'utilisateur se connecte depuis l'interface web Izwan existante.
  4.  **Retour VS Code** : Le navigateur renvoie le jeton à VS Code via le callback d'URL (`vscode://kodek10.izwa-vscode/auth`, compatible avec le protocole historique `izwan://auth`).
  5.  **Stockage sécurisé** : L'extension valide le `state`, stocke le jeton dans `context.secrets`, puis rafraîchit les snippets et les suggestions fantômes.

---

## 🖥️ ÉTAPE 7 : Version Desktop Autonome (Electron/Tauri) - [FAIT] ✅

_Transformer Izwan d'une application web locale en un véritable logiciel téléchargeable et installable (`.exe`, `.dmg`)._

### 7.1 - Packaging avec Electron ou Tauri - [FAIT] ✅

- **Pourquoi ?** Faciliter l'installation pour l'utilisateur final qui ne veut pas manipuler de terminal ou installer Python/Node manuellement.
- **Comment ?**
  1.  **Conteneur Desktop** : Ajout d'une application Electron dédiée dans `desktop/` qui encapsule le frontend React dans une fenêtre native.
  2.  **Backend embarqué** : Ajout d'un point d'entrée `backend/desktop_entry.py` et d'une configuration PyInstaller pour générer un binaire `izwan-backend`, avec fallback de développement via `python -m uvicorn`.
  3.  **Installateurs standards** : Configuration `electron-builder` pour générer des installateurs Windows (`NSIS`), macOS (`DMG`) et Linux (`AppImage`/`deb`).

### 7.2 - Fonctionnalités Natives - [FAIT] ✅

- **Pourquoi ?** Profiter des capacités du système d'exploitation que le navigateur ne permet pas.
- **Comment ?**
  1.  **Global Shortcut** : Raccourci global `Alt + Space` pour afficher Izwan et focaliser rapidement la recherche.
  2.  **Systray** : Icône de barre système avec actions rapides : ouvrir Izwan, lancer la recherche rapide, démarrer Ollama local et quitter proprement.
  3.  **Mode Hors-ligne complet** : Orchestration locale du backend SQLite dans le dossier utilisateur de l'application et prise en charge d'un binaire Ollama embarqué ou installé sur la machine.

---

## 📌 Historique des discussions

_(Les nouveaux points abordés seront ajoutés en respectant cette structure)_

---

_Note : état de la feuille de route au moment de la rédaction ; l'avancée réelle par composant est décrite dans les README de `backend/`, `frontend/`, `desktop/` et `vscode-extension/`._

_Statut : toutes les étapes 1 à 7 sont réalisées._
