/**
 * Storage Migration Utility
 * Migrates shared storage to user-specific storage for data isolation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

/**
 * Clear shared storage and migrate to user-specific storage
 * This should be called once per user after login
 */
export const migrateToUserSpecificStorage = async () => {
  const userId = await getUserId();
  if (!userId) return { success: false, error: 'Not authenticated' };

  try {
    const userHabitsKey = `@habits_${userId}`;
    const userCollectionsKey = `@collections_${userId}`;
    
    // Check if user already has migrated data
    const existingUserHabits = await AsyncStorage.getItem(userHabitsKey);
    const existingUserCollections = await AsyncStorage.getItem(userCollectionsKey);
    
    // If user already has data, don't migrate
    if (existingUserHabits || existingUserCollections) {
      return { success: true, migrated: false };
    }

    // Get old shared data
    const oldHabits = await AsyncStorage.getItem('@habits');
    const oldCollections = await AsyncStorage.getItem('@collections');

    // Migrate habits if they exist
    if (oldHabits) {
      await AsyncStorage.setItem(userHabitsKey, oldHabits);
      console.log('Migrated habits to user-specific storage');
    }

    // Migrate collections if they exist
    if (oldCollections) {
      await AsyncStorage.setItem(userCollectionsKey, oldCollections);
      console.log('Migrated collections to user-specific storage');
    }

    // Clear old shared storage to prevent data leakage
    await AsyncStorage.removeItem('@habits');
    await AsyncStorage.removeItem('@collections');
    console.log('Cleared shared storage');

    return { 
      success: true, 
      migrated: true,
      habitsMigrated: !!oldHabits,
      collectionsMigrated: !!oldCollections
    };

  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all shared storage keys (emergency cleanup)
 */
export const clearSharedStorage = async () => {
  try {
    await AsyncStorage.removeItem('@habits');
    await AsyncStorage.removeItem('@collections');
    console.log('Cleared all shared storage');
    return { success: true };
  } catch (error) {
    console.error('Error clearing shared storage:', error);
    return { success: false, error: error.message };
  }
};

export default {
  migrateToUserSpecificStorage,
  clearSharedStorage,
};
