import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit } from '@/types/habit';
import { storage } from '@/utils/storage';
import { formatDate } from '@/utils/streaks';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CalendarScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const loadHabits = useCallback(async () => {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
    if (loadedHabits.length > 0 && !selectedHabit) {
      setSelectedHabit(loadedHabits[0].id);
    }
  }, [selectedHabit]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isDateCompleted = (day: number) => {
    if (!selectedHabit) return false;
    const habit = habits.find(h => h.id === selectedHabit);
    if (!habit) return false;

    const dateStr = formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    return habit.completions.includes(dateStr);
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const selectedHabitData = habits.find(h => h.id === selectedHabit);
  const days = getDaysInMonth(currentDate);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Calendar
        </ThemedText>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol
            name="calendar"
            size={64}
            color={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
          <ThemedText style={styles.emptyText}>No habits to track</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Create a habit in the Habits tab first
          </ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Habit Selector */}
          <View style={styles.habitSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {habits.map(habit => (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => setSelectedHabit(habit.id)}
                  style={[
                    styles.habitChip,
                    {
                      backgroundColor:
                        selectedHabit === habit.id
                          ? habit.color
                          : Colors[colorScheme ?? 'light'].background,
                      borderColor: habit.color,
                    },
                  ]}>
                  <ThemedText
                    style={[
                      styles.habitChipText,
                      selectedHabit === habit.id && { color: '#fff' },
                    ]}>
                    {habit.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
              <IconSymbol name="chevron.left" size={24} color={selectedHabitData?.color || Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.monthText}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </ThemedText>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
              <IconSymbol name="chevron.right" size={24} color={selectedHabitData?.color || Colors[colorScheme ?? 'light'].tint} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendar}>
            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {DAYS.map(day => (
                <View key={day} style={styles.dayHeader}>
                  <ThemedText style={styles.dayHeaderText}>{day}</ThemedText>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.daysGrid}>
              {days.map((day, index) => (
                <View key={index} style={styles.dayCell}>
                  {day !== null && (
                    <View
                      style={[
                        styles.dayCircle,
                        isDateCompleted(day) && {
                          backgroundColor: selectedHabitData?.color,
                        },
                      ]}>
                      <ThemedText
                        style={[
                          styles.dayText,
                          isDateCompleted(day) && styles.dayTextCompleted,
                        ]}>
                        {day}
                      </ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: selectedHabitData?.color || '#ccc' },
                ]}
              />
              <ThemedText style={styles.legendText}>Completed</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotEmpty]} />
              <ThemedText style={styles.legendText}>Not completed</ThemedText>
            </View>
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
  },
  content: {
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
  habitSelector: {
    marginBottom: 24,
  },
  habitChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
  },
  habitChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
  },
  calendar: {
    marginBottom: 24,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayCircle: {
    flex: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  dayText: {
    fontSize: 14,
  },
  dayTextCompleted: {
    color: '#fff',
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendDotEmpty: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  legendText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
