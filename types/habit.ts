export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  completions: string[]; // Array of ISO date strings (YYYY-MM-DD)
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // percentage
}
