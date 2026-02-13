// ⚙️ Configuration Supabase pour QuestForge
// ⚠️ NE PAS commit ce fichier avec de vraies clés en production

const SUPABASE_CONFIG = {
    // 📍 URL de votre projet Supabase
    // ⚠️ REMPLACEZ PAR VOTRE PROPRE URL SUPABASE
    url: 'https://apiisvdmuzwkdklyjruz.supabase.co',
    
    // 🔑 Clé publique (anon key)
    // Cette clé est sécurisée par Row Level Security et peut être exposée côté client
    // ⚠️ REMPLACEZ PAR VOTRE PROPRE CLÉ ANON SUPABASE (elle commence par eyJ...)
    // Vous la trouverez dans : Supabase Dashboard > Settings > API > Project API keys > anon public
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaWlzdmRtdXp3a2RrbHlqcnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MDQwNjQsImV4cCI6MjA1NDk4MDA2NH0.sb_publishable_blxszWKxKm1wqzohJ0byxQ_7M_fs9I6',
    
    // 🌐 Configuration de l'application
    app: {
        name: 'QuestForge',
        version: '2.0.0',
        
        // URLs de redirection
        urls: {
            auth: 'auth.html',
            main: 'index.html',
            resetPassword: 'reset-password.html'
        },
        
        // Options d'authentification
        auth: {
            // Activer la confirmation par email (true en production)
            emailConfirmation: false,
            
            // Minimum de caractères pour le mot de passe
            minPasswordLength: 6,
            
            // Redirection après connexion
            redirectTo: 'index.html'
        },
        
        // Options de jeu
        game: {
            // Nombre de quêtes générées par jour
            dailyQuestsCount: 3,
            
            // Nombre de quêtes prédéfinies à afficher
            baseQuestsCount: 7,
            
            // Limite d'historique de quêtes
            historyLimit: 50,
            
            // Activer le mode debug
            debug: false
        }
    }
};

// 📊 Configuration des analytics (optionnel)
const ANALYTICS_CONFIG = {
    enabled: false,
    
    // Google Analytics
    googleAnalytics: {
        measurementId: 'G-XXXXXXXXXX'
    },
    
    // Plausible Analytics
    plausible: {
        domain: 'votre-domaine.com'
    }
};

// 🎨 Configuration du thème
const THEME_CONFIG = {
    // Couleurs principales
    colors: {
        primary: '#6366f1',
        primaryDark: '#4f46e5',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
    },
    
    // Mode sombre par défaut
    darkMode: true,
    
    // Animations
    animations: {
        enabled: true,
        duration: 300 // ms
    }
};

// 💬 Configuration des notifications
const NOTIFICATIONS_CONFIG = {
    // Durée d'affichage des toasts (ms)
    toastDuration: 3000,
    
    // Position des toasts
    toastPosition: 'bottom-right', // top-left, top-right, bottom-left, bottom-right
    
    // Sons
    sounds: {
        enabled: false,
        levelUp: 'sounds/levelup.mp3',
        questComplete: 'sounds/complete.mp3'
    }
};

// 🌍 Configuration de la localisation
const LOCALE_CONFIG = {
    // Langue par défaut
    defaultLocale: 'fr-FR',
    
    // Langues disponibles
    availableLocales: ['fr-FR', 'en-US'],
    
    // Format de date
    dateFormat: {
        short: 'DD/MM/YYYY',
        long: 'DD MMMM YYYY'
    }
};

// Export de la configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        ANALYTICS_CONFIG,
        THEME_CONFIG,
        NOTIFICATIONS_CONFIG,
        LOCALE_CONFIG
    };
}

// Rendre disponible globalement dans le navigateur
if (typeof window !== 'undefined') {
    window.QUESTFORGE_CONFIG = {
        supabase: SUPABASE_CONFIG,
        analytics: ANALYTICS_CONFIG,
        theme: THEME_CONFIG,
        notifications: NOTIFICATIONS_CONFIG,
        locale: LOCALE_CONFIG
    };
}