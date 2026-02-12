/* ===================================
   STATE MANAGEMENT
   =================================== */

const STATE_KEY = 'questSystemState';

// Default state
const defaultState = {
    xp: 0,
    level: 1,
    completedQuests: [],
    customQuests: [],
    
    // Streaks
    dailyStreak: 0,
    lastQuestDate: null,
    bestStreak: 0,
    
    // Chapter system
    chapterXP: 0,
    currentChapter: 1,
    
    // Daily quests
    dailyQuests: [],
    dailyQuestsDate: null,
    
    // No Excuse challenge
    noExcuseQuest: null,
    noExcuseDate: null,
    noExcuseCompleted: false,
    
    // Stats
    totalXPEarned: 0,
    categoryStats: {}
};

// Title progression
const TITLES = {
    1: "Apprenti",
    4: "Explorateur",
    7: "Bâtisseur",
    11: "Maître du Feu"
};

// Chapter system
const CHAPTERS = [
    { id: 1, name: "Les Premiers Pas", xpRequired: 500, theme: "Découverte" },
    { id: 2, name: "L'Éveil", xpRequired: 1000, theme: "Croissance" },
    { id: 3, name: "La Forge", xpRequired: 2000, theme: "Maîtrise" },
    { id: 4, name: "L'Ascension", xpRequired: 5000, theme: "Excellence" }
];

// Difficulty & Impact XP multipliers
const DIFFICULTY_XP = {
    easy: 20,
    normal: 40,
    hard: 70
};

const IMPACT_MULTIPLIER = {
    low: 1,
    medium: 1.5,
    high: 2
};

// Streak bonus (every 3 days)
const STREAK_BONUS_INTERVAL = 3;
const STREAK_BONUS_XP = 50;

// Base quests database
const BASE_QUESTS = [
    // Santé
    { id: 'h1', title: 'Bois un grand verre d\'eau', description: 'Hydrate-toi correctement', difficulty: 'easy', impact: 'low', category: 'santé', tags: ['rapide', 'santé'] },
    { id: 'h2', title: 'Marche 5 minutes dehors', description: 'Prends l\'air et bouge un peu', difficulty: 'easy', impact: 'medium', category: 'santé', tags: ['extérieur', 'mouvement'] },
    { id: 'h3', title: 'Étire-toi pendant 2 minutes', description: 'Détends tes muscles', difficulty: 'easy', impact: 'low', category: 'santé', tags: ['rapide', 'corps'] },
    { id: 'h4', title: 'Mange un fruit', description: 'Nourris ton corps sainement', difficulty: 'easy', impact: 'low', category: 'santé', tags: ['nutrition'] },
    { id: 'h5', title: 'Fais 10 pompes', description: 'Renforce ton corps', difficulty: 'normal', impact: 'medium', category: 'santé', tags: ['sport', 'force'] },
    { id: 'h6', title: 'Dors 7 heures minimum', description: 'Repose-toi correctement', difficulty: 'normal', impact: 'high', category: 'santé', tags: ['sommeil', 'récupération'] },
    
    // Mental
    { id: 'm1', title: 'Médite 3 minutes', description: 'Calme ton esprit', difficulty: 'easy', impact: 'medium', category: 'mental', tags: ['méditation', 'calme'] },
    { id: 'm2', title: 'Note 3 choses positives', description: 'Pratique la gratitude', difficulty: 'easy', impact: 'medium', category: 'mental', tags: ['gratitude', 'écriture'] },
    { id: 'm3', title: 'Respire profondément 5 fois', description: 'Apaise ton mental', difficulty: 'easy', impact: 'low', category: 'mental', tags: ['respiration', 'rapide'] },
    { id: 'm4', title: 'Déconnecte-toi 30 minutes', description: 'Loin des écrans', difficulty: 'normal', impact: 'high', category: 'mental', tags: ['détox', 'écrans'] },
    { id: 'm5', title: 'Écoute une musique apaisante', description: 'Détends-toi', difficulty: 'easy', impact: 'low', category: 'mental', tags: ['musique', 'relaxation'] },
    { id: 'm6', title: 'Écris tes émotions', description: 'Libère ce que tu ressens', difficulty: 'normal', impact: 'medium', category: 'mental', tags: ['écriture', 'émotions'] },
    
    // Créativité
    { id: 'c1', title: 'Écris une idée', description: 'Note ce qui te vient', difficulty: 'easy', impact: 'low', category: 'créativité', tags: ['écriture', 'idées'] },
    { id: 'c2', title: 'Dessine pendant 5 minutes', description: 'Laisse parler ton art', difficulty: 'easy', impact: 'medium', category: 'créativité', tags: ['art', 'dessin'] },
    { id: 'c3', title: 'Prends une photo', description: 'Capture un moment', difficulty: 'easy', impact: 'low', category: 'créativité', tags: ['photo', 'observation'] },
    { id: 'c4', title: 'Invente une histoire courte', description: 'Laisse libre cours à ton imagination', difficulty: 'normal', impact: 'high', category: 'créativité', tags: ['écriture', 'imagination'] },
    { id: 'c5', title: 'Écoute une nouvelle musique', description: 'Découvre de nouveaux sons', difficulty: 'easy', impact: 'low', category: 'créativité', tags: ['musique', 'découverte'] },
    { id: 'c6', title: 'Réorganise ton espace', description: 'Apporte du changement', difficulty: 'normal', impact: 'medium', category: 'créativité', tags: ['organisation', 'espace'] },
    
    // Apprentissage
    { id: 'a1', title: 'Lis 3 pages', description: 'Nourris ton esprit', difficulty: 'easy', impact: 'medium', category: 'apprentissage', tags: ['lecture', 'rapide'] },
    { id: 'a2', title: 'Apprends 3 nouveaux mots', description: 'Enrichis ton vocabulaire', difficulty: 'easy', impact: 'low', category: 'apprentissage', tags: ['vocabulaire', 'langue'] },
    { id: 'a3', title: 'Regarde un tutoriel', description: 'Apprends quelque chose de nouveau', difficulty: 'normal', impact: 'medium', category: 'apprentissage', tags: ['vidéo', 'compétence'] },
    { id: 'a4', title: 'Écoute un podcast éducatif', description: 'Cultive-toi en écoutant', difficulty: 'normal', impact: 'high', category: 'apprentissage', tags: ['audio', 'culture'] },
    { id: 'a5', title: 'Fais un exercice de maths', description: 'Entraîne ton cerveau', difficulty: 'normal', impact: 'medium', category: 'apprentissage', tags: ['logique', 'maths'] },
    { id: 'a6', title: 'Recherche un sujet inconnu', description: 'Explore de nouvelles connaissances', difficulty: 'easy', impact: 'medium', category: 'apprentissage', tags: ['recherche', 'curiosité'] },
    
    // Social
    { id: 's1', title: 'Envoie un message à un ami', description: 'Maintiens le lien', difficulty: 'easy', impact: 'medium', category: 'social', tags: ['communication', 'amitié'] },
    { id: 's2', title: 'Complimente quelqu\'un', description: 'Fais du bien autour de toi', difficulty: 'easy', impact: 'low', category: 'social', tags: ['gentillesse', 'rapide'] },
    { id: 's3', title: 'Appelle un proche', description: 'Prends des nouvelles', difficulty: 'normal', impact: 'high', category: 'social', tags: ['téléphone', 'famille'] },
    { id: 's4', title: 'Aide quelqu\'un', description: 'Rends service', difficulty: 'normal', impact: 'medium', category: 'social', tags: ['altruisme', 'aide'] },
    { id: 's5', title: 'Discute 10 minutes', description: 'Échange sincèrement', difficulty: 'easy', impact: 'medium', category: 'social', tags: ['conversation', 'échange'] },
    { id: 's6', title: 'Partage une découverte', description: 'Transmets ce que tu sais', difficulty: 'easy', impact: 'medium', category: 'social', tags: ['partage', 'connaissance'] },
    
    // Discipline
    { id: 'd1', title: 'Range un petit espace', description: 'Organise ton environnement', difficulty: 'easy', impact: 'low', category: 'discipline', tags: ['rangement', 'organisation'] },
    { id: 'd2', title: 'Fais ton lit', description: 'Commence la journée du bon pied', difficulty: 'easy', impact: 'low', category: 'discipline', tags: ['matin', 'routine'] },
    { id: 'd3', title: 'Planifie ta journée', description: 'Prends 5 minutes pour t\'organiser', difficulty: 'easy', impact: 'medium', category: 'discipline', tags: ['planning', 'organisation'] },
    { id: 'd4', title: 'Termine une tâche en attente', description: 'Barre quelque chose de ta liste', difficulty: 'normal', impact: 'high', category: 'discipline', tags: ['productivité', 'accomplissement'] },
    { id: 'd5', title: 'Lève-toi à l\'heure prévue', description: 'Respecte ton planning', difficulty: 'normal', impact: 'medium', category: 'discipline', tags: ['matin', 'réveil'] },
    { id: 'd6', title: 'Tiens un engagement', description: 'Sois fidèle à ta parole', difficulty: 'normal', impact: 'medium', category: 'discipline', tags: ['engagement', 'parole'] }
];

/* ===================================
   STORAGE FUNCTIONS
   =================================== */

function loadState() {
    const saved = localStorage.getItem(STATE_KEY);
    return saved ? JSON.parse(saved) : defaultState;
}

function saveState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/* ===================================
   UTILITY FUNCTIONS
   =================================== */

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function isSameDay(date1, date2) {
    return date1 === date2;
}

function isNextDay(lastDate, currentDate) {
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diff = (current - last) / (1000 * 60 * 60 * 24);
    return diff >= 1 && diff < 2;
}

function calculateQuestXP(difficulty, impact) {
    const baseXP = DIFFICULTY_XP[difficulty] || DIFFICULTY_XP.normal;
    const multiplier = IMPACT_MULTIPLIER[impact] || IMPACT_MULTIPLIER.medium;
    return Math.round(baseXP * multiplier);
}

function getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

/* ===================================
   STREAK LOGIC
   =================================== */

function updateStreak(state) {
    const today = getTodayDate();
    
    if (!state.lastQuestDate) {
        state.dailyStreak = 1;
        state.lastQuestDate = today;
        return { streakContinued: true, streakBonus: false };
    }
    
    if (isSameDay(state.lastQuestDate, today)) {
        return { streakContinued: false, streakBonus: false };
    }
    
    if (isNextDay(state.lastQuestDate, today)) {
        state.dailyStreak++;
        state.lastQuestDate = today;
        
        if (state.dailyStreak > state.bestStreak) {
            state.bestStreak = state.dailyStreak;
        }
        
        const streakBonus = state.dailyStreak % STREAK_BONUS_INTERVAL === 0;
        return { streakContinued: true, streakBonus };
    }
    
    // Streak broken
    state.dailyStreak = 1;
    state.lastQuestDate = today;
    return { streakContinued: true, streakBonus: false };
}

/* ===================================
   CHAPTER LOGIC
   =================================== */

function getCurrentChapter(chapterXP) {
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
        if (chapterXP >= CHAPTERS[i].xpRequired) {
            return i + 2 <= CHAPTERS.length ? CHAPTERS[i + 1] : CHAPTERS[i];
        }
    }
    return CHAPTERS[0];
}

function addChapterXP(state, amount) {
    state.chapterXP += amount;
    const chapter = getCurrentChapter(state.chapterXP);
    state.currentChapter = chapter.id;
    return chapter;
}

/* ===================================
   DAILY QUESTS LOGIC
   =================================== */

function generateDailyQuests(state) {
    const today = getTodayDate();
    
    if (state.dailyQuestsDate === today && state.dailyQuests.length === 3) {
        return state.dailyQuests;
    }
    
    // Generate 3 random quests
    const availableQuests = BASE_QUESTS.filter(q => !state.completedQuests.includes(q.id));
    const shuffled = availableQuests.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3).map(q => q.id);
    
    state.dailyQuests = selected;
    state.dailyQuestsDate = today;
    
    return selected;
}

/* ===================================
   NO EXCUSE CHALLENGE
   =================================== */

function generateNoExcuseQuest(state) {
    const today = getTodayDate();
    
    if (state.noExcuseDate === today && state.noExcuseQuest) {
        return state.noExcuseQuest;
    }
    
    // Generate random quest
    const availableQuests = BASE_QUESTS.filter(q => !state.completedQuests.includes(q.id));
    const random = availableQuests[Math.floor(Math.random() * availableQuests.length)];
    
    state.noExcuseQuest = random ? random.id : null;
    state.noExcuseDate = today;
    state.noExcuseCompleted = false;
    
    return random ? random.id : null;
}

/* ===================================
   XP & LEVEL LOGIC
   =================================== */

function calculateRequiredXP(level) {
    return 100 * level;
}

function getCurrentTitle(level) {
    const titleLevels = Object.keys(TITLES).map(Number).sort((a, b) => b - a);
    for (let titleLevel of titleLevels) {
        if (level >= titleLevel) {
            return TITLES[titleLevel];
        }
    }
    return TITLES[1];
}

function addXP(state, amount) {
    const oldLevel = state.level;
    state.xp += amount;
    
    let leveledUp = false;
    while (state.xp >= calculateRequiredXP(state.level)) {
        state.xp -= calculateRequiredXP(state.level);
        state.level++;
        leveledUp = true;
    }
    
    return { leveledUp, oldLevel, newLevel: state.level };
}

/* ===================================
   QUEST LOGIC
   =================================== */

function getAllQuests(state) {
    const allQuests = [...BASE_QUESTS, ...state.customQuests];
    // Calculate XP for each quest
    return allQuests.map(q => ({
        ...q,
        xp: q.xp || calculateQuestXP(q.difficulty, q.impact)
    }));
}

function isQuestCompleted(state, questId) {
    return state.completedQuests.includes(questId);
}

function completeQuest(state, questId, isNoExcuse = false) {
    if (isQuestCompleted(state, questId)) return null;
    
    const allQuests = getAllQuests(state);
    const quest = allQuests.find(q => q.id === questId);
    
    if (!quest) return null;
    
    state.completedQuests.push(questId);
    
    // Calculate XP
    let xpGained = quest.xp;
    if (isNoExcuse) {
        xpGained = Math.round(xpGained * 3); // 200% bonus = 3x
        state.noExcuseCompleted = true;
    }
    
    // Update streak
    const streakResult = updateStreak(state);
    let bonusXP = 0;
    
    if (streakResult.streakBonus) {
        bonusXP = STREAK_BONUS_XP;
        xpGained += bonusXP;
    }
    
    // Add XP
    const oldLevel = state.level;
    state.xp += xpGained;
    state.totalXPEarned += xpGained;
    
    // Chapter XP
    addChapterXP(state, xpGained);
    
    // Level up check
    let leveledUp = false;
    while (state.xp >= calculateRequiredXP(state.level)) {
        state.xp -= calculateRequiredXP(state.level);
        state.level++;
        leveledUp = true;
    }
    
    // Update category stats
    if (!state.categoryStats[quest.category]) {
        state.categoryStats[quest.category] = 0;
    }
    state.categoryStats[quest.category]++;
    
    return { 
        quest, 
        xpGained,
        leveledUp, 
        oldLevel, 
        newLevel: state.level,
        streakBonus: streakResult.streakBonus ? bonusXP : 0,
        isNoExcuse
    };
}

function createCustomQuest(state, questData) {
    const id = 'custom_' + Date.now();
    const tags = questData.tags ? questData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const newQuest = {
        id,
        title: questData.title,
        description: questData.description,
        difficulty: questData.difficulty,
        impact: questData.impact,
        category: questData.category,
        tags
    };
    
    state.customQuests.push(newQuest);
    return newQuest;
}

function filterQuests(quests, filters) {
    let filtered = quests;
    
    if (filters.category) {
        filtered = filtered.filter(q => q.category === filters.category);
    }
    
    if (filters.difficulty) {
        filtered = filtered.filter(q => q.difficulty === filters.difficulty);
    }
    
    return filtered;
}

/* ===================================
   STATISTICS
   =================================== */

function getTopCategory(state) {
    if (Object.keys(state.categoryStats).length === 0) return '-';
    
    let maxCategory = null;
    let maxCount = 0;
    
    for (const [category, count] of Object.entries(state.categoryStats)) {
        if (count > maxCount) {
            maxCount = count;
            maxCategory = category;
        }
    }
    
    return maxCategory || '-';
}

/* ===================================
   UI RENDERING
   =================================== */

function updateHeader(state) {
    const title = getCurrentTitle(state.level);
    const requiredXP = calculateRequiredXP(state.level);
    const xpPercent = (state.xp / requiredXP) * 100;
    
    document.getElementById('playerTitle').textContent = title;
    document.getElementById('levelNumber').textContent = state.level;
    document.getElementById('currentXP').textContent = state.xp;
    document.getElementById('requiredXP').textContent = requiredXP;
    
    const xpBar = document.getElementById('xpBar');
    xpBar.style.width = xpPercent + '%';
    
    // Update streak
    document.getElementById('streakValue').textContent = state.dailyStreak;
    
    // Update chapter
    const chapter = getCurrentChapter(state.chapterXP);
    document.getElementById('chapterName').textContent = chapter.name;
    document.getElementById('chapterProgress').textContent = `${state.chapterXP} / ${chapter.xpRequired} XP`;
    
    // Update total quests
    document.getElementById('totalQuestsCompleted').textContent = state.completedQuests.length;
}

function updateDailyTimer() {
    document.getElementById('dailyTimer').textContent = `Renouvellement dans ${getTimeUntilMidnight()}`;
}

function renderDailyQuests(state) {
    const grid = document.getElementById('dailyGrid');
    grid.innerHTML = '';
    
    const dailyIds = generateDailyQuests(state);
    const allQuests = getAllQuests(state);
    
    dailyIds.forEach(questId => {
        const quest = allQuests.find(q => q.id === questId);
        if (!quest) return;
        
        const isCompleted = isQuestCompleted(state, questId);
        
        const card = document.createElement('div');
        card.className = 'quest-card daily-quest-card';
        card.dataset.category = quest.category;
        
        if (isCompleted) {
            card.classList.add('completed');
        }
        
        card.innerHTML = `
            <div class="quest-header">
                <div class="quest-badges">
                    <span class="quest-category">${quest.category}</span>
                    <span class="quest-difficulty ${quest.difficulty}">${quest.difficulty}</span>
                </div>
                <span class="quest-xp">${quest.xp}</span>
            </div>
            <h3 class="quest-title">${quest.title}</h3>
            <p class="quest-description">${quest.description}</p>
            <button class="btn-validate" ${isCompleted ? 'disabled' : ''}>
                ${isCompleted ? 'Terminée' : 'Valider'}
            </button>
        `;
        
        if (!isCompleted) {
            const button = card.querySelector('.btn-validate');
            button.addEventListener('click', () => handleQuestComplete(questId));
        }
        
        grid.appendChild(card);
    });
}

function renderNoExcuseQuest(state) {
    const questId = generateNoExcuseQuest(state);
    const section = document.getElementById('noExcuseSection');
    
    if (!questId) {
        section.style.display = 'none';
        return;
    }
    
    const allQuests = getAllQuests(state);
    const quest = allQuests.find(q => q.id === questId);
    
    if (!quest) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    const isCompleted = isQuestCompleted(state, questId) || state.noExcuseCompleted;
    
    document.getElementById('noExcuseTitle').textContent = quest.title;
    document.getElementById('noExcuseDesc').textContent = quest.description;
    
    const btn = document.getElementById('noExcuseBtn');
    btn.disabled = isCompleted;
    btn.textContent = isCompleted ? 'Défi accompli !' : 'Accepter le défi';
    
    if (!isCompleted) {
        btn.onclick = () => handleQuestComplete(questId, true);
    }
}

function renderQuests(state, filters = {}) {
    const grid = document.getElementById('questsGrid');
    grid.innerHTML = '';
    
    let allQuests = getAllQuests(state);
    allQuests = filterQuests(allQuests, filters);
    
    allQuests.forEach(quest => {
        const card = document.createElement('div');
        card.className = 'quest-card';
        card.dataset.category = quest.category;
        
        const isCompleted = isQuestCompleted(state, quest.id);
        if (isCompleted) {
            card.classList.add('completed');
        }
        
        const tagsHTML = quest.tags && quest.tags.length > 0 
            ? `<div class="quest-tags">${quest.tags.map(tag => `<span class="quest-tag">${tag}</span>`).join('')}</div>`
            : '';
        
        card.innerHTML = `
            <div class="quest-header">
                <div class="quest-badges">
                    <span class="quest-category">${quest.category}</span>
                    <span class="quest-difficulty ${quest.difficulty}">${quest.difficulty}</span>
                </div>
                <span class="quest-xp">${quest.xp}</span>
            </div>
            <h3 class="quest-title">${quest.title}</h3>
            <p class="quest-description">${quest.description}</p>
            ${tagsHTML}
            <button class="btn-validate" ${isCompleted ? 'disabled' : ''}>
                ${isCompleted ? 'Terminée' : 'Valider'}
            </button>
        `;
        
        if (!isCompleted) {
            const button = card.querySelector('.btn-validate');
            button.addEventListener('click', () => handleQuestComplete(quest.id));
        }
        
        grid.appendChild(card);
    });
}

function renderStats(state) {
    document.getElementById('statTotalXP').textContent = state.totalXPEarned;
    document.getElementById('statTotalQuests').textContent = state.completedQuests.length;
    document.getElementById('statBestStreak').textContent = state.bestStreak;
    document.getElementById('statTopCategory').textContent = getTopCategory(state);
    
    // Category breakdown
    const breakdown = document.getElementById('categoryBreakdown');
    breakdown.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1rem;">Par catégorie</h3>';
    
    const categories = ['santé', 'mental', 'créativité', 'apprentissage', 'social', 'discipline'];
    const colors = {
        'santé': '#4ecdc4',
        'mental': '#a67dff',
        'créativité': '#ff6e3d',
        'apprentissage': '#ffc13b',
        'social': '#ff5e78',
        'discipline': '#7eb2dd'
    };
    
    categories.forEach(cat => {
        const count = state.categoryStats[cat] || 0;
        const div = document.createElement('div');
        div.className = 'category-stat';
        div.style.setProperty('--cat-color', colors[cat]);
        div.innerHTML = `
            <span class="category-stat-name">${cat}</span>
            <span class="category-stat-count">${count}</span>
        `;
        breakdown.appendChild(div);
    });
}

function showLevelUpModal(newLevel, oldTitle, newTitle) {
    const modal = document.getElementById('levelUpModal');
    document.getElementById('modalLevel').textContent = newLevel;
    
    const modalNewTitle = document.getElementById('modalNewTitle');
    if (oldTitle !== newTitle) {
        modalNewTitle.textContent = `Nouveau titre : ${newTitle}`;
    } else {
        modalNewTitle.textContent = '';
    }
    
    modal.classList.add('active');
}

function showStreakBonusModal(streakDays, bonusXP) {
    const modal = document.getElementById('streakModal');
    document.getElementById('streakDays').textContent = streakDays;
    document.getElementById('streakBonus').textContent = bonusXP;
    modal.classList.add('active');
}

function showStatsModal(state) {
    renderStats(state);
    document.getElementById('statsModal').classList.add('active');
}

function closeModal() {
    document.getElementById('levelUpModal').classList.remove('active');
}

function closeStreakModal() {
    document.getElementById('streakModal').classList.remove('active');
}

function closeStatsModal() {
    document.getElementById('statsModal').classList.remove('active');
}

/* ===================================
   EVENT HANDLERS
   =================================== */

function handleQuestComplete(questId, isNoExcuse = false) {
    const state = loadState();
    const oldTitle = getCurrentTitle(state.level);
    
    const result = completeQuest(state, questId, isNoExcuse);
    
    if (!result) return;
    
    saveState(state);
    
    // Animate XP gain
    const xpBar = document.getElementById('xpBar');
    xpBar.classList.add('xp-gain-animation');
    setTimeout(() => xpBar.classList.remove('xp-gain-animation'), 600);
    
    updateHeader(state);
    renderQuests(state, getCurrentFilters());
    renderDailyQuests(state);
    renderNoExcuseQuest(state);
    
    // Show streak bonus modal first if applicable
    if (result.streakBonus > 0) {
        setTimeout(() => {
            showStreakBonusModal(state.dailyStreak, result.streakBonus);
        }, 700);
    }
    
    // Show level up modal
    if (result.leveledUp) {
        const newTitle = getCurrentTitle(state.level);
        const delay = result.streakBonus > 0 ? 2500 : 700;
        setTimeout(() => {
            showLevelUpModal(result.newLevel, oldTitle, newTitle);
        }, delay);
    }
}

function getCurrentFilters() {
    return {
        category: document.getElementById('filterCategory').value,
        difficulty: document.getElementById('filterDifficulty').value
    };
}

function handleFilterChange() {
    const state = loadState();
    renderQuests(state, getCurrentFilters());
}

function updateXPPreview() {
    const difficulty = document.getElementById('questDifficulty').value;
    const impact = document.getElementById('questImpact').value;
    const xp = calculateQuestXP(difficulty, impact);
    document.getElementById('xpPreview').textContent = xp;
}

function handleQuestFormSubmit(e) {
    e.preventDefault();
    
    const state = loadState();
    
    const questData = {
        title: document.getElementById('questName').value,
        description: document.getElementById('questDesc').value,
        difficulty: document.getElementById('questDifficulty').value,
        impact: document.getElementById('questImpact').value,
        category: document.getElementById('questCategory').value,
        tags: document.getElementById('questTags').value
    };
    
    createCustomQuest(state, questData);
    saveState(state);
    
    renderQuests(state, getCurrentFilters());
    
    // Reset form
    e.target.reset();
    updateXPPreview();
    
    // Scroll to new quest (last in grid)
    setTimeout(() => {
        const grid = document.getElementById('questsGrid');
        const lastQuest = grid.lastElementChild;
        if (lastQuest) {
            lastQuest.scrollIntoView({ behavior: 'smooth', block: 'center' });
            lastQuest.style.animation = 'none';
            setTimeout(() => {
                lastQuest.style.animation = '';
                lastQuest.classList.add('xp-gain-animation');
                setTimeout(() => lastQuest.classList.remove('xp-gain-animation'), 600);
            }, 10);
        }
    }, 100);
}

/* ===================================
   INITIALIZATION
   =================================== */

function init() {
    const state = loadState();
    
    updateHeader(state);
    renderDailyQuests(state);
    renderNoExcuseQuest(state);
    renderQuests(state);
    updateDailyTimer();
    
    // Event listeners
    document.getElementById('questForm').addEventListener('submit', handleQuestFormSubmit);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('closeStreakModal').addEventListener('click', closeStreakModal);
    document.getElementById('closeStatsModal').addEventListener('click', closeStatsModal);
    
    // Filter listeners
    document.getElementById('filterCategory').addEventListener('change', handleFilterChange);
    document.getElementById('filterDifficulty').addEventListener('change', handleFilterChange);
    
    // XP preview update
    document.getElementById('questDifficulty').addEventListener('change', updateXPPreview);
    document.getElementById('questImpact').addEventListener('change', updateXPPreview);
    
    // Stats toggle
    document.getElementById('statsToggle').addEventListener('click', () => {
        showStatsModal(state);
    });
    
    // Close modals on background click
    document.getElementById('levelUpModal').addEventListener('click', (e) => {
        if (e.target.id === 'levelUpModal') closeModal();
    });
    
    document.getElementById('streakModal').addEventListener('click', (e) => {
        if (e.target.id === 'streakModal') closeStreakModal();
    });
    
    document.getElementById('statsModal').addEventListener('click', (e) => {
        if (e.target.id === 'statsModal') closeStatsModal();
    });
    
    // Update daily timer every minute
    setInterval(() => {
        updateDailyTimer();
        
        // Check if day changed - regenerate daily quests
        const currentState = loadState();
        const today = getTodayDate();
        if (currentState.dailyQuestsDate !== today) {
            renderDailyQuests(currentState);
            renderNoExcuseQuest(currentState);
            saveState(currentState);
        }
    }, 60000);
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}