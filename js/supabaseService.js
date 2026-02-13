// Service Supabase pour QuestForge
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://apiisvdmuzwkdklyjruz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaWlzdmRtdXp3a2RrbHlqcnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MDQwNjQsImV4cCI6MjA1NDk4MDA2NH0.sb_publishable_blxszWKxKm1wqzohJ0byxQ_7M_fs9I6';

class SupabaseService {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.currentUser = null;
        this.initAuthListener();
    }

    // ============================================
    // AUTHENTICATION
    // ============================================

    initAuthListener() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user ?? null;
            
            if (event === 'SIGNED_IN') {
                this.onAuthStateChange('signed_in', session.user);
            } else if (event === 'SIGNED_OUT') {
                this.onAuthStateChange('signed_out', null);
            }
        });
    }

    onAuthStateChange(event, user) {
        // Override this method in your app
        console.log('Auth state changed:', event, user);
    }

    async signUp(email, password, username) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username || email.split('@')[0]
                    }
                }
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error signing up:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error signing in:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error signing out:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error resetting password:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // PROFILE MANAGEMENT
    // ============================================

    async getProfile() {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting profile:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProfile(updates) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: error.message };
        }
    }

    async updateXP(xpGain) {
        try {
            const profile = await this.getProfile();
            if (!profile.success) throw new Error('Could not get profile');

            const newXP = (profile.data.xp || 0) + xpGain;
            
            return await this.updateProfile({ xp: newXP });
        } catch (error) {
            console.error('Error updating XP:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // QUEST COMPLETION
    // ============================================

    async completeQuest(quest, xpGain) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            // Start a transaction-like operation
            const profile = await this.getProfile();
            if (!profile.success) throw new Error('Could not get profile');

            const currentData = profile.data;
            
            // 1. Update profile XP and quest count
            const newXP = (currentData.xp || 0) + xpGain;
            const newCompletedQuests = (currentData.completed_quests || 0) + 1;
            
            // Calculate streak
            const streakData = this.calculateStreak(currentData.last_completion_date, currentData.streak);
            
            await this.updateProfile({
                xp: newXP,
                completed_quests: newCompletedQuests,
                streak: streakData.streak,
                best_streak: Math.max(currentData.best_streak || 0, streakData.streak),
                last_completion_date: new Date().toISOString()
            });

            // 2. Add to quest history
            await this.supabase.from('quest_history').insert({
                user_id: user.id,
                quest_id: quest.id,
                quest_title: quest.title,
                category: quest.category,
                xp_gained: xpGain
            });

            // 3. Update category stats
            await this.updateCategoryStats(quest.category, xpGain);

            // 4. Mark quest as completed
            await this.supabase.from('completed_quest_ids').insert({
                user_id: user.id,
                quest_id: quest.id
            }).onConflict('user_id,quest_id').ignore();

            return { 
                success: true, 
                data: { 
                    newXP, 
                    streak: streakData.streak,
                    streakIncreased: streakData.increased
                } 
            };
        } catch (error) {
            console.error('Error completing quest:', error);
            return { success: false, error: error.message };
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
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data: existing } = await this.supabase
                .from('category_stats')
                .select('*')
                .eq('user_id', user.id)
                .eq('category', category)
                .single();

            if (existing) {
                await this.supabase
                    .from('category_stats')
                    .update({
                        count: existing.count + 1,
                        total_xp: existing.total_xp + xpGain
                    })
                    .eq('id', existing.id);
            } else {
                await this.supabase
                    .from('category_stats')
                    .insert({
                        user_id: user.id,
                        category: category,
                        count: 1,
                        total_xp: xpGain
                    });
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating category stats:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // CUSTOM QUESTS
    // ============================================

    async getCustomQuests() {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('custom_quests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting custom quests:', error);
            return { success: false, error: error.message };
        }
    }

    async addCustomQuest(quest) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('custom_quests')
                .insert({
                    user_id: user.id,
                    title: quest.title,
                    description: quest.description,
                    category: quest.category,
                    difficulty: quest.difficulty,
                    impact: quest.impact,
                    duration: quest.duration,
                    level_required: quest.level_required || 1
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error adding custom quest:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteCustomQuest(questId) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await this.supabase
                .from('custom_quests')
                .delete()
                .eq('id', questId)
                .eq('user_id', user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting custom quest:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // STATISTICS
    // ============================================

    async getCategoryStats() {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('category_stats')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            
            const stats = {};
            data.forEach(stat => {
                stats[stat.category] = stat.count;
            });

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error getting category stats:', error);
            return { success: false, error: error.message };
        }
    }

    async getQuestHistory(limit = 50) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('quest_history')
                .select('*')
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error getting quest history:', error);
            return { success: false, error: error.message };
        }
    }

    async isQuestCompleted(questId) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.supabase
                .from('completed_quest_ids')
                .select('id')
                .eq('user_id', user.id)
                .eq('quest_id', questId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
            return { success: true, data: !!data };
        } catch (error) {
            console.error('Error checking quest completion:', error);
            return { success: false, error: error.message };
        }
    }

    async getDominantCategory() {
        try {
            const stats = await this.getCategoryStats();
            if (!stats.success) return { success: false };

            let maxCategory = null;
            let maxCount = 0;

            for (const [category, count] of Object.entries(stats.data)) {
                if (count > maxCount) {
                    maxCount = count;
                    maxCategory = category;
                }
            }

            return { success: true, data: maxCategory };
        } catch (error) {
            console.error('Error getting dominant category:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export for use in app
if (typeof window !== 'undefined') {
    window.SupabaseService = SupabaseService;
}

export default SupabaseService;