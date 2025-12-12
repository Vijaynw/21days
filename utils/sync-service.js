/**
 * Sync Service for Supabase
 * Handles syncing habits data between local storage and Supabase
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

const LAST_SYNC_KEY = '@last_sync';
const SYNC_STATUS_KEY = '@sync_status';

export const syncService = {
  /**
   * Get current user ID
   */
  async getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const userId = await this.getUserId();
    return !!userId;
  },

  /**
   * Get local habits
   */
  async getLocalHabits() {
    try {
      const key = await getUserHabitsKey();
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (_error) {
      return [];
    }
  },

  /**
   * Save habits locally
   */
  async saveLocalHabits(habits) {
    try {
      const key = await getUserHabitsKey();
      await AsyncStorage.setItem(key, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving local habits:', error);
    }
  },

  /**
   * Get habits from Supabase
   */
  async getCloudHabits() {
    const userId = await this.getUserId();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cloud habits:', error);
      return [];
    }
  },

  /**
   * Upload a habit to Supabase
   */
  async uploadHabit(habit) {
    const userId = await this.getUserId();
    if (!userId) return { error: 'Not authenticated' };

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
        reminder_time: habit.reminderTime,
        notes: habit.notes || {},
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('habits')
        .upsert(habitData, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error uploading habit:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a habit from Supabase
   */
  async deleteCloudHabit(habitId) {
    const userId = await this.getUserId();
    if (!userId) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting cloud habit:', error);
      return { error };
    }
  },

  /**
   * Sync all habits (merge local and cloud)
   * Strategy: Cloud data takes priority for conflicts, but local-only items are uploaded
   */
  async syncAll() {
    const userId = await this.getUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await this.setSyncStatus('syncing');

      const localHabits = await this.getLocalHabits();
      const cloudHabits = await this.getCloudHabits();

      // Create maps for easy lookup
      const localMap = new Map(localHabits.map(h => [h.id, h]));
      const cloudMap = new Map(cloudHabits.map(h => [h.id, h]));

      const mergedHabits = [];
      const toUpload = [];

      // Process cloud habits (they take priority)
      for (const cloudHabit of cloudHabits) {
        const habit = {
          id: cloudHabit.id,
          name: cloudHabit.name,
          description: cloudHabit.description,
          category: cloudHabit.category,
          color: cloudHabit.color,
          icon: cloudHabit.icon,
          createdAt: cloudHabit.created_at,
          completions: cloudHabit.completions || [],
          reminderTime: cloudHabit.reminder_time,
          notes: cloudHabit.notes || {},
        };

        // Merge completions if local has more recent data
        const localHabit = localMap.get(cloudHabit.id);
        if (localHabit) {
          // Merge completions (union of both)
          const allCompletions = new Set([
            ...(habit.completions || []),
            ...(localHabit.completions || []),
          ]);
          habit.completions = Array.from(allCompletions).sort();

          // Merge notes
          habit.notes = { ...habit.notes, ...localHabit.notes };
        }

        mergedHabits.push(habit);
      }

      // Add local-only habits and upload them
      for (const localHabit of localHabits) {
        if (!cloudMap.has(localHabit.id)) {
          mergedHabits.push(localHabit);
          toUpload.push(localHabit);
        }
      }

      // Upload local-only habits to cloud
      for (const habit of toUpload) {
        await this.uploadHabit(habit);
      }

      // Upload merged completions back to cloud
      for (const habit of mergedHabits) {
        if (cloudMap.has(habit.id)) {
          await this.uploadHabit(habit);
        }
      }

      // Save merged habits locally
      await this.saveLocalHabits(mergedHabits);

      // Update last sync time
      await this.setLastSyncTime();
      await this.setSyncStatus('synced');

      return { success: true, habits: mergedHabits };
    } catch (error) {
      console.error('Sync error:', error);
      await this.setSyncStatus('error');
      return { success: false, error: error.message };
    }
  },

  /**
   * Push local changes to cloud
   */
  async pushToCloud() {
    const userId = await this.getUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await this.setSyncStatus('syncing');
      const localHabits = await this.getLocalHabits();

      for (const habit of localHabits) {
        await this.uploadHabit(habit);
      }

      await this.setLastSyncTime();
      await this.setSyncStatus('synced');

      return { success: true };
    } catch (error) {
      console.error('Push error:', error);
      await this.setSyncStatus('error');
      return { success: false, error: error.message };
    }
  },

  /**
   * Pull cloud data to local (overwrites local)
   */
  async pullFromCloud() {
    const userId = await this.getUserId();
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      await this.setSyncStatus('syncing');
      const cloudHabits = await this.getCloudHabits();

      // Convert cloud format to local format
      const localHabits = cloudHabits.map(h => ({
        id: h.id,
        name: h.name,
        description: h.description,
        category: h.category,
        color: h.color,
        icon: h.icon,
        createdAt: h.created_at,
        completions: h.completions || [],
        missed: h.missed || [],
        reminderTime: h.reminder_time,
        notes: h.notes || {},
      }));

      await this.saveLocalHabits(localHabits);
      await this.setLastSyncTime();
      await this.setSyncStatus('synced');

      return { success: true, habits: localHabits };
    } catch (error) {
      console.error('Pull error:', error);
      await this.setSyncStatus('error');
      return { success: false, error: error.message };
    }
  },

  /**
   * Get last sync time
   */
  async getLastSyncTime() {
    try {
      const time = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return time ? new Date(time) : null;
    } catch (_error) {
      return null;
    }
  },

  /**
   * Set last sync time
   */
  async setLastSyncTime() {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error setting last sync time:', error);
    }
  },

  /**
   * Get sync status
   */
  async getSyncStatus() {
    try {
      const status = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      return status || 'idle';
    } catch (_error) {
      return 'idle';
    }
  },

  /**
   * Set sync status
   */
  async setSyncStatus(status) {
    try {
      await AsyncStorage.setItem(SYNC_STATUS_KEY, status);
    } catch (error) {
      console.error('Error setting sync status:', error);
    }
  },
};

export default syncService;
