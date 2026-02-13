// Système de jeu : niveaux, XP, titres, progression
class GameSystem {
    constructor() {
        this.titles = [
            { level: 1, name: 'Novice', minXP: 0 },
            { level: 2, name: 'Apprenti', minXP: 100 },
            { level: 3, name: 'Aventurier', minXP: 300 },
            { level: 4, name: 'Guerrier', minXP: 600 },
            { level: 5, name: 'Vétéran', minXP: 1000 },
            { level: 6, name: 'Expert', minXP: 1500 },
            { level: 7, name: 'Maître', minXP: 2100 },
            { level: 8, name: 'Champion', minXP: 2800 },
            { level: 9, name: 'Héros', minXP: 3600 },
            { level: 10, name: 'Légende', minXP: 4500 }
        ];

        this.chapters = [
            { name: 'Éveil du Corps', minLevel: 1, maxLevel: 2 },
            { name: 'Force Intérieure', minLevel: 3, maxLevel: 5 },
            { name: 'Maîtrise Avancée', minLevel: 6, maxLevel: 8 },
            { level: 'Légende Vivante', minLevel: 9, maxLevel: 10 }
        ];
    }

    // Calculer le niveau basé sur l'XP totale
    calculateLevel(totalXP) {
        for (let i = this.titles.length - 1; i >= 0; i--) {
            if (totalXP >= this.titles[i].minXP) {
                return this.titles[i].level;
            }
        }
        return 1;
    }

    // Obtenir le titre actuel
    getCurrentTitle(totalXP) {
        const level = this.calculateLevel(totalXP);
        return this.titles.find(t => t.level === level)?.name || 'Novice';
    }

    // Calculer l'XP nécessaire pour le prochain niveau
    getXPForNextLevel(totalXP) {
        const currentLevel = this.calculateLevel(totalXP);
        const nextLevelData = this.titles.find(t => t.level === currentLevel + 1);
        
        if (!nextLevelData) {
            return null; // Niveau max atteint
        }
        
        return nextLevelData.minXP;
    }

    // Calculer la progression en % vers le prochain niveau
    getProgressToNextLevel(totalXP) {
        const currentLevel = this.calculateLevel(totalXP);
        const currentLevelData = this.titles.find(t => t.level === currentLevel);
        const nextLevelData = this.titles.find(t => t.level === currentLevel + 1);
        
        if (!nextLevelData) {
            return 100; // Niveau max
        }
        
        const currentLevelXP = currentLevelData.minXP;
        const nextLevelXP = nextLevelData.minXP;
        const xpInCurrentLevel = totalXP - currentLevelXP;
        const xpNeededForLevel = nextLevelXP - currentLevelXP;
        
        return Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));
    }

    // Calculer l'XP d'une quête
    calculateQuestXP(quest) {
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
        
        // Bonus pour quêtes personnalisées
        if (quest.custom) {
            xp *= 1.2;
        }
        
        return Math.round(xp);
    }

    // Calculer le bonus de streak
    calculateStreakBonus(streakDays) {
        if (streakDays === 0) return 0;
        if (streakDays < 7) return 10;
        if (streakDays < 30) return 25;
        if (streakDays < 90) return 50;
        return 100;
    }

    // Obtenir le chapitre actuel
    getCurrentChapter(level) {
        for (const chapter of this.chapters) {
            if (level >= chapter.minLevel && level <= chapter.maxLevel) {
                return chapter.name;
            }
        }
        return this.chapters[this.chapters.length - 1].name;
    }

    // Vérifier si le joueur peut accéder à une quête
    canAccessQuest(quest, playerLevel) {
        return playerLevel >= (quest.level_required || 1);
    }

    // Obtenir des statistiques détaillées
    getStats(userData) {
        const totalXP = userData.xp || 0;
        const level = this.calculateLevel(totalXP);
        const title = this.getCurrentTitle(totalXP);
        const progress = this.getProgressToNextLevel(totalXP);
        const chapter = this.getCurrentChapter(level);
        const streak = userData.streak || 0;
        const streakBonus = this.calculateStreakBonus(streak);
        
        return {
            totalXP,
            level,
            title,
            progress,
            chapter,
            streak,
            streakBonus,
            completedQuests: userData.completedQuests || 0,
            bestStreak: userData.bestStreak || 0
        };
    }
}

// Gestion du localStorage pour la persistance
class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'questforge_data';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!this.getData()) {
            this.saveData({
                xp: 0,
                level: 1,
                completedQuests: 0,
                streak: 0,
                bestStreak: 0,
                lastCompletionDate: null,
                completedQuestIds: [],
                customQuests: [],
                categoryStats: {
                    'santé': 0,
                    'mental': 0,
                    'créativité': 0,
                    'social': 0,
                    'discipline': 0,
                    'apprentissage': 0
                },
                questHistory: []
            });
        }
    }

    getData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }

    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    updateXP(xpGain) {
        const data = this.getData();
        data.xp = (data.xp || 0) + xpGain;
        this.saveData(data);
        return data.xp;
    }

    completeQuest(quest, xpGain) {
        const data = this.getData();
        
        // Mettre à jour XP
        data.xp = (data.xp || 0) + xpGain;
        
        // Incrémenter le compteur de quêtes
        data.completedQuests = (data.completedQuests || 0) + 1;
        
        // Mettre à jour les stats par catégorie
        if (!data.categoryStats) data.categoryStats = {};
        data.categoryStats[quest.category] = (data.categoryStats[quest.category] || 0) + 1;
        
        // Ajouter à l'historique
        if (!data.questHistory) data.questHistory = [];
        data.questHistory.unshift({
            questId: quest.id,
            questTitle: quest.title,
            category: quest.category,
            xpGained: xpGain,
            completedAt: new Date().toISOString()
        });
        
        // Garder seulement les 50 dernières quêtes dans l'historique
        if (data.questHistory.length > 50) {
            data.questHistory = data.questHistory.slice(0, 50);
        }
        
        // Marquer la quête comme complétée
        if (!data.completedQuestIds) data.completedQuestIds = [];
        if (!data.completedQuestIds.includes(quest.id)) {
            data.completedQuestIds.push(quest.id);
        }
        
        // Mettre à jour le streak
        this.updateStreak(data);
        
        this.saveData(data);
        return data;
    }

    updateStreak(data) {
        const today = new Date().toDateString();
        const lastDate = data.lastCompletionDate ? new Date(data.lastCompletionDate).toDateString() : null;
        
        if (lastDate === today) {
            // Déjà complété aujourd'hui, pas de changement
            return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastDate === yesterdayStr) {
            // Streak continue
            data.streak = (data.streak || 0) + 1;
        } else if (lastDate === null) {
            // Premier jour
            data.streak = 1;
        } else {
            // Streak cassée
            data.streak = 1;
        }
        
        // Mettre à jour le meilleur streak
        data.bestStreak = Math.max(data.bestStreak || 0, data.streak);
        
        // Mettre à jour la date de dernière completion
        data.lastCompletionDate = new Date().toISOString();
    }

    addCustomQuest(quest) {
        const data = this.getData();
        if (!data.customQuests) data.customQuests = [];
        data.customQuests.push(quest);
        this.saveData(data);
    }

    getCustomQuests() {
        const data = this.getData();
        return data.customQuests || [];
    }

    deleteCustomQuest(questId) {
        const data = this.getData();
        if (data.customQuests) {
            data.customQuests = data.customQuests.filter(q => q.id !== questId);
            this.saveData(data);
        }
    }

    isQuestCompleted(questId) {
        const data = this.getData();
        return data.completedQuestIds && data.completedQuestIds.includes(questId);
    }

    getDominantCategory() {
        const data = this.getData();
        if (!data.categoryStats) return null;
        
        let maxCategory = null;
        let maxCount = 0;
        
        for (const [category, count] of Object.entries(data.categoryStats)) {
            if (count > maxCount) {
                maxCount = count;
                maxCategory = category;
            }
        }
        
        return maxCategory;
    }

    getCategoryStats() {
        const data = this.getData();
        return data.categoryStats || {};
    }

    getQuestHistory() {
        const data = this.getData();
        return data.questHistory || [];
    }

    resetData() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.initializeStorage();
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameSystem, StorageManager };
}