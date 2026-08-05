# Izwan - Extension VS Code

Cette extension vous permet d'accéder à vos snippets Izwan directement depuis votre éditeur.

## Fonctionnalités

- **Sidebar Izwan** : visualisez tous vos snippets dans une barre latérale dédiée.
- **Insertion en un clic** : cliquez sur un snippet pour l'insérer à l'emplacement de votre curseur.
- **Enregistrer depuis l'éditeur** (`izwan.saveSnippet`) : sélectionnez du code, un menu contextuel ou la palette de commandes l'enregistre dans Izwan.
- **Recherche sémantique** : QuickPick pour trouver un snippet par intention via le backend.
- **Suggestions fantômes** : analyse locale de ce que vous tapez pour proposer d'insérer un snippet connu.
- **Authentification OAuth navigateur** (v0.0.5) : connexion en un clic, sans saisir de mot de passe, via le flux navigateur - retour vers VS Code (`vscode://kodek10.izwan-vscode/auth`, protocole historique `izwan://auth` compatible), token stocké dans `context.secrets`.
- **Internationalisation** française / anglaise.

## Installation & Développement

1. Ouvrez le dossier `vscode-extension` dans VS Code.
2. Exécutez `npm install` dans le terminal.
3. Appuyez sur `F5` pour lancer une nouvelle instance de VS Code avec l'extension chargée.

## Configuration

Par défaut, l'extension se connecte au backend **de production** `https://izwan-backend.onrender.com/api/v1`.

Pour utiliser une autre instance (ex. locale) :
1. Allez dans les **Paramètres** de VS Code (`Ctrl+,`).
2. Recherchez **"Izwan: Backend Url"**.
3. Entrez l'URL de votre API (ex. `http://localhost:8000/api/v1`).
4. Utilisez la commande **`Izwan: Se connecter`** pour vous authentifier sur le serveur.

> Pour le backend local, pensez à ajouter l'URL autorisée dans `CORS_ORIGINS` du backend.

## Installation (Utilisateurs)

Pour partager l'extension sans la publier sur le Marketplace :
1. Installez `vsce` : `npm install -g @vscode/vsce`
2. Générez le package : `vsce package`
3. Partagez le fichier `.vsix` généré. Vos collègues pourront l'installer via "Install from VSIX..." dans l'onglet Extensions de VS Code.