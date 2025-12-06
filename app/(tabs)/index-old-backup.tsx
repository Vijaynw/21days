import { usePremium } from '@/contexts/PremiumContext';
import { Habit, HabitCategory } from '@/types/habit';
import { FREE_TIER_LIMITS } from '@/types/premium';
import { storage } from '@/utils/storage';
import { formatDate } from '@/utils/streaks';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
  // Health
  { name: 'sleep 8hrs', category: 'health' as HabitCategory, icon: '😴' },
  { name: 'exercise', category: 'health' as HabitCategory, icon: '🏃' },
  { name: 'drink water', category: 'health' as HabitCategory, icon: '💧' },
  { name: 'take vitamins', category: 'health' as HabitCategory, icon: '💊' },
  { name: 'stretch', category: 'health' as HabitCategory, icon: '🤸' },
  { name: 'no junk food', category: 'health' as HabitCategory, icon: '🥗' },
  { name: 'walk 10k steps', category: 'health' as HabitCategory, icon: '👟' },
  
  // Mindfulness
  { name: 'meditate', category: 'mindfulness' as HabitCategory, icon: '🧘' },
  { name: 'journal', category: 'mindfulness' as HabitCategory, icon: '📝' },
  { name: 'gratitude', category: 'mindfulness' as HabitCategory, icon: '🙏' },
  { name: 'deep breathing', category: 'mindfulness' as HabitCategory, icon: '🌬️' },
  { name: 'no phone before bed', category: 'mindfulness' as HabitCategory, icon: '📵' },
  
  // Learning
  { name: 'read 30 mins', category: 'learning' as HabitCategory, icon: '📖' },
  { name: 'learn language', category: 'learning' as HabitCategory, icon: '🗣️' },
  { name: 'practice coding', category: 'learning' as HabitCategory, icon: '💻' },
  { name: 'watch tutorial', category: 'learning' as HabitCategory, icon: '🎓' },
  { name: 'take notes', category: 'learning' as HabitCategory, icon: '✏️' },
  
  // Productivity
  { name: 'wake up early', category: 'productivity' as HabitCategory, icon: '⏰' },
  { name: 'plan tomorrow', category: 'productivity' as HabitCategory, icon: '📋' },
  { name: 'inbox zero', category: 'productivity' as HabitCategory, icon: '📧' },
  { name: 'no social media', category: 'productivity' as HabitCategory, icon: '🚫' },
  { name: 'focus time', category: 'productivity' as HabitCategory, icon: '🎯' },
  
  // Social
  { name: 'call family', category: 'social' as HabitCategory, icon: '📞' },
  { name: 'meet a friend', category: 'social' as HabitCategory, icon: '🤝' },
  { name: 'compliment someone', category: 'social' as HabitCategory, icon: '💬' },
  
  // Creative
  { name: 'draw/sketch', category: 'creative' as HabitCategory, icon: '✏️' },
  { name: 'play music', category: 'creative' as HabitCategory, icon: '🎸' },
  { name: 'write', category: 'creative' as HabitCategory, icon: '✍️' },
  { name: 'photography', category: 'creative' as HabitCategory, icon: '📷' },
];

// Get week dates starting from Monday
const getWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
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
  const weekDates = getWeekDates();
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
      {/* Header with + button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity onPress={handleAddHabitPress} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Habits List */}
      <ScrollView style={styles.habitsList} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>track</Text>
            <Text style={styles.emptySubtitle}>your habit.</Text>
          </View>
        ) : (
          habits.map(habit => (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitHeader}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <TouchableOpacity
                  onPress={() => deleteHabit(habit.id)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {/* Month label */}
              <Text style={styles.monthLabel}>{currentMonth}</Text>
              
              {/* Week Calendar */}
              <View style={styles.weekRow}>
                {weekDates.map((date, index) => {
                  const completed = isDateCompleted(habit, date);
                  const today = isToday(date);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.dayColumn}
                      onPress={() => toggleCompletion(habit, date)}
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
                      <Text style={styles.dayLabel}>{DAYS_SHORT[index]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Habit Modal */}
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
            
            {/* Category Filter */}
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
    paddingTop: 20,
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
  habitCard: {
    marginBottom: 32,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
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
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
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
  // Modal styles
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
