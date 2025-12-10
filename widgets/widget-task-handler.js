/**
 * Widget Task Handler
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HabitWidgetLarge } from './HabitWidgetLarge';
import { HabitWidgetMedium } from './HabitWidgetMedium';
import { HabitWidgetSmall } from './HabitWidgetSmall';

const HABITS_KEY = '@habits';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function calculateStreak(completions) {
  if (!completions || completions.length === 0) return 0;
  
  const sortedDates = [...completions].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStr = getTodayStr();
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
  
  if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
    return 0;
  }
  
  let streak = 0;
  let checkDate = new Date(today);
  
  if (!sortedDates.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (sortedDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

function getWeekCompletionData(habits) {
  const weekData = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(weekStart);
    checkDate.setDate(weekStart.getDate() + i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const allCompleted = habits.length > 0 && habits.every(h => 
      h.completions && h.completions.includes(dateStr)
    );
    
    weekData.push(allCompleted);
  }
  
  return weekData;
}

async function loadHabits() {
  try {
    const data = await AsyncStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (_error) {
    return [];
  }
}

async function toggleHabit(habitId) {
  try {
    const habits = await loadHabits();
    const todayStr = getTodayStr();
    
    const habitIndex = habits.findIndex(h => h.id === habitId);
    if (habitIndex === -1) return;
    
    const habit = habits[habitIndex];
    const completions = habit.completions || [];
    
    if (completions.includes(todayStr)) {
      habit.completions = completions.filter(d => d !== todayStr);
    } else {
      habit.completions = [...completions, todayStr];
    }
    
    habits[habitIndex] = habit;
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (_error) {
    // Ignore
  }
}

const widgetNameToComponent = {
  HabitWidgetSmall,
  HabitWidgetMedium,
  HabitWidgetLarge,
};

export async function widgetTaskHandler(props) {
  const widgetInfo = props.widgetInfo;
  const Widget = widgetNameToComponent[widgetInfo.widgetName];
  
  if (!Widget) return null;
  
  if (props.clickAction === 'TOGGLE_HABIT' && props.clickActionData?.habitId) {
    await toggleHabit(props.clickActionData.habitId);
  }
  
  const habits = await loadHabits();
  const todayStr = getTodayStr();
  const completedToday = habits.filter(h => h.completions && h.completions.includes(todayStr)).length;
  
  const streaks = {};
  habits.forEach(habit => {
    streaks[habit.id] = calculateStreak(habit.completions);
  });
  
  const weekData = getWeekCompletionData(habits);
  
  return (
    <Widget
      habits={habits}
      todayStr={todayStr}
      completedToday={completedToday}
      totalHabits={habits.length}
      weekData={weekData}
      streaks={streaks}
    />
  );
}

export default widgetTaskHandler;
