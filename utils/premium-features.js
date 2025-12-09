/**
 * Premium Features Utility (JavaScript)
 */

import { storage } from './storage';

// Premium Features Implementation
export const PremiumFeatures = {
  // 2. Advanced Analytics
  getAdvancedAnalytics: function(habits) {
    const totalHabits = habits.length;
    const activeToday = habits.filter(function(h) {
      return h.completions.includes(new Date().toISOString().split('T')[0]);
    }).length;
    
    const weeklyProgress = this.getWeeklyProgress(habits);
    const monthlyProgress = this.getMonthlyProgress(habits);
    const bestPerformingHabits = this.getBestPerformingHabits(habits);
    const habitCategories = this.getCategoryBreakdown(habits);

    return {
      totalHabits: totalHabits,
      activeToday: activeToday,
      weeklyProgress: weeklyProgress,
      monthlyProgress: monthlyProgress,
      bestPerformingHabits: bestPerformingHabits,
      habitCategories: habitCategories,
      completionTrends: this.getCompletionTrends(habits),
    };
  },

  // 3. Custom Reminders
  setReminder: async function(habitId, reminderTime) {
    const habits = await storage.getHabits();
    const habitIndex = habits.findIndex(function(h) {
      return h.id === habitId;
    });
    
    if (habitIndex !== -1) {
      habits[habitIndex].reminderTime = reminderTime;
      await storage.updateHabit(habits[habitIndex]);
      return true;
    }
    return false;
  },

  // 4. Habit Notes
  addHabitNote: async function(habitId, date, note) {
    const habits = await storage.getHabits();
    const habit = habits.find(function(h) {
      return h.id === habitId;
    });
    
    if (habit) {
      if (!habit.notes) habit.notes = {};
      habit.notes[date] = note;
      await storage.updateHabit(habit);
      return true;
    }
    return false;
  },

  getHabitNotes: async function(habitId) {
    const habits = await storage.getHabits();
    const habit = habits.find(function(h) {
      return h.id === habitId;
    });
    return habit && habit.notes ? habit.notes : {};
  },

  // 5. Export Data
  exportToCSV: function(habits) {
    const headers = ['Habit Name', 'Category', 'Created Date', 'Total Completions', 'Current Streak'];
    const self = this;
    const rows = habits.map(function(habit) {
      return [
        habit.name,
        habit.category || 'none',
        habit.createdAt,
        habit.completions.length,
        self.calculateStreak(habit),
      ];
    });

    return [headers].concat(rows).map(function(row) {
      return row.join(',');
    }).join('\n');
  },

  exportToJSON: function(habits) {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      habits: habits,
    }, null, 2);
  },

  // 6. Premium Themes
  getPremiumThemes: function() {
    return [
      { id: 'sunset', name: 'Sunset', colors: ['#FF6B6B', '#FFE66D'] },
      { id: 'ocean', name: 'Ocean', colors: ['#4ECDC4', '#44A08D'] },
      { id: 'forest', name: 'Forest', colors: ['#95E1D3', '#3D5A80'] },
      { id: 'lavender', name: 'Lavender', colors: ['#C9ADA7', '#9A8C98'] },
      { id: 'midnight', name: 'Midnight', colors: ['#2D3436', '#636E72'] },
    ];
  },

  // 7. Home Screen Widgets
  getWidgetData: function(habits) {
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(function(h) {
      return h.completions.includes(today);
    });
    
    return {
      totalHabits: habits.length,
      completedToday: completedToday.length,
      percentage: habits.length > 0 ? Math.round((completedToday.length / habits.length) * 100) : 0,
      topHabit: completedToday[0] ? completedToday[0].name : 'None',
    };
  },

  // 8. Cloud Backup (placeholder implementation)
  backupToCloud: async function() {
    const habits = await storage.getHabits();
    const backupData = {
      timestamp: new Date().toISOString(),
      habits: habits,
      version: '1.0',
    };
    
    console.log('Cloud backup data:', backupData);
    return backupData;
  },

  // Helper functions
  getWeeklyProgress: function(habits) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    return habits.map(function(habit) {
      return {
        name: habit.name,
        completions: habit.completions.filter(function(date) {
          return new Date(date) >= weekStart;
        }).length,
      };
    });
  },

  getMonthlyProgress: function(habits) {
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);
    
    return habits.map(function(habit) {
      return {
        name: habit.name,
        completions: habit.completions.filter(function(date) {
          return new Date(date) >= monthStart;
        }).length,
      };
    });
  },

  getBestPerformingHabits: function(habits) {
    const self = this;
    return habits
      .map(function(habit) {
        return {
          name: habit.name,
          streak: self.calculateStreak(habit),
          totalCompletions: habit.completions.length,
        };
      })
      .sort(function(a, b) { return b.streak - a.streak; })
      .slice(0, 5);
  },

  getCategoryBreakdown: function(habits) {
    const categories = {};
    
    habits.forEach(function(habit) {
      const category = habit.category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  },

  getCompletionTrends: function(habits) {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completed = habits.filter(function(h) {
        return h.completions.includes(dateStr);
      }).length;
      last30Days.push({ date: dateStr, completed: completed });
    }
    
    return last30Days;
  },

  calculateStreak: function(habit) {
    const sortedDates = habit.completions
      .map(function(date) { return new Date(date); })
      .sort(function(a, b) { return b.getTime() - a.getTime(); });
    
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
  },
};

export default PremiumFeatures;
