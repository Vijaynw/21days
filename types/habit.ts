export type HabitCategory = 
  | 'health'
  | 'productivity'
  | 'learning'
  | 'mindfulness'
  | 'social'
  | 'creative'
  | 'custom';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category?: HabitCategory;
  color: string;
  createdAt: string;
  completions: string[]; // Array of ISO date strings (YYYY-MM-DD)
  reminderTime?: string; // HH:MM format
  notes?: { [date: string]: string }; // Notes per date
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // percentage
}
