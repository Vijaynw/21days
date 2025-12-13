/**
 * Storage Utility (JavaScript)
 * Saves to local storage first, then syncs to Supabase
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper to get user-specific storage key
const getUserHabitsKey = async () => {
  const userId = await getUserId();
  return userId ? `@habits_${userId}` : '@habits_guest';
};

// Helper to sync habit to Supabase
const syncHabitToCloud = async (habit) => {
  const userId = await getUserId();
  if (!userId) return;

  try {
    const habitData = {
      id: habit.id,
      user_id: userId,
      name: habit.name,
      description: habit.description || '',
      category: habit.category || 'custom',
      color: habit.color || '#1a1a1a',
      icon: habit.icon || '🎯',
      created_at: habit.createdAt,
      completions: habit.completions || [],
      missed: habit.missed || [],
      reminder_time: habit.reminderTime,
      notes: habit.notes || {},
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('habits')
      .upsert(habitData, { onConflict: 'id' });
  } catch (error) {
    console.error('Error syncing habit to cloud:', error);
  }
};

// Helper to delete habit from Supabase
const deleteHabitFromCloud = async (habitId) => {
  const userId = await getUserId();
  if (!userId) return;

  try {
    await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error deleting habit from cloud:', error);
  }
};

export const storage = {
  async getHabits() {
    try {
      const key = await getUserHabitsKey();
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  },

  async saveHabits(habits) {
    try {
      const key = await getUserHabitsKey();
      await AsyncStorage.setItem(key, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  },

  async addHabit(habit) {
    const habits = await this.getHabits();
    habits.push(habit);
    await this.saveHabits(habits);
    // Sync to Supabase
    // syncHabitToCloud(habit);
  },

  async updateHabit(updatedHabit) {
    const habits = await this.getHabits();
    const index = habits.findIndex(function(h) {
      return h.id === updatedHabit.id;
    });
    if (index !== -1) {
      habits[index] = updatedHabit;
      await this.saveHabits(habits);
      // Sync to Supabase
      // syncHabitToCloud(updatedHabit);
    }
  },

  async deleteHabit(habitId) {
    const habits = await this.getHabits();
    const filtered = habits.filter(function(h) {
      return h.id !== habitId;
    });
    await this.saveHabits(filtered);
    // Delete from Supabase
    // deleteHabitFromCloud(habitId);
  },

  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item:', error);
    }
  },
};

export default storage;
