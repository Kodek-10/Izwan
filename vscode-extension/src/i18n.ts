import * as vscode from 'vscode';

const translations: Record<string, Record<string, string>> = {
    fr: {
        'extension.active': 'Félicitations, votre extension "Izwan" est maintenant active !',
        'login.prompt.username': 'Nom d\'utilisateur',
        'login.prompt.password': 'Mot de passe',
        'login.success': 'Izwan: Connexion réussie !',
        'login.error': 'Izwan: Échec de la connexion. Vérifiez vos identifiants.',
        'search.prompt': 'Entrez votre recherche sémantique (ex: filtrer un tableau par date)',
        'search.placeholder': 'Recherche Izwan...',
        'search.no_results': 'Aucun résultat trouvé.',
        'search.select_placeholder': 'Sélectionnez un snippet à insérer',
        'capture.prompt.title': 'Entrez le titre du snippet',
        'capture.no_selection': 'Izwan: Veuillez d\'abord sélectionner du code dans l\'éditeur.',
        'capture.success': 'Izwan: Snippet sauvegardé avec succès !',
        'capture.error': 'Izwan: Échec de la sauvegarde du snippet.',
        'sidebar.search_placeholder': 'Rechercher un snippet...',
        'sidebar.loading': 'Chargement...',
        'sidebar.title': 'Izwan Snippets'
    },
    en: {
        'extension.active': 'Congratulations, your extension "Izwan" is now active!',
        'login.prompt.username': 'Username',
        'login.prompt.password': 'Password',
        'login.success': 'Izwan: Login successful!',
        'login.error': 'Izwan: Login failed. Check your credentials.',
        'search.prompt': 'Enter your semantic search (ex: filter an array by date)',
        'search.placeholder': 'Izwan Search...',
        'search.no_results': 'No results found.',
        'search.select_placeholder': 'Select a snippet to insert',
        'capture.prompt.title': 'Enter snippet title',
        'capture.no_selection': 'Izwan: Please select some code in the editor first.',
        'capture.success': 'Izwan: Snippet successfully saved!',
        'capture.error': 'Izwan: Failed to save snippet.',
        'sidebar.search_placeholder': 'Search a snippet...',
        'sidebar.loading': 'Loading...',
        'sidebar.title': 'Izwan Snippets'
    }
};

export function t(key: string): string {
    const lang = vscode.env.language.startsWith('fr') ? 'fr' : 'en';
    return translations[lang][key] || key;
}
