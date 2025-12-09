/**
 * Habit Types (JavaScript)
 * 
 * HabitCategory: 'health' | 'productivity' | 'learning' | 'mindfulness' | 'social' | 'creative' | 'custom'
 */

// Habit Categories
export const HABIT_CATEGORIES = {
  health: 'health',
  productivity: 'productivity',
  learning: 'learning',
  mindfulness: 'mindfulness',
  social: 'social',
  creative: 'creative',
  custom: 'custom',
};

/**
 * Create a new habit object
 * @param {Object} params - Habit parameters
 * @returns {Object} Habit object
 */
export function createHabit(params) {
  return {
    id: params.id || Date.now().toString(),
    name: params.name || '',
    description: params.description || '',
    category: params.category || null,
    color: params.color || '#1a1a1a',
    createdAt: params.createdAt || new Date().toISOString(),
    completions: params.completions || [], // Array of ISO date strings (YYYY-MM-DD)
    reminderTime: params.reminderTime || null, // HH:MM format
    notes: params.notes || {}, // Notes per date
    icon: params.icon || '🎯',
  };
}

/**
 * Create habit stats object
 * @param {Object} params - Stats parameters
 * @returns {Object} HabitStats object
 */
export function createHabitStats(params) {
  return {
    currentStreak: params.currentStreak || 0,
    longestStreak: params.longestStreak || 0,
    totalCompletions: params.totalCompletions || 0,
    completionRate: params.completionRate || 0, // percentage
  };
}
