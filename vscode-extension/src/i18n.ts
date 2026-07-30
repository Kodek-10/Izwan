import * as vscode from 'vscode';

const translations: Record<string, Record<string, string>> = {
    fr: {
        'extension.active': 'Félicitations, votre extension "Izwan" est maintenant active !',
        'login.browser_open_error': 'Izwan: Impossible d\'ouvrir le navigateur pour la connexion.',
        'login.callback_error': 'Izwan: Callback de connexion invalide ou expiré.',
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
        'sidebar.title': 'Izwan Snippets',
        'sidebar.load_error': 'Impossible de charger les snippets.',
        'sidebar.retry': 'Réessayer',
        'session_expired': 'Izwan: Session expirée ou non connectée. Veuillez vous connecter.',
        'connection_error': 'Izwan: Impossible de se connecter au backend. Vérifiez l\'URL et assurez-vous qu\'il est lancé.',
        'smart_insert.no_editor': 'Aucun éditeur actif pour insérer le snippet.',
        'smart_insert.in_progress': 'Adaptation du snippet en cours (IA)...',
        'smart_insert.error_fallback': 'Erreur lors de l\'adaptation. Insertion standard...',
        'explanation.in_progress': '⏳ Analyse en cours par l\'IA...',
        'explanation.error': '❌ Erreur lors de la génération de l\'explication.',
        'explanation.title': 'Explication'
    },
    en: {
        'extension.active': 'Congratulations, your extension "Izwan" is now active!',
        'login.browser_open_error': 'Izwan: Could not open the browser sign-in page.',
        'login.callback_error': 'Izwan: Invalid or expired sign-in callback.',
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
        'sidebar.title': 'Izwan Snippets',
        'sidebar.load_error': 'Failed to load snippets.',
        'sidebar.retry': 'Retry',
        'session_expired': 'Izwan: Session expired or not logged in. Please log in.',
        'connection_error': 'Izwan: Unable to connect to the backend. Check the URL and make sure it is running.',
        'smart_insert.no_editor': 'No active editor to insert the snippet.',
        'smart_insert.in_progress': 'Adapting snippet with AI...',
        'smart_insert.error_fallback': 'Adaptation error. Inserting standard snippet...',
        'explanation.in_progress': '⏳ AI analysis in progress...',
        'explanation.error': '❌ Error generating explanation.',
        'explanation.title': 'Explanation'
    }
};

export function t(key: string): string {
    const lang = vscode.env.language.startsWith('fr') ? 'fr' : 'en';
    return translations[lang][key] || key;
}
