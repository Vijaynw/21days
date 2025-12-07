import { Habit } from '@/types/habit';
import { storage } from './storage';

// Premium Features Implementation

export class PremiumFeatures {
  // 1. Unlimited Habits - Already implemented in PremiumContext.canAddMoreHabits()

  // 2. Advanced Analytics
  static getAdvancedAnalytics(habits: Habit[]) {
    const totalHabits = habits.length;
    const activeToday = habits.filter(h => 
      h.completions.includes(new Date().toISOString().split('T')[0])
    ).length;
    
    const weeklyProgress = this.getWeeklyProgress(habits);
    const monthlyProgress = this.getMonthlyProgress(habits);
    const bestPerformingHabits = this.getBestPerformingHabits(habits);
    const habitCategories = this.getCategoryBreakdown(habits);

    return {
      totalHabits,
      activeToday,
      weeklyProgress,
      monthlyProgress,
      bestPerformingHabits,
      habitCategories,
      completionTrends: this.getCompletionTrends(habits)
    };
  }

  // 3. Custom Reminders
  static async setReminder(habitId: string, reminderTime: string) {
    const habits = await storage.getHabits();
    const habitIndex = habits.findIndex(h => h.id === habitId);
    
    if (habitIndex !== -1) {
      habits[habitIndex].reminderTime = reminderTime;
      await storage.updateHabit(habits[habitIndex]);
      return true;
    }
    return false;
  }

  // 4. Habit Notes
  static async addHabitNote(habitId: string, date: string, note: string) {
    const habits = await storage.getHabits();
    const habit = habits.find(h => h.id === habitId);
    
    if (habit) {
      if (!habit.notes) habit.notes = {};
      habit.notes[date] = note;
      await storage.updateHabit(habit);
      return true;
    }
    return false;
  }

  static async getHabitNotes(habitId: string) {
    const habits = await storage.getHabits();
    const habit = habits.find(h => h.id === habitId);
    return habit?.notes || {};
  }

  // 5. Export Data
  static exportToCSV(habits: Habit[]) {
    const headers = ['Habit Name', 'Category', 'Created Date', 'Total Completions', 'Current Streak'];
    const rows = habits.map(habit => [
      habit.name,
      habit.category || 'none',
      habit.createdAt,
      habit.completions.length,
      this.calculateStreak(habit)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  static exportToJSON(habits: Habit[]) {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      habits: habits
    }, null, 2);
  }

  // 6. Premium Themes
  static getPremiumThemes() {
    return [
      { id: 'sunset', name: 'Sunset', colors: ['#FF6B6B', '#FFE66D'] },
      { id: 'ocean', name: 'Ocean', colors: ['#4ECDC4', '#44A08D'] },
      { id: 'forest', name: 'Forest', colors: ['#95E1D3', '#3D5A80'] },
      { id: 'lavender', name: 'Lavender', colors: ['#C9ADA7', '#9A8C98'] },
      { id: 'midnight', name: 'Midnight', colors: ['#2D3436', '#636E72'] }
    ];
  }

  // 7. Home Screen Widgets
  static getWidgetData(habits: Habit[]) {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => h.completions.includes(today));
    
    return {
      totalHabits: habits.length,
      completedToday: completedToday.length,
      percentage: habits.length > 0 ? Math.round((completedToday.length / habits.length) * 100) : 0,
      topHabit: completedToday[0]?.name || 'None'
    };
  }

  // 8. Cloud Backup (placeholder implementation)
  static async backupToCloud() {
    const habits = await storage.getHabits();
    const backupData = {
      timestamp: new Date().toISOString(),
      habits: habits,
      version: '1.0'
    };
    
    console.log('Cloud backup data:', backupData);
    return backupData;
  }

  // Helper functions
  private static getWeeklyProgress(habits: Habit[]) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    return habits.map(habit => ({
      name: habit.name,
      completions: habit.completions.filter(date => 
        new Date(date) >= weekStart
      ).length
    }));
  }

  private static getMonthlyProgress(habits: Habit[]) {
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);
    
    return habits.map(habit => ({
      name: habit.name,
      completions: habit.completions.filter(date => 
        new Date(date) >= monthStart
      ).length
    }));
  }

  private static getBestPerformingHabits(habits: Habit[]) {
    return habits
      .map(habit => ({
        name: habit.name,
        streak: this.calculateStreak(habit),
        totalCompletions: habit.completions.length
      }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5);
  }

  private static getCategoryBreakdown(habits: Habit[]) {
    const categories: { [key: string]: number } = {};
    
    habits.forEach(habit => {
      const category = habit.category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  }

  private static getCompletionTrends(habits: Habit[]) {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completed = habits.filter(h => h.completions.includes(dateStr)).length;
      last30Days.push({ date: dateStr, completed });
    }
    
    return last30Days;
  }

  private static calculateStreak(habit: Habit): number {
    const sortedDates = habit.completions
      .map(date => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (currentDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}
