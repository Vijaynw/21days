/**
 * Collections Utility (JavaScript)
 * Manage habit collections/folders
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper to get user-specific storage key for collections
const getUserCollectionsKey = async () => {
  const userId = await getUserId();
  return userId ? `@collections_${userId}` : '@collections_guest';
};

export const collectionsStorage = {
  // Get all collections
  async getCollections() {
    try {
      const key = await getUserCollectionsKey();
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  },

  // Save all collections
  async saveCollections(collections) {
    try {
      const key = await getUserCollectionsKey();
      await AsyncStorage.setItem(key, JSON.stringify(collections));
    } catch (error) {
      console.error('Error saving collections:', error);
    }
  },

  // Add a new collection
  async addCollection(name, icon = '📁', color = '#1a1a1a') {
    const collections = await this.getCollections();
    const newCollection = {
      id: Date.now().toString(),
      name,
      icon,
      color,
      createdAt: new Date().toISOString(),
    };
    collections.push(newCollection);
    await this.saveCollections(collections);
    return newCollection;
  },

  // Update a collection
  async updateCollection(collectionId, updates) {
    const collections = await this.getCollections();
    const index = collections.findIndex(c => c.id === collectionId);
    if (index !== -1) {
      collections[index] = { ...collections[index], ...updates };
      await this.saveCollections(collections);
    }
  },

  // Delete a collection
  async deleteCollection(collectionId) {
    const collections = await this.getCollections();
    const filtered = collections.filter(c => c.id !== collectionId);
    await this.saveCollections(filtered);
  },
};

export default collectionsStorage;
