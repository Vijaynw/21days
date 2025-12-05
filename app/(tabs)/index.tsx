import { usePremium } from '@/contexts/PremiumContext';
import { Habit, HabitCategory } from '@/types/habit';
import { FREE_TIER_LIMITS } from '@/types/premium';
import { storage } from '@/utils/storage';
import { calculateStreaks, formatDate } from '@/utils/streaks';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const HABIT_CATEGORIES = [
  { id: 'health', name: 'health', icon: '💪' },
  { id: 'mindfulness', name: 'mindfulness', icon: '🧘' },
  { id: 'learning', name: 'learning', icon: '📚' },
  { id: 'productivity', name: 'productivity', icon: '⚡' },
  { id: 'social', name: 'social', icon: '👥' },
  { id: 'creative', name: 'creative', icon: '🎨' },
];

const HABIT_TEMPLATES = [
  { name: 'sleep 8hrs', category: 'health' as HabitCategory, icon: '😴' },
  { name: 'exercise', category: 'health' as HabitCategory, icon: '🏃' },
  { name: 'drink water', category: 'health' as HabitCategory, icon: '💧' },
  { name: 'take vitamins', category: 'health' as HabitCategory, icon: '💊' },
  { name: 'stretch', category: 'health' as HabitCategory, icon: '🤸' },
  { name: 'no junk food', category: 'health' as HabitCategory, icon: '🥗' },
  { name: 'walk 10k steps', category: 'health' as HabitCategory, icon: '👟' },
  { name: 'meditate', category: 'mindfulness' as HabitCategory, icon: '🧘' },
  { name: 'journal', category: 'mindfulness' as HabitCategory, icon: '📝' },
  { name: 'gratitude', category: 'mindfulness' as HabitCategory, icon: '🙏' },
  { name: 'deep breathing', category: 'mindfulness' as HabitCategory, icon: '🌬️' },
  { name: 'no phone before bed', category: 'mindfulness' as HabitCategory, icon: '📵' },
  { name: 'read 30 mins', category: 'learning' as HabitCategory, icon: '📖' },
  { name: 'learn language', category: 'learning' as HabitCategory, icon: '🗣️' },
  { name: 'practice coding', category: 'learning' as HabitCategory, icon: '💻' },
  { name: 'watch tutorial', category: 'learning' as HabitCategory, icon: '🎓' },
  { name: 'take notes', category: 'learning' as HabitCategory, icon: '✏️' },
  { name: 'wake up early', category: 'productivity' as HabitCategory, icon: '⏰' },
  { name: 'plan tomorrow', category: 'productivity' as HabitCategory, icon: '📋' },
  { name: 'inbox zero', category: 'productivity' as HabitCategory, icon: '📧' },
  { name: 'no social media', category: 'productivity' as HabitCategory, icon: '🚫' },
  { name: 'focus time', category: 'productivity' as HabitCategory, icon: '🎯' },
  { name: 'call family', category: 'social' as HabitCategory, icon: '📞' },
  { name: 'meet a friend', category: 'social' as HabitCategory, icon: '🤝' },
  { name: 'compliment someone', category: 'social' as HabitCategory, icon: '💬' },
  { name: 'draw/sketch', category: 'creative' as HabitCategory, icon: '✏️' },
  { name: 'play music', category: 'creative' as HabitCategory, icon: '🎸' },
  { name: 'write', category: 'creative' as HabitCategory, icon: '✍️' },
  { name: 'photography', category: 'creative' as HabitCategory, icon: '📷' },
];

// Feature 2: Scrollable past dates timeline
const getTimelineDates = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  const range = 14;
  for (let i = -range; i <= 0; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { canAddMoreHabits } = usePremium();
  const router = useRouter();
  const timelineDates = getTimelineDates();
  const currentMonth = MONTHS_SHORT[new Date().getMonth()];

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
  };

  const handleAddHabitPress = () => {
    if (!canAddMoreHabits(habits.length)) {
      Alert.alert(
        'Habit Limit Reached',
        `Free users can track up to ${FREE_TIER_LIMITS.maxHabits} habits. Upgrade to Premium!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Go Premium', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    setIsAdding(true);
  };

  const addHabit = async (name?: string) => {
    const habitName = name || newHabitName.trim();
    if (!habitName) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: habitName.toLowerCase(),
      color: '#1a1a1a',
      createdAt: new Date().toISOString(),
      completions: [],
    };

    await storage.addHabit(newHabit);
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setIsAdding(false);
  };

  const toggleCompletion = async (habit: Habit, date: Date) => {
    const dateStr = formatDate(date);
    const isCompleted = habit.completions.includes(dateStr);

    const updatedHabit = {
      ...habit,
      completions: isCompleted
        ? habit.completions.filter(d => d !== dateStr)
        : [...habit.completions, dateStr],
    };

    await storage.updateHabit(updatedHabit);
    setHabits(habits.map(h => (h.id === habit.id ? updatedHabit : h)));
  };

  const isDateCompleted = (habit: Habit, date: Date) => {
    return habit.completions.includes(formatDate(date));
  };

  
  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  // Feature 3: Streak badge
  const getCurrentStreak = (habit: Habit) => calculateStreaks(habit).currentStreak;

  // Feature 4: Weekly progress widget
  const getWeekProgress = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    let totalPossible = habits.length * 7;
    let totalScore = 0;
    habits.forEach(habit => {
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekAgo);
        date.setDate(weekAgo.getDate() + i);
        const dateStr = formatDate(date);
        if (habit.completions.includes(dateStr)) totalScore += 1;
      }
    });
    return totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
  };

  // Feature 5: Fade past days
  const getDaysAgo = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  };

  const deleteHabit = (habitId: string) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storage.deleteHabit(habitId);
            setHabits(habits.filter(h => h.id !== habitId));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity onPress={handleAddHabitPress} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.habitsList} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>track</Text>
            <Text style={styles.emptySubtitle}>your habit.</Text>
          </View>
        ) : (
          <>
            {/* Feature 4: Weekly Summary Widget */}
            <View style={styles.widget}>
              <View style={styles.widgetRow}>
                <View style={styles.widgetSection}>
                  <Text style={styles.widgetTitle}>today</Text>
                  <Text style={styles.widgetNumber}>
                    {habits.filter(h => h.completions.includes(formatDate(new Date()))).length}/{habits.length}
                  </Text>
                </View>
                <View style={styles.widgetDivider} />
                <View style={styles.widgetSection}>
                  <Text style={styles.widgetTitle}>this week</Text>
                  <Text style={styles.widgetNumber}>{getWeekProgress()}%</Text>
                </View>
              </View>
            </View>

            {habits.map(habit => {
              const streak = getCurrentStreak(habit);
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={styles.habitCard}
                  onPress={() => router.push({ pathname: '/habit/[id]' as any, params: { id: habit.id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.habitHeader}>
                    <View style={styles.habitNameRow}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      {/* Feature 3: Streak Badge */}
                      {streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakIcon}>🔥</Text>
                          <Text style={styles.streakText}>{streak}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteHabit(habit.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.monthLabel}>{currentMonth}</Text>

                  {/* Feature 2: Scrollable Date Timeline */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.weekRow}
                    contentContainerStyle={styles.weekRowContent}
                  >
                    {timelineDates.map((date) => {
                      const completed = isDateCompleted(habit, date);
                      const today = isToday(date);
                      const dayIndex = (date.getDay() + 6) % 7;
                      const daysAgo = getDaysAgo(date);
                      // Feature 5: Fade past days
                      const fadeOpacity = today ? 1 : Math.max(0.4, 1 - daysAgo * 0.04);

                      return (
                        <TouchableOpacity
                          key={formatDate(date)}
                          style={[styles.dayColumn, { opacity: fadeOpacity }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (today) {
                              toggleCompletion(habit, date);
                            } else {
                              router.push({ pathname: '/habit/[id]' as any, params: { id: habit.id } });
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.dayDot,
                              completed && styles.dayDotCompleted,
                              today && !completed && styles.dayDotToday,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayNumber,
                                completed && styles.dayNumberCompleted,
                              ]}
                            >
                              {date.getDate()}
                            </Text>
                          </View>
                          <Text style={styles.dayLabel}>{DAYS_SHORT[dayIndex]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={isAdding} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>new habit</Text>
            
            <TextInput
              style={styles.input}
              placeholder="habit name"
              placeholderTextColor="#999"
              value={newHabitName}
              onChangeText={setNewHabitName}
              autoFocus
            />
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              <TouchableOpacity
                style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>all</Text>
              </TouchableOpacity>
              {HABIT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.suggestionsTitle}>suggestions</Text>
            <ScrollView style={styles.suggestionsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.suggestions}>
                {HABIT_TEMPLATES
                  .filter(t => !selectedCategory || t.category === selectedCategory)
                  .map((template, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => addHabit(template.name)}
                    >
                      <Text style={styles.suggestionIcon}>{template.icon}</Text>
                      <Text style={styles.suggestionText}>{template.name}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsAdding(false)}
              >
                <Text style={styles.cancelButtonText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !newHabitName.trim() && styles.createButtonDisabled]}
                onPress={() => addHabit()}
                disabled={!newHabitName.trim()}
              >
                <Text style={styles.createButtonText}>create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerSpacer: {
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1a1a1a',
  },
  habitsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 200,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  // Feature 4: Widget styles
  widget: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetSection: {
    flex: 1,
    alignItems: 'center',
  },
  widgetDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  widgetTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  widgetNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  habitCard: {
    marginBottom: 32,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  habitName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  // Feature 3: Streak badge styles
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9800',
  },
  deleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
  },
  monthLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    marginLeft: 4,
  },
  // Feature 2: Scrollable timeline styles
  weekRow: {
    flexDirection: 'row',
  },
  weekRowContent: {
    paddingRight: 24,
    gap: 12,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayDotCompleted: {
    backgroundColor: '#1a1a1a',
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
    backgroundColor: '#fff',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  dayNumberCompleted: {
    color: '#fff',
  },
  dayLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    fontSize: 18,
    paddingVertical: 12,
    marginBottom: 16,
    color: '#1a1a1a',
  },
  categoryScroll: {
    marginHorizontal: -24,
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: '#1a1a1a',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  categoryIcon: {
    fontSize: 14,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  suggestionsScroll: {
    maxHeight: 200,
    marginBottom: 16,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  suggestionIcon: {
    fontSize: 14,
  },
  suggestionText: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});
