// Application principale QuestForge avec Supabase
class QuestForgeApp {
    constructor() {
        this.gameSystem = new GameSystem();
        this.questGenerator = new QuestGenerator();
        this.supabase = null;
        this.currentUser = null;
        
        this.currentFilter = {
            category: 'all',
            difficulty: 'all'
        };
        
        this.currentQuests = [];
        this.init();
    }

    async init() {
        // Initialiser Supabase
        await this.initSupabase();
        
        // Petit délai pour permettre à Supabase de charger la session
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Vérifier l'authentification
        const isAuthenticated = await this.checkAuth();
        
        if (!isAuthenticated) {
            window.location.href = 'auth.html';
            return;
        }

        this.setupEventListeners();
        await this.loadInitialQuests();
        await this.updateUI();
        this.setupTabs();
    }

    async initSupabase() {
        const { createClient } = supabase;
        // ⚠️ REMPLACER par mes propres identifiants Supabase
        this.supabase = createClient(
            'https://apiisvdmuzwkdklyjruz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaWlzdmRtdXp3a2RrbHlqcnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDExOTQsImV4cCI6MjA4NDA3NzE5NH0.ZmAJA7rPaRB_S3YUNU85opUMj6sEZ74JEDaxGq8E9ak'
        );

        // Écouter les changements d'authentification
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                window.location.href = 'auth.html';
            }
        });
    }

    async checkAuth() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error || !session) {
                return false;
            }

            this.currentUser = session.user;
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Filtres
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilter.category = e.target.value;
            this.filterAndDisplayQuests();
        });

        document.getElementById('difficultyFilter').addEventListener('change', (e) => {
            this.currentFilter.difficulty = e.target.value;
            this.filterAndDisplayQuests();
        });

        // Génération de nouvelles quêtes
        document.getElementById('generateDaily').addEventListener('click', () => {
            this.generateDailyQuests();
        });

        // Création de quête personnalisée
        document.getElementById('createCustomQuest').addEventListener('click', () => {
            this.createCustomQuest();
        });

        // Bouton de déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            window.location.href = 'auth.html';
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('❌ Erreur de déconnexion', 'error');
        }
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(`${targetTab}Tab`).classList.add('active');

                if (targetTab === 'stats') {
                    this.updateStatsTab();
                }
            });
        });
    }

    async loadInitialQuests() {
        try {
            // Charger les quêtes personnalisées depuis Supabase
            const { data: customQuests, error } = await this.supabase
                .from('custom_quests')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Convertir les quêtes Supabase au format de l'app
            const formattedCustomQuests = (customQuests || []).map(q => ({
                id: q.id,
                title: q.title,
                description: q.description,
                category: q.category,
                difficulty: q.difficulty,
                impact: q.impact,
                duration: q.duration,
                level_required: q.level_required,
                custom: true,
                tags: ['personnalisé', q.category]
            }));

            // Mélanger les quêtes prédéfinies
            const shuffled = this.shuffleArray([...PREDEFINED_QUESTS]);
            this.currentQuests = [...shuffled.slice(0, 10), ...formattedCustomQuests];
            
            await this.filterAndDisplayQuests();
        } catch (error) {
            console.error('Error loading quests:', error);
            this.showToast('❌ Erreur de chargement des quêtes', 'error');
        }
    }

    generateDailyQuests() {
        // Générer 3 nouvelles quêtes quotidiennes
        const dailyQuests = this.questGenerator.generateDailyQuests(3);
        
        // Ajouter des quêtes aléatoires de la base
        const shuffled = this.shuffleArray([...PREDEFINED_QUESTS]);
        const baseQuests = shuffled.slice(0, 7);
        
        // Combiner avec les quêtes personnalisées (déjà chargées)
        const customQuests = this.currentQuests.filter(q => q.custom);
        
        this.currentQuests = [...dailyQuests, ...baseQuests, ...customQuests];
        this.filterAndDisplayQuests();
        
        this.showToast('✨ Nouvelles quêtes générées !', 'success');
    }

    async filterAndDisplayQuests() {
        let filtered = this.currentQuests;

        // Filtrer par catégorie
        if (this.currentFilter.category !== 'all') {
            filtered = filtered.filter(q => q.category === this.currentFilter.category);
        }

        // Filtrer par difficulté
        if (this.currentFilter.difficulty !== 'all') {
            filtered = filtered.filter(q => q.difficulty === this.currentFilter.difficulty);
        }

        // Obtenir le profil et le niveau du joueur
        const { data: profile } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .maybeSingle(); // ✅ FIX: Utiliser maybeSingle() au lieu de single()

        const playerLevel = profile ? this.gameSystem.calculateLevel(profile.xp) : 1;
        
        await this.displayQuests(filtered, playerLevel);
    }

    async displayQuests(quests, playerLevel) {
        const container = document.getElementById('questsList');
        container.innerHTML = '';

        if (quests.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucune quête ne correspond aux filtres sélectionnés.</p>';
            return;
        }

        for (const quest of quests) {
            const questCard = await this.createQuestCard(quest, playerLevel);
            container.appendChild(questCard);
        }
    }

    async createQuestCard(quest, playerLevel) {
        const card = document.createElement('div');
        card.className = 'quest-card';
        
        // Vérifier si la quête est complétée - ✅ FIX: Gestion correcte du single()
        const isCompleted = await this.isQuestCompleted(quest.id);
        if (isCompleted) {
            card.classList.add('completed');
        }

        const xp = this.gameSystem.calculateQuestXP(quest);
        const locked = playerLevel < (quest.level_required || 1);

        const difficultyStars = '⭐'.repeat(this.getDifficultyStars(quest.difficulty));

        card.innerHTML = `
            <div class="quest-header">
                <h3 class="quest-title">${quest.title}</h3>
                <span class="quest-xp">+${xp} XP</span>
            </div>
            <p class="quest-description">${quest.description}</p>
            <div class="quest-meta">
                <span class="quest-badge">${this.getCategoryIcon(quest.category)} ${quest.category}</span>
                <span class="quest-badge">${difficultyStars} ${quest.difficulty}</span>
                <span class="quest-badge">⏱️ ${quest.duration}min</span>
                ${quest.impact ? `<span class="quest-badge">💥 ${quest.impact}</span>` : ''}
            </div>
            <div class="quest-actions">
                ${locked ? 
                    `<button class="btn-complete" disabled>🔒 Niveau ${quest.level_required} requis</button>` :
                    isCompleted ?
                        `<button class="btn-complete" disabled>✅ Complétée</button>` :
                        `<button class="btn-complete" data-quest-id="${quest.id}">✓ Compléter</button>`
                }
                ${quest.custom ? 
                    `<button class="btn-delete" data-quest-id="${quest.id}">🗑️</button>` : 
                    ''
                }
            </div>
        `;

        // Event listeners pour les boutons
        const completeBtn = card.querySelector('.btn-complete[data-quest-id]');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeQuest(quest));
        }

        const deleteBtn = card.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCustomQuest(quest.id));
        }

        return card;
    }

    // ✅ FIX: Méthode corrigée pour vérifier si une quête est complétée
    async isQuestCompleted(questId) {
        try {
            const { data, error } = await this.supabase
                .from('completed_quest_ids')
                .select('id')
                .eq('user_id', this.currentUser.id)
                .eq('quest_id', questId)
                .limit(1);

            // Pas d'erreur si vide, juste retourner false
            if (error) {
                console.error('Error checking completion:', error);
                return false;
            }

            return data && data.length > 0;
        } catch (error) {
            console.error('Error checking quest completion:', error);
            return false;
        }
    }

    async completeQuest(quest) {
        try {
            // Calculer l'XP
            const xpGain = this.gameSystem.calculateQuestXP(quest);

            // Récupérer le profil actuel - ✅ FIX: Utiliser maybeSingle()
            const { data: profile, error: profileError } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profile) throw new Error('Profile not found');

            const oldLevel = this.gameSystem.calculateLevel(profile.xp);
            
            // Calculer le streak
            const streakData = this.calculateStreak(profile.last_completion_date, profile.streak);
            const streakBonus = this.gameSystem.calculateStreakBonus(streakData.streak);
            const totalXP = xpGain + streakBonus;

            // Mettre à jour le profil
            const { error: updateError } = await this.supabase
                .from('profiles')
                .update({
                    xp: profile.xp + totalXP,
                    completed_quests: profile.completed_quests + 1,
                    streak: streakData.streak,
                    best_streak: Math.max(profile.best_streak || 0, streakData.streak),
                    last_completion_date: new Date().toISOString()
                })
                .eq('id', this.currentUser.id);

            if (updateError) throw updateError;

            // Ajouter à l'historique
            const { error: historyError } = await this.supabase
                .from('quest_history')
                .insert({
                    user_id: this.currentUser.id,
                    quest_id: quest.id,
                    quest_title: quest.title,
                    category: quest.category,
                    xp_gained: totalXP
                });

            if (historyError) throw historyError;

            // Mettre à jour les stats de catégorie
            await this.updateCategoryStats(quest.category, totalXP);

            // Marquer la quête comme complétée - ✅ FIX: Gestion des conflits
            const { error: completedError } = await this.supabase
                .from('completed_quest_ids')
                .upsert({
                    user_id: this.currentUser.id,
                    quest_id: quest.id
                }, {
                    onConflict: 'user_id,quest_id',
                    ignoreDuplicates: true
                });

            if (completedError) throw completedError;

            // Mettre à jour l'UI
            await this.updateUI();
            await this.filterAndDisplayQuests();

            // Notifications
            this.showXPGain(totalXP, streakBonus);
            
            const newLevel = this.gameSystem.calculateLevel(profile.xp + totalXP);
            if (newLevel > oldLevel) {
                this.showLevelUp(newLevel);
            }

        } catch (error) {
            console.error('Error completing quest:', error);
            this.showToast('❌ Erreur lors de la complétion', 'error');
        }
    }

    calculateStreak(lastCompletionDate, currentStreak = 0) {
        const today = new Date().toDateString();
        const lastDate = lastCompletionDate ? new Date(lastCompletionDate).toDateString() : null;
        
        if (lastDate === today) {
            return { streak: currentStreak, increased: false };
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastDate === yesterdayStr) {
            return { streak: currentStreak + 1, increased: true };
        } else if (lastDate === null) {
            return { streak: 1, increased: true };
        } else {
            return { streak: 1, increased: false };
        }
    }

    async updateCategoryStats(category, xpGain) {
        try {
            // Vérifier si la stat existe - ✅ FIX: Utiliser maybeSingle()
            const { data: existing } = await this.supabase
                .from('category_stats')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .eq('category', category)
                .maybeSingle();

            if (existing) {
                // Mettre à jour
                await this.supabase
                    .from('category_stats')
                    .update({
                        count: existing.count + 1,
                        total_xp: existing.total_xp + xpGain
                    })
                    .eq('id', existing.id);
            } else {
                // Créer
                await this.supabase
                    .from('category_stats')
                    .insert({
                        user_id: this.currentUser.id,
                        category: category,
                        count: 1,
                        total_xp: xpGain
                    });
            }
        } catch (error) {
            console.error('Error updating category stats:', error);
        }
    }

    async createCustomQuest() {
        const title = document.getElementById('customTitle').value.trim();
        const description = document.getElementById('customDescription').value.trim();
        const category = document.getElementById('customCategory').value;
        const difficulty = document.getElementById('customDifficulty').value;
        const duration = parseInt(document.getElementById('customDuration').value);
        const impact = document.getElementById('customImpact').value;

        if (!title || !description) {
            this.showToast('❌ Titre et description requis', 'error');
            return;
        }

        const quest = {
            user_id: this.currentUser.id,
            title,
            description,
            category,
            difficulty,
            impact,
            duration,
            level_required: this.gameSystem.getDifficultyLevel(difficulty)
        };

        try {
            const { data, error } = await this.supabase
                .from('custom_quests')
                .insert(quest)
                .select()
                .single();

            if (error) throw error;

            // Ajouter à la liste locale
            this.currentQuests.push({
                id: data.id,
                title: data.title,
                description: data.description,
                category: data.category,
                difficulty: data.difficulty,
                impact: data.impact,
                duration: data.duration,
                level_required: data.level_required,
                custom: true,
                tags: ['personnalisé', data.category]
            });

            await this.filterAndDisplayQuests();
            this.showToast('✅ Quête créée !', 'success');

            // Réinitialiser le formulaire
            document.getElementById('customTitle').value = '';
            document.getElementById('customDescription').value = '';
            document.getElementById('customDuration').value = '30';

        } catch (error) {
            console.error('Error creating quest:', error);
            this.showToast('❌ Erreur lors de la création', 'error');
        }
    }

    async deleteCustomQuest(questId) {
        if (!confirm('Supprimer cette quête personnalisée ?')) return;

        try {
            const { error } = await this.supabase
                .from('custom_quests')
                .delete()
                .eq('id', questId)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            this.currentQuests = this.currentQuests.filter(q => q.id !== questId);
            await this.filterAndDisplayQuests();
            this.showToast('🗑️ Quête supprimée', 'success');

        } catch (error) {
            console.error('Error deleting quest:', error);
            this.showToast('❌ Erreur lors de la suppression', 'error');
        }
    }

    async updateUI() {
        try {
            // ✅ FIX: Utiliser maybeSingle() au lieu de single()
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .maybeSingle();

            if (error) throw error;
            if (!profile) {
                console.error('Profile not found');
                return;
            }

            const stats = this.gameSystem.getStats(profile);

            // Mettre à jour le header
            document.getElementById('userLevel').textContent = stats.level;
            document.getElementById('userTitle').textContent = stats.title;
            document.getElementById('userStreak').textContent = stats.streak;

            // Afficher le username
            const usernameEl = document.getElementById('username');
            if (usernameEl) {
                usernameEl.textContent = profile.username || 'Héros';
            }

            // Mettre à jour la progression XP (anneau circulaire)
            const nextLevelXP = this.gameSystem.getXPForNextLevel(stats.totalXP);
            const currentLevelData = this.gameSystem.titles.find(t => t.level === stats.level);
            const currentXP = stats.totalXP - (currentLevelData?.minXP || 0);
            const neededXP = nextLevelXP ? (nextLevelXP - (currentLevelData?.minXP || 0)) : 1;

            // Anneau de progression circulaire
            const progressCircle = document.getElementById('progressCircle');
            const xpText = document.getElementById('xpText');
            
            // Calculer le stroke-dashoffset pour l'anneau (circumference = 2 * PI * radius = 440)
            const circumference = 440;
            const offset = circumference - (stats.progress / 100) * circumference;
            
            if (progressCircle) {
                progressCircle.style.strokeDashoffset = offset;
            }
            
            if (nextLevelXP) {
                xpText.textContent = `${currentXP} / ${neededXP} XP`;
            } else {
                xpText.textContent = `Niveau MAX (${stats.totalXP} XP)`;
            }

        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    async updateStatsTab() {
        try {
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .maybeSingle(); // ✅ FIX

            if (!profile) return;

            const stats = this.gameSystem.getStats(profile);

            // Statistiques principales
            document.getElementById('totalQuests').textContent = stats.completedQuests;
            document.getElementById('totalXP').textContent = stats.totalXP;
            document.getElementById('bestStreak').textContent = stats.bestStreak;

            // Catégorie dominante
            const { data: categoryStats } = await this.supabase
                .from('category_stats')
                .select('*')
                .eq('user_id', this.currentUser.id);

            let maxCategory = null;
            let maxCount = 0;
            const statsObj = {};

            (categoryStats || []).forEach(stat => {
                statsObj[stat.category] = stat.count;
                if (stat.count > maxCount) {
                    maxCount = stat.count;
                    maxCategory = stat.category;
                }
            });

            document.getElementById('dominantCategory').textContent = maxCategory ? 
                `${this.getCategoryIcon(maxCategory)} ${maxCategory}` : '-';

            // Répartition par catégorie
            const categoryContainer = document.getElementById('categoryBreakdown');
            categoryContainer.innerHTML = '';

            const total = Object.values(statsObj).reduce((sum, count) => sum + count, 0);

            Object.entries(statsObj).forEach(([category, count]) => {
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                
                const bar = document.createElement('div');
                bar.className = 'category-bar';
                bar.innerHTML = `
                    <span class="category-name">${this.getCategoryIcon(category)} ${category}</span>
                    <div class="category-progress">
                        <div class="category-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="category-count">${count}</span>
                `;
                categoryContainer.appendChild(bar);
            });

            // Historique des quêtes
            const { data: history } = await this.supabase
                .from('quest_history')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('completed_at', { ascending: false })
                .limit(20);

            const historyContainer = document.getElementById('questHistory');
            historyContainer.innerHTML = '';

            if (!history || history.length === 0) {
                historyContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Aucune quête complétée pour le moment</p>';
            } else {
                history.forEach(item => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    
                    const date = new Date(item.completed_at).toLocaleDateString('fr-FR');
                    historyItem.innerHTML = `
                        <span class="history-quest">${item.quest_title}</span>
                        <span class="history-date">${date} | +${item.xp_gained} XP</span>
                    `;
                    historyContainer.appendChild(historyItem);
                });
            }

        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    showXPGain(xp, streakBonus) {
        let message = `+${xp} XP`;
        if (streakBonus > 0) {
            message += ` (dont +${streakBonus} bonus streak)`;
        }
        this.showToast(message, 'success');
    }

    showLevelUp(newLevel) {
        const title = this.gameSystem.titles.find(t => t.level === newLevel)?.name || '';
        this.showToast(`🎉 LEVEL UP ! Niveau ${newLevel} - ${title}`, 'success');
        
        const levelEl = document.getElementById('userLevel');
        levelEl.classList.add('level-up-animation');
        setTimeout(() => levelEl.classList.remove('level-up-animation'), 600);
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Utilitaires
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

    getDifficultyStars(difficulty) {
        const stars = {
            'facile': 1,
            'moyen': 2,
            'difficile': 3,
            'expert': 4
        };
        return stars[difficulty] || 1;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialiser l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new QuestForgeApp();
    window.questForge = app;
});