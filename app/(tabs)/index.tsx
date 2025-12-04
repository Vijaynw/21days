import { usePremium } from '@/contexts/PremiumContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit, HabitCategory } from '@/types/habit';
import { FREE_TIER_LIMITS } from '@/types/premium';
import { storage } from '@/utils/storage';
import { formatDate } from '@/utils/streaks';
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

const HABIT_TEMPLATES = [
  { name: 'sleep 8hrs', category: 'health' as HabitCategory },
  { name: 'meditate', category: 'mindfulness' as HabitCategory },
  { name: 'exercise', category: 'health' as HabitCategory },
  { name: 'read', category: 'learning' as HabitCategory },
  { name: 'drink water', category: 'health' as HabitCategory },
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
  const colorScheme = useColorScheme();
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
              <Text style={styles.habitName}>{habit.name}</Text>
              
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
            
            <Text style={styles.suggestionsTitle}>suggestions</Text>
            <View style={styles.suggestions}>
              {HABIT_TEMPLATES.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => addHabit(template.name)}
                >
                  <Text style={styles.suggestionText}>{template.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
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
  habitCard: {
    marginBottom: 32,
  },
  habitName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
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
    marginBottom: 24,
    color: '#1a1a1a',
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  suggestionChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 14,
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
