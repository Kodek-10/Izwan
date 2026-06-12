import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fr: {
    translation: {
      "nav": {
        "dashboard": "Tableau de bord",
        "snippets": "Snippets",
        "favorites": "Favoris",
        "collections": "Collections",
        "assistant": "IA Assistant",
        "statistics": "Statistiques",
        "export": "Exportations",
        "settings": "Paramètres"
      },
      "favorites": {
        "title": "Mes Favoris",
        "loading": "Chargement de vos favoris...",
        "empty": "Aucun favori pour le moment."
      },
      "assistant": {
        "title": "Assistant Izwa",
        "subtitle": "Posez des questions sur vos snippets ou sur le développement.",
        "clear_chat": "Effacer",
        "clear_success": "Conversation effacée",
        "error": "Erreur de communication avec l'IA",
        "placeholder": "Écrivez votre message...",
        "welcome_title": "Comment puis-je vous aider ?",
        "welcome_desc": "Je peux analyser vos snippets pour répondre à vos questions techniques.",
        "suggest_1": "Quels sont mes snippets Python ?",
        "suggest_2": "Comment utiliser ma fonction de tri ?"
      },
      "statistics": {
        "title": "Statistiques",
        "loading": "Analyse de vos données en cours...",
        "cards": {
          "total": "Total Snippets",
          "languages": "Langages",
          "activity": "Activité (6m)",
          "last_update": "Dernière Maj",
          "today": "Aujourd'hui"
        },
        "distribution": "Répartition par langage",
        "activity_chart": "Activité de création",
        "top_languages": "Top Langages",
        "recent_activity": "Activités Récentes",
        "snippets_count": "{{count}} snippets",
        "months": ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
      },
      "shell": {
        "search_placeholder": "Recherche IA...",
        "searching": "Recherche en cours...",
        "no_results": "Aucun snippet trouvé.",
        "nav_menu": "Menu de navigation",
        "user_label": "Utilisateur",
        "user_status": "Connecté",
        "account": "Mon compte",
        "profile": "Profil",
        "logout": "Se déconnecter",
        "logout_success": "Déconnexion réussie",
        "notifications": "Notifications",
        "mark_as_read": "Tout marquer comme lu",
        "notif_new_title": "Nouveau snippet",
        "notif_new_desc": "Un nouveau snippet Python a été ajouté.",
        "notif_new_time": "Il y a 2 min",
        "notif_ai_title": "Mise à jour IA",
        "notif_ai_desc": "L'assistant IA est maintenant plus rapide.",
        "notif_ai_time": "Il y a 1h",
        "notif_welcome_title": "Bienvenue",
        "notif_welcome_desc": "Bienvenue sur Izwan, votre gestionnaire de snippets.",
        "notif_welcome_time": "Hier"
      },
      "settings": {
        "title": "Paramètres",
        "tabs": {
          "general": "Général",
          "profile": "Profil & Sécurité",
          "ai": "IA & Assistant",
          "editor": "Éditeur",
          "shortcuts": "Raccourcis",
          "backup": "Sauvegarde",
          "about": "À propos"
        },
        "general": {
          "appearance": "Apparence",
          "theme": "Thème de l'interface",
          "theme_desc": "Basculez entre le mode clair et sombre.",
          "dark": "Sombre",
          "light": "Clair",
          "regional": "Régional",
          "language": "Langue",
          "language_desc": "Langue utilisée dans l'application.",
          "notifications": "Notifications",
          "desktop_notif": "Notifications de bureau",
          "security_alerts": "Alertes de sécurité"
        },
        "profile": {
          "title": "Profil Utilisateur",
          "username": "Nom d'utilisateur",
          "update_profile": "Mettre à jour le profil",
          "security": "Sécurité",
          "current_pw": "Mot de passe actuel",
          "new_pw": "Nouveau mot de passe",
          "confirm_pw": "Confirmer le nouveau mot de passe",
          "change_pw": "Changer le mot de passe",
          "fill_fields": "Veuillez remplir tous les champs",
          "pw_mismatch": "Les mots de passe ne correspondent pas"
        },
        "ai": {
          "title": "Configurations IA",
          "desc": "Personnalisez le comportement de l'assistant intelligent.",
          "auto_tags": "Auto-génération de tags",
          "auto_tags_desc": "Suggérer des tags dès la création d'un snippet.",
          "high_perf": "Modèle haute performance",
          "high_perf_desc": "Utiliser des modèles plus puissants."
        },
        "editor": {
          "line_numbers": "Numéros de ligne",
          "auto_complete": "Auto-complétion",
          "font_size": "Taille de la police"
        },
        "shortcuts": {
          "new_snippet": "Nouveau snippet",
          "global_search": "Recherche globale",
          "save": "Sauvegarder",
          "open_assistant": "Ouvrir l'assistant"
        },
        "backup": {
          "zone": "Zone importante",
          "desc": "Assurez-vous de sauvegarder régulièrement vos données localement ou sur le cloud.",
          "export": "Exporter les données",
          "sync": "Cloud Sync (Beta)"
        },
        "about": {
          "version": "Version",
          "desc": "Izwan est un gestionnaire de snippets intelligent conçu pour les développeurs modernes. Gérez, partagez et optimisez votre code avec l'aide de l'IA.",
          "terms": "Conditions d'utilisation",
          "privacy": "Politique de confidentialité"
        }
      },
      "common": {
        "save": "Enregistrer",
        "cancel": "Annuler",
        "update": "Mettre à jour",
        "back": "Retour",
        "delete": "Supprimer",
        "edit": "Modifier",
        "share": "Partager",
        "confirm": "Confirmer",
        "loading": "Chargement...",
        "error": "Erreur",
        "success": "Succès",
        "search": "Rechercher",
        "all_languages": "Tous les langages",
        "all_tags": "Tous les tags"
      },
      "dashboard": {
        "title": "Tableau de bord",
        "loading": "Chargement du tableau de bord...",
        "error": "Erreur de connexion au backend ou aucun contenu.",
        "recent_snippets": "Snippets récents",
        "view_all": "Voir tous",
        "no_snippets": "Aucun snippet récent.",
        "add_snippet": "Ajouter un snippet",
        "stats": {
          "total_snippets": "Total Snippets",
          "languages": "Langages",
          "unique_tags": "Tags uniques",
          "favorites": "Favoris"
        }
      },
      "snippets": {
        "title": "Snippets",
        "all_snippets": "Tous les snippets",
        "new": "Nouveau",
        "search_placeholder": "Rechercher un snippet...",
        "no_results": "Aucun snippet trouvé.",
        "loading": "Chargement de vos snippets...",
        "add_favorite": "Ajouté aux favoris",
        "remove_favorite": "Retiré aux favoris",
        "delete_success": "Snippet supprimé",
        "update_error": "Erreur lors de la mise à jour",
        "delete_error": "Erreur lors de la suppression",
        "copy_link": "Lien copié dans le presse-papier",
        "collection_label": "Collection : ",
        "edit_coming_soon": "Fonctionnalité de modification à venir",
        "enrich_ai": "Enrichir par IA",
        "enrich_success": "Enrichissement par l'IA réussi !",
        "enrich_error": "L'IA n'a pas répondu. Vérifiez que le service d'IA est configuré.",
        "paste_code_first": "Veuillez d'abord coller du code",
        "back_to_list": "Retour aux snippets",
        "detail": {
          "loading": "Chargement du snippet...",
          "explain_ai": "Expliquer avec l'IA",
          "explanation_ai": "Explication IA",
          "explanation_success": "Explication générée",
          "explanation_error": "Erreur lors de la génération de l'explication",
          "copy_success": "Code copié",
          "info_title": "Informations",
          "created_at": "Créé le",
          "size": "Taille",
          "bytes": "octets"
        },
        "form": {
          "title": "Titre",
          "description": "Description",
          "code": "Code",
          "language": "Langage",
          "tags": "Tags",
          "collection": "Collection",
          "no_collection": "Aucune collection",
          "other": "Autre...",
          "other_placeholder": "Précisez le langage (ex: Rust, Ruby...)",
          "add_tag": "Ajouter un tag...",
          "title_placeholder": "Ex: Connexion MySQL Python",
          "desc_placeholder": "Décrivez ce que fait ce snippet...",
          "code_placeholder": "Collez votre code ici...",
          "create_success": "Snippet créé avec succès",
          "create_error": "Erreur lors de la création du snippet",
          "required_fields": "Le titre et le code sont obligatoires",
          "language_required": "Veuillez préciser le langage"
        }
      },
      "collections": {
        "title": "Collections",
        "new": "Nouvelle collection",
        "loading": "Chargement des collections...",
        "delete_title": "Supprimer la collection",
        "delete_desc": "Êtes-vous sûr de vouloir supprimer cette collection ? Les snippets ne seront pas supprimés.",
        "empty": "Aucune collection trouvée.",
        "unknown": "Inconnue",
        "create_title": "Créer une collection",
        "create_desc": "Organisez vos snippets en créant une nouvelle collection thématique.",
        "name_label": "Nom de la collection",
        "name_placeholder": "Ex: Backend Projets, Scripts DevOps...",
        "desc_label": "Description (optionnel)",
        "desc_placeholder": "Une courte description...",
        "btn_create": "Créer la collection",
        "create_success": "Collection \"{{name}}\" créée",
        "delete_success": "Collection supprimée",
        "open_collection": "Ouvrir la collection pour voir les snippets."
      },
      "export": {
        "title": "Exportations",
        "subtitle": "Sauvegardez vos snippets en local ou générez une documentation.",
        "format_title": "1. Format de fichier",
        "markdown_desc": "Idéal pour GitHub / Docs",
        "pdf_title": "Adobe PDF",
        "pdf_desc": "Prêt pour l'impression",
        "content_title": "2. Sélection du contenu",
        "scope_all": "Tous les snippets",
        "scope_all_desc": "Base complète",
        "scope_favorites": "Uniquement les favoris",
        "scope_collection": "Par collection",
        "choose_collection": "Choisir une collection...",
        "btn_export": "Exporter maintenant",
        "btn_exporting": "Génération en cours...",
        "success": "Exportation terminée avec succès !",
        "error": "Erreur lors de l'exportation",
        "footer_note": "L'exportation génère un fichier unique contenant le titre, les tags, la description et le code formaté pour chaque snippet sélectionné."
      },
      "auth": {
        "tagline": "Centralisez votre code, retrouvez l'essentiel avec l'IA.",
        "username": "Nom d'utilisateur",
        "username_placeholder": "votre_nom",
        "password": "Mot de passe",
        "login": "Se connecter",
        "login_success": "Connexion réussie !",
        "invalid_credentials": "Identifiants invalides",
        "or_continue_with": "Ou continuer avec",
        "no_account": "Pas encore de compte ?",
        "create_account": "Créer un compte",
        "already_have_account": "Déjà un compte ?",
        "signup_tagline": "Rejoindre l'aventure",
        "confirm_password": "Confirmer le mot de passe",
        "signup_success": "Compte créé avec succès !",
        "signup_error": "Erreur lors de l'inscription",
        "or_signup_with": "Ou s'inscrire avec",
        "create_my_account": "Créer mon compte",
        "username_signup_placeholder": "choisissez_un_nom"
      }
    }
  },
  en: {
    translation: {
      "nav": {
        "dashboard": "Dashboard",
        "snippets": "Snippets",
        "favorites": "Favorites",
        "collections": "Collections",
        "assistant": "AI Assistant",
        "statistics": "Statistics",
        "export": "Export",
        "settings": "Settings"
      },
      "favorites": {
        "title": "My Favorites",
        "loading": "Loading your favorites...",
        "empty": "No favorites for now."
      },
      "assistant": {
        "title": "Izwa Assistant",
        "subtitle": "Ask questions about your snippets or development.",
        "clear_chat": "Clear",
        "clear_success": "Conversation cleared",
        "error": "AI communication error",
        "placeholder": "Write your message...",
        "welcome_title": "How can I help you?",
        "welcome_desc": "I can analyze your snippets to answer your technical questions.",
        "suggest_1": "What are my Python snippets?",
        "suggest_2": "How to use my sort function?"
      },
      "statistics": {
        "title": "Statistics",
        "loading": "Analyzing your data...",
        "cards": {
          "total": "Total Snippets",
          "languages": "Languages",
          "activity": "Activity (6m)",
          "last_update": "Last Update",
          "today": "Today"
        },
        "distribution": "Language Distribution",
        "activity_chart": "Creation Activity",
        "top_languages": "Top Languages",
        "recent_activity": "Recent Activity",
        "snippets_count": "{{count}} snippets",
        "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      },
      "shell": {
        "search_placeholder": "AI Search...",
        "searching": "Searching...",
        "no_results": "No snippets found.",
        "nav_menu": "Navigation Menu",
        "user_label": "User",
        "user_status": "Connected",
        "account": "My Account",
        "profile": "Profile",
        "logout": "Log out",
        "logout_success": "Successfully logged out",
        "notifications": "Notifications",
        "mark_as_read": "Mark all as read",
        "notif_new_title": "New snippet",
        "notif_new_desc": "A new Python snippet has been added.",
        "notif_new_time": "2 min ago",
        "notif_ai_title": "AI Update",
        "notif_ai_desc": "The AI assistant is now faster.",
        "notif_ai_time": "1h ago",
        "notif_welcome_title": "Welcome",
        "notif_welcome_desc": "Welcome to Izwan, your snippet manager.",
        "notif_welcome_time": "Yesterday"
      },
      "settings": {
        "title": "Settings",
        "tabs": {
          "general": "General",
          "profile": "Profile & Security",
          "ai": "AI & Assistant",
          "editor": "Editor",
          "shortcuts": "Shortcuts",
          "backup": "Backup",
          "about": "About"
        },
        "general": {
          "appearance": "Appearance",
          "theme": "Interface Theme",
          "theme_desc": "Switch between light and dark mode.",
          "dark": "Dark",
          "light": "Light",
          "regional": "Regional",
          "language": "Language",
          "language_desc": "Language used in the application.",
          "notifications": "Notifications",
          "desktop_notif": "Desktop Notifications",
          "security_alerts": "Security Alerts"
        },
        "profile": {
          "title": "User Profile",
          "username": "Username",
          "update_profile": "Update Profile",
          "security": "Security",
          "current_pw": "Current Password",
          "new_pw": "New Password",
          "confirm_pw": "Confirm New Password",
          "change_pw": "Change Password",
          "fill_fields": "Please fill all fields",
          "pw_mismatch": "Passwords do not match"
        },
        "ai": {
          "title": "AI Configurations",
          "desc": "Customize the intelligent assistant's behavior.",
          "auto_tags": "Auto-generate tags",
          "auto_tags_desc": "Suggest tags upon snippet creation.",
          "high_perf": "High-performance model",
          "high_perf_desc": "Use more powerful models."
        },
        "editor": {
          "line_numbers": "Line Numbers",
          "auto_complete": "Auto-completion",
          "font_size": "Font Size"
        },
        "shortcuts": {
          "new_snippet": "New Snippet",
          "global_search": "Global Search",
          "save": "Save",
          "open_assistant": "Open Assistant"
        },
        "backup": {
          "zone": "Important Zone",
          "desc": "Make sure to regularly back up your data locally or to the cloud.",
          "export": "Export Data",
          "sync": "Cloud Sync (Beta)"
        },
        "about": {
          "version": "Version",
          "desc": "Izwan is an intelligent snippet manager designed for modern developers. Manage, share and optimize your code with the help of AI.",
          "terms": "Terms of Use",
          "privacy": "Privacy Policy"
        }
      },
      "common": {
        "save": "Save",
        "cancel": "Cancel",
        "update": "Update",
        "back": "Back",
        "delete": "Delete",
        "edit": "Edit",
        "share": "Share",
        "confirm": "Confirm",
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "search": "Search",
        "all_languages": "All Languages",
        "all_tags": "All Tags"
      },
      "dashboard": {
        "title": "Dashboard",
        "loading": "Loading dashboard...",
        "error": "Error connecting to backend or no content.",
        "recent_snippets": "Recent Snippets",
        "view_all": "View all",
        "no_snippets": "No recent snippets.",
        "add_snippet": "Add snippet",
        "stats": {
          "total_snippets": "Total Snippets",
          "languages": "Languages",
          "unique_tags": "Unique Tags",
          "favorites": "Favorites"
        }
      },
      "snippets": {
        "title": "Snippets",
        "all_snippets": "All snippets",
        "new": "New",
        "search_placeholder": "Search a snippet...",
        "no_results": "No snippets found.",
        "loading": "Loading your snippets...",
        "add_favorite": "Added to favorites",
        "remove_favorite": "Removed from favorites",
        "delete_success": "Snippet deleted",
        "update_error": "Error updating snippet",
        "delete_error": "Error deleting snippet",
        "copy_link": "Link copied to clipboard",
        "collection_label": "Collection: ",
        "edit_coming_soon": "Edit feature coming soon",
        "enrich_ai": "Enrich by AI",
        "enrich_success": "AI Enrichment successful!",
        "enrich_error": "AI didn't respond. Check if AI service is configured.",
        "paste_code_first": "Please paste some code first",
        "back_to_list": "Back to snippets",
        "detail": {
          "loading": "Loading snippet...",
          "explain_ai": "Explain with AI",
          "explanation_ai": "AI Explanation",
          "explanation_success": "Explanation generated",
          "explanation_error": "Error generating explanation",
          "copy_success": "Code copied",
          "info_title": "Information",
          "created_at": "Created on",
          "size": "Size",
          "bytes": "bytes"
        },
        "form": {
          "title": "Title",
          "description": "Description",
          "code": "Code",
          "language": "Language",
          "tags": "Tags",
          "collection": "Collection",
          "no_collection": "No collection",
          "other": "Other...",
          "other_placeholder": "Specify language (ex: Rust, Ruby...)",
          "add_tag": "Add a tag...",
          "title_placeholder": "Ex: MySQL Python Connection",
          "desc_placeholder": "Describe what this snippet does...",
          "code_placeholder": "Paste your code here...",
          "create_success": "Snippet created successfully",
          "create_error": "Error creating snippet",
          "required_fields": "Title and code are required",
          "language_required": "Please specify the language"
        }
      },
      "collections": {
        "title": "Collections",
        "new": "New collection",
        "loading": "Loading collections...",
        "delete_title": "Delete collection",
        "delete_desc": "Are you sure you want to delete this collection? Snippets will not be deleted.",
        "empty": "No collections found.",
        "unknown": "Unknown",
        "create_title": "Create a collection",
        "create_desc": "Organize your snippets by creating a new thematic collection.",
        "name_label": "Collection name",
        "name_placeholder": "Ex: Backend Projects, DevOps Scripts...",
        "desc_label": "Description (optional)",
        "desc_placeholder": "A short description...",
        "btn_create": "Create collection",
        "create_success": "Collection \"{{name}}\" created",
        "delete_success": "Collection deleted",
        "open_collection": "Open collection to see snippets."
      },
      "export": {
        "title": "Exports",
        "subtitle": "Save your snippets locally or generate documentation.",
        "format_title": "1. File Format",
        "markdown_desc": "Ideal for GitHub / Docs",
        "pdf_title": "Adobe PDF",
        "pdf_desc": "Ready for printing",
        "content_title": "2. Content Selection",
        "scope_all": "All snippets",
        "scope_all_desc": "Full database",
        "scope_favorites": "Favorites only",
        "scope_collection": "By collection",
        "choose_collection": "Choose a collection...",
        "btn_export": "Export now",
        "btn_exporting": "Generating...",
        "success": "Export completed successfully!",
        "error": "Error during export",
        "footer_note": "Exporting generates a single file containing the title, tags, description and formatted code for each selected snippet."
      },
      "auth": {
        "tagline": "Centralize your code, find the essentials with AI.",
        "username": "Username",
        "username_placeholder": "your_name",
        "password": "Password",
        "login": "Login",
        "login_success": "Login successful!",
        "invalid_credentials": "Invalid credentials",
        "or_continue_with": "Or continue with",
        "no_account": "No account yet?",
        "create_account": "Create an account",
        "already_have_account": "Already have an account?",
        "signup_tagline": "Join the adventure",
        "confirm_password": "Confirm password",
        "signup_success": "Account created successfully!",
        "signup_error": "Error during signup",
        "or_signup_with": "Or sign up with",
        "create_my_account": "Create my account",
        "username_signup_placeholder": "choose_a_name"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
