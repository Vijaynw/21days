/**
 * Collections Utility (JavaScript)
 * Manage habit collections/folders
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const COLLECTIONS_KEY = '@collections';

export const collectionsStorage = {
  // Get all collections
  async getCollections() {
    try {
      const data = await AsyncStorage.getItem(COLLECTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  },

  // Save all collections
  async saveCollections(collections) {
    try {
      await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
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
