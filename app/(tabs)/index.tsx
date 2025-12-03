import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit } from '@/types/habit';
import { storage } from '@/utils/storage';
import { calculateStreaks, formatDate, isCompletedToday } from '@/utils/streaks';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HABIT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    console.log("Date.now().toString()", Date.now().toString());
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
      completions: [],
    };

    await storage.addHabit(newHabit);
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setIsAdding(false);
    setSelectedColor(HABIT_COLORS[0]);
  };

  const toggleCompletion = async (habit: Habit) => {
    const today = formatDate(new Date());
    const isCompleted = habit.completions.includes(today);

    const updatedHabit = {
      ...habit,
      completions: isCompleted
        ? habit.completions.filter(d => d !== today)
        : [...habit.completions, today],
    };

    await storage.updateHabit(updatedHabit);
    setHabits(habits.map(h => (h.id === habit.id ? updatedHabit : h)));
  };

  const deleteHabit = (habitId: string) => {
    Alert.alert('Delete Habit', 'Are you sure you want to delete this habit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storage.deleteHabit(habitId);
          setHabits(habits.filter(h => h.id !== habitId));
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          My Habits
        </ThemedText>
        <TouchableOpacity
          onPress={() => setIsAdding(!isAdding)}
          style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <IconSymbol name={isAdding ? 'xmark' : 'plus'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={[styles.addForm, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
                color: Colors[colorScheme ?? 'light'].text,
                borderColor: Colors[colorScheme ?? 'light'].tint,
              },
            ]}
            placeholder="Habit name"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={newHabitName}
            onChangeText={setNewHabitName}
            autoFocus
          />
          <View style={styles.colorPicker}>
            {HABIT_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={addHabit}
            style={[styles.saveButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
            <Text style={styles.saveButtonText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.habitsList}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="star" size={64} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyText}>No habits yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Tap + to create your first habit</ThemedText>
          </View>
        ) : (
          habits.map(habit => {
            const stats = calculateStreaks(habit);
            const completed = isCompletedToday(habit);

            return (
              <View key={habit.id} style={[styles.habitCard, { borderLeftColor: habit.color }]}>
                <TouchableOpacity
                  style={styles.habitContent}
                  onPress={() => toggleCompletion(habit)}>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: habit.color },
                      completed && { backgroundColor: habit.color },
                    ]}>
                    {completed && <IconSymbol name="checkmark" size={20} color="#fff" />}
                  </View>
                  <View style={styles.habitInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.habitName}>
                      {habit.name}
                    </ThemedText>
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <IconSymbol name="flame.fill" size={16} color={habit.color} />
                        <ThemedText style={styles.statText}>{stats.currentStreak} days</ThemedText>
                      </View>
                      <View style={styles.stat}>
                        <IconSymbol name="trophy.fill" size={16} color={habit.color} />
                        <ThemedText style={styles.statText}>Best: {stats.longestStreak}</ThemedText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteHabit(habit.id)}
                  style={styles.deleteButton}>
                  <IconSymbol name="trash" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  input: {
    height: 48,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  habitsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.6,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  habitContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    opacity: 0.7,
  },
  deleteButton: {
    padding: 8,
  },
});
