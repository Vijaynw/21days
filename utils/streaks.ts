import { Habit, HabitStats } from '@/types/habit';

export function calculateStreaks(habit: Habit): HabitStats {
  const completions = habit.completions
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime()); // Sort descending

  if (completions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  for (let i = 0; i < completions.length; i++) {
    const completionDate = new Date(completions[i]);
    completionDate.setHours(0, 0, 0, 0);
    
    if (isSameDay(completionDate, checkDate)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (completionDate < checkDate) {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < completions.length - 1; i++) {
    const current = new Date(completions[i]);
    const next = new Date(completions[i + 1]);
    current.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate completion rate (last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCompletions = completions.filter(d => {
    const date = new Date(d);
    return date >= thirtyDaysAgo && date <= today;
  });
  
  const completionRate = (recentCompletions.length / 30) * 100;

  return {
    currentStreak,
    longestStreak,
    totalCompletions: completions.length,
    completionRate: Math.round(completionRate),
  };
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function formatDate(date: Date): string {
  // Use local date to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isCompletedToday(habit: Habit): boolean {
  const today = formatDate(new Date());
  return habit.completions.includes(today);
}
