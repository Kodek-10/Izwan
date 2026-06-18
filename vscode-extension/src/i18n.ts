import * as vscode from 'vscode';

const translations: Record<string, Record<string, string>> = {
    fr: {
        'extension.active': 'Félicitations, votre extension "Izwa" est maintenant active !',
        'login.prompt.username': 'Nom d\'utilisateur',
        'login.prompt.password': 'Mot de passe',
        'login.success': 'Izwa: Connexion réussie !',
        'login.error': 'Izwa: Échec de la connexion. Vérifiez vos identifiants.',
        'search.prompt': 'Entrez votre recherche sémantique (ex: filtrer un tableau par date)',
        'search.placeholder': 'Recherche Izwa...',
        'search.no_results': 'Aucun résultat trouvé.',
        'search.select_placeholder': 'Sélectionnez un snippet à insérer',
        'capture.prompt.title': 'Entrez le titre du snippet',
        'capture.no_selection': 'Izwa: Veuillez d\'abord sélectionner du code dans l\'éditeur.',
        'capture.success': 'Izwa: Snippet sauvegardé avec succès !',
        'capture.error': 'Izwa: Échec de la sauvegarde du snippet.',
        'sidebar.search_placeholder': 'Rechercher un snippet...',
        'sidebar.loading': 'Chargement...',
        'sidebar.title': 'Izwa Snippets'
    },
    en: {
        'extension.active': 'Congratulations, your extension "Izwa" is now active!',
        'login.prompt.username': 'Username',
        'login.prompt.password': 'Password',
        'login.success': 'Izwa: Login successful!',
        'login.error': 'Izwa: Login failed. Check your credentials.',
        'search.prompt': 'Enter your semantic search (ex: filter an array by date)',
        'search.placeholder': 'Izwa Search...',
        'search.no_results': 'No results found.',
        'search.select_placeholder': 'Select a snippet to insert',
        'capture.prompt.title': 'Enter snippet title',
        'capture.no_selection': 'Izwa: Please select some code in the editor first.',
        'capture.success': 'Izwa: Snippet successfully saved!',
        'capture.error': 'Izwa: Failed to save snippet.',
        'sidebar.search_placeholder': 'Search a snippet...',
        'sidebar.loading': 'Loading...',
        'sidebar.title': 'Izwa Snippets'
    }
};

export function t(key: string): string {
    const lang = vscode.env.language.startsWith('fr') ? 'fr' : 'en';
    return translations[lang][key] || key;
}
