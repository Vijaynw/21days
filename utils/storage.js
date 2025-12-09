/**
 * Storage Utility (JavaScript)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_KEY = '@habits';

export const storage = {
  async getHabits() {
    try {
      const data = await AsyncStorage.getItem(HABITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  },

  async saveHabits(habits) {
    try {
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  },

  async addHabit(habit) {
    const habits = await this.getHabits();
    habits.push(habit);
    await this.saveHabits(habits);
  },

  async updateHabit(updatedHabit) {
    const habits = await this.getHabits();
    const index = habits.findIndex(function(h) {
      return h.id === updatedHabit.id;
    });
    if (index !== -1) {
      habits[index] = updatedHabit;
      await this.saveHabits(habits);
    }
  },

  async deleteHabit(habitId) {
    const habits = await this.getHabits();
    const filtered = habits.filter(function(h) {
      return h.id !== habitId;
    });
    await this.saveHabits(filtered);
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
