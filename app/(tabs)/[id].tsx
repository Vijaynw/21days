import { Habit } from '@/types/habit';
import { storage } from '@/utils/storage';
import { calculateStreaks, formatDate } from '@/utils/streaks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const loadHabit = useCallback(async () => {
    const habits = await storage.getHabits();
    const found = habits.find(h => h.id === id);
    if (found) {
      setHabit(found);
      setEditedName(found.name);
    }
  });

  useEffect(() => {
    loadHabit();
  }, [loadHabit]);

  const handleSaveName = async () => {
    if (!habit) return;
    const trimmed = editedName.trim();

    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a valid habit name.');
      return;
    }

    const updatedHabit = { ...habit, name: trimmed };
    await storage.updateHabit(updatedHabit);
    setHabit(updatedHabit);
    setIsEditingName(false);
  };

  const toggleEditing = () => {
    if (isEditingName) {
      handleSaveName();
    } else {
      setEditedName(habit?.name ?? '');
      setIsEditingName(true);
    }
  };

  if (!habit) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const stats = calculateStreaks(habit);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const isDateCompleted = (day: number) => {
    const dateStr = formatDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
    return habit.completions.includes(dateStr);
  };

  
  const changeMonth = (direction: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarDate(newDate);
  };

  const calendarDays = getDaysInMonth(calendarDate);

  const getMonthCompletions = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    let full = 0;
    
    habit.completions.forEach(dateStr => {
      const date = new Date(dateStr);
      if (date.getFullYear() === year && date.getMonth() === month) full++;
    });
    
    return { full };
  };

  const monthStats = getMonthCompletions();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          {isEditingName ? (
            <TextInput
              style={styles.titleInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Habit name"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
          ) : (
            <Text style={styles.headerTitle}>{habit.name}</Text>
          )}
        </View>
        <TouchableOpacity onPress={toggleEditing} style={styles.editButton}>
          <Text style={styles.editButtonText}>{isEditingName ? 'save' : 'edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>current streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>best streak</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCompletions}</Text>
            <Text style={styles.statLabel}>total days</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>30-day rate</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dayHeaders}>
            {DAYS.map((day, index) => (
              <View key={index} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => (
              <View key={index} style={styles.dayCell}>
                {day !== null && (
                  <View
                    style={[
                      styles.dayCircle,
                      isDateCompleted(day) && styles.dayCircleCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isDateCompleted(day) && styles.dayTextCompleted,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.monthSummary}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryDot, styles.summaryDotFull]} />
              <Text style={styles.summaryText}>{monthStats.full} completed</Text>
            </View>
          </View>
        </View>

        {/* Habit Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>created</Text>
          <Text style={styles.infoValue}>
            {new Date(habit.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#1a1a1a',
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  headerTitleWrapper: {
    flex: 1,
    paddingHorizontal: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  calendarCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: '300',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
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
    fontWeight: '500',
    color: '#999',
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
    backgroundColor: '#fff',
  },
  dayCircleCompleted: {
    backgroundColor: '#1a1a1a',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
  },
  dayTextCompleted: {
    color: '#fff',
    fontWeight: '600',
  },
  monthSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  summaryDotFull: {
    backgroundColor: '#1a1a1a',
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
});
