# Izwa - Extension VS Code

Cette extension vous permet d'accéder à vos snippets Izwa directement depuis votre éditeur.

## Fonctionnalités

- **Sidebar Izwa** : Visualisez tous vos snippets dans une barre latérale dédiée.
- **Insertion en un clic** : Cliquez sur un snippet pour l'insérer à l'emplacement de votre curseur.
- **Recherche rapide** : Recherchez vos snippets par titre directement dans la sidebar.
- **Commande de rafraîchissement** : Mettez à jour la liste depuis votre base locale.

## Installation & Développement

1. Ouvrez le dossier `vscode-extension` dans VS Code.
2. Exécutez `npm install` dans le terminal.
3. Appuyez sur `F5` pour lancer une nouvelle instance de VS Code avec l'extension chargée.

## Configuration

Par défaut, l'extension se connecte à `http://localhost:8000`.
Pour l'utiliser avec une version déployée (ex: sur Render ou Hugging Face) :
1. Allez dans les **Paramètres** de VS Code (`Ctrl+,`).
2. Recherchez **"Izwa: Backend Url"**.
3. Entrez l'URL de votre API déployée (ex: `https://izwa-api.onrender.com/api/v1`).
4. Utilisez la commande **`Izwa: Se connecter`** pour vous authentifier sur le serveur distant.

## Installation (Utilisateurs)

Si vous voulez partager l'extension sans la publier sur le Marketplace :
1. Installez `vsce` : `npm install -g @vscode/vsce`
2. Générez le package : `vsce package`
3. Partagez le fichier `.vsix` généré. Vos amis pourront l'installer via le menu "Install from VSIX..." de l'onglet Extensions de VS Code.
