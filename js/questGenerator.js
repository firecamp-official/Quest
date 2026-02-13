// Système de génération automatique de quêtes
class QuestGenerator {
    constructor() {
        this.templates = {
            actions: ['faire', 'pratiquer', 'réaliser', 'accomplir', 'exécuter', 'effectuer'],
            activities: {
                santé: ['du sport', 'du yoga', 'de la course', 'de la musculation', 'du vélo', 'de la natation', 'des étirements', 'de la marche'],
                mental: ['de la méditation', 'du journaling', 'de la visualisation', 'de la lecture', 'de l\'apprentissage', 'de la réflexion'],
                créativité: ['du dessin', 'de l\'écriture', 'de la musique', 'de la photo', 'de la peinture', 'du design'],
                social: ['un appel', 'une rencontre', 'du networking', 'une discussion', 'une collaboration'],
                discipline: ['du focus', 'de l\'organisation', 'de la planification', 'du tracking'],
                apprentissage: ['un cours', 'un tutoriel', 'une formation', 'de la pratique', 'de l\'étude']
            },
            durations: [15, 20, 30, 45, 60, 90, 120],
            intensities: ['légère', 'modérée', 'intense', 'très intense'],
            repetitions: [3, 5, 10, 15, 20, 25, 30, 50, 100]
        };
    }

    // Générer une quête aléatoire
    generateRandomQuest(category = null) {
        const categories = ['santé', 'mental', 'créativité', 'social', 'discipline', 'apprentissage'];
        const selectedCategory = category || this.randomChoice(categories);
        
        const action = this.randomChoice(this.templates.actions);
        const activity = this.randomChoice(this.templates.activities[selectedCategory]);
        const duration = this.randomChoice(this.templates.durations);
        const difficulty = this.randomChoice(['facile', 'moyen', 'difficile', 'expert']);
        const impact = this.randomChoice(['faible', 'moyen', 'élevé']);
        
        const title = `${this.getCategoryIcon(selectedCategory)} ${this.capitalize(action)} ${activity}`;
        const description = `${this.capitalize(action)} ${activity} pendant ${duration} minutes`;
        
        return {
            id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            description: description,
            category: selectedCategory,
            difficulty: difficulty,
            impact: impact,
            duration: duration,
            level_required: this.getDifficultyLevel(difficulty),
            tags: ['généré', 'aléatoire', selectedCategory],
            chapter: this.getChapterFromLevel(this.getDifficultyLevel(difficulty)),
            custom: false,
            generated: true
        };
    }

    // Générer une quête avec paramètres spécifiques
    generateQuestWithParams(params) {
        const {
            category = 'santé',
            action = 'faire',
            activity = 'du sport',
            duration = 30,
            repetitions = null,
            difficulty = 'moyen',
            impact = 'moyen'
        } = params;

        let description = `${this.capitalize(action)} ${activity}`;
        
        if (repetitions) {
            description += ` (${repetitions} répétitions)`;
        } else {
            description += ` pendant ${duration} minutes`;
        }

        return {
            id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${this.getCategoryIcon(category)} ${this.capitalize(action)} ${activity}`,
            description: description,
            category: category,
            difficulty: difficulty,
            impact: impact,
            duration: duration,
            level_required: this.getDifficultyLevel(difficulty),
            tags: ['généré', category],
            chapter: this.getChapterFromLevel(this.getDifficultyLevel(difficulty)),
            custom: false,
            generated: true
        };
    }

    // Générer un ensemble de quêtes quotidiennes
    generateDailyQuests(count = 3) {
        const quests = [];
        const categories = ['santé', 'mental', 'créativité', 'social', 'discipline', 'apprentissage'];
        
        // Mélanger les catégories pour la variété
        const shuffled = this.shuffleArray([...categories]);
        
        for (let i = 0; i < count; i++) {
            const category = shuffled[i % shuffled.length];
            quests.push(this.generateRandomQuest(category));
        }
        
        return quests;
    }

    // Générer des quêtes basées sur les tags
    generateQuestsByTags(tags, count = 5) {
        const quests = [];
        for (let i = 0; i < count; i++) {
            const quest = this.generateRandomQuest();
            quest.tags = [...quest.tags, ...tags];
            quests.push(quest);
        }
        return quests;
    }

    // Utilitaires
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getCategoryIcon(category) {
        const icons = {
            'santé': '🏃',
            'mental': '🧠',
            'créativité': '🎨',
            'social': '👥',
            'discipline': '💪',
            'apprentissage': '📚'
        };
        return icons[category] || '🎯';
    }

    getDifficultyLevel(difficulty) {
        const levels = {
            'facile': 1,
            'moyen': 2,
            'difficile': 4,
            'expert': 6
        };
        return levels[difficulty] || 1;
    }

    getChapterFromLevel(level) {
        if (level <= 2) return 'Éveil du Corps';
        if (level <= 5) return 'Force Intérieure';
        if (level <= 7) return 'Maîtrise Avancée';
        return 'Légende Vivante';
    }

    // Calculer l'XP en fonction des paramètres de la quête
    calculateXP(quest) {
        const baseXP = {
            'facile': 50,
            'moyen': 100,
            'difficile': 200,
            'expert': 400
        };

        const impactMultiplier = {
            'faible': 1.0,
            'moyen': 1.5,
            'élevé': 2.0
        };

        const durationBonus = Math.floor(quest.duration / 15) * 10;
        
        let xp = baseXP[quest.difficulty] || 50;
        xp *= impactMultiplier[quest.impact] || 1.0;
        xp += durationBonus;
        
        return Math.round(xp);
    }
}

// Export pour utilisation dans app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuestGenerator };
}