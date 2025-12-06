import { Habit } from '@/types/habit';
import { storage } from '@/utils/storage';
import { calculateStreaks, formatDate } from '@/utils/streaks';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';


const MOTIVATIONAL_QUOTES = [
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
];

export default function ProgressScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyQuote, setDailyQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  const loadData = useCallback(async () => {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
    // Select quote based on day
    const dayIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
    setDailyQuote(MOTIVATIONAL_QUOTES[dayIndex]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Calculate stats
  const getTotalCompletions = () => {
    return habits.reduce((sum, h) => sum + h.completions.length, 0);
  };

  const getTodayCompletions = () => {
    const today = formatDate(new Date());
    return habits.filter(h => h.completions.includes(today)).length;
  };

  const getWeeklyCompletions = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let count = 0;
    habits.forEach(habit => {
      habit.completions.forEach(date => {
        if (new Date(date) >= weekAgo) count++;
      });
    });
    return count;
  };

  const getBestStreak = () => {
    let best = 0;
    habits.forEach(habit => {
      const streaks = calculateStreaks(habit);
      best = Math.max(best, streaks.longestStreak);
    });
    return best;
  };

  const getCurrentStreak = () => {
    let maxCurrent = 0;
    habits.forEach(habit => {
      const streaks = calculateStreaks(habit);
      maxCurrent = Math.max(maxCurrent, streaks.currentStreak);
    });
    return maxCurrent;
  };

  const getCompletionRate = () => {
    if (habits.length === 0) return 0;
    const today = formatDate(new Date());
    const completed = habits.filter(h => h.completions.includes(today)).length;
    return Math.round((completed / habits.length) * 100);
  };

  // Get last 7 days completion data for chart
  const getWeekData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const completed = habits.filter(h => h.completions.includes(dateStr)).length;
      data.push({
        day: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()],
        value: habits.length > 0 ? (completed / habits.length) * 100 : 0,
        completed,
      });
    }
    return data;
  };

  const weekData = getWeekData();
  const maxBarHeight = 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>progress</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quote Card */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>&ldquo;{dailyQuote.text}&rdquo;</Text>
          <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
        </View>

        {/* Today's Progress */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>today</Text>
          <View style={styles.todayStats}>
            <Text style={styles.todayValue}>{getTodayCompletions()}/{habits.length}</Text>
            <Text style={styles.todayPercent}>{getCompletionRate()}%</Text>
          </View>
        </View>

        {/* Week Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>this week</Text>
          <View style={styles.chartContainer}>
            {weekData.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max((item.value / 100) * maxBarHeight, 4),
                        backgroundColor: item.value > 0 ? '#1a1a1a' : '#e0e0e0',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartSubtitle}>{getWeeklyCompletions()} completions</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getCurrentStreak()}</Text>
            <Text style={styles.statLabel}>current streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getBestStreak()}</Text>
            <Text style={styles.statLabel}>best streak</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getTotalCompletions()}</Text>
            <Text style={styles.statLabel}>total completions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{habits.length}</Text>
            <Text style={styles.statLabel}>active habits</Text>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  quoteCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 13,
    color: '#999',
  },
  todayCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayLabel: {
    fontSize: 16,
    color: '#999',
  },
  todayStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  todayValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  todayPercent: {
    fontSize: 16,
    color: '#999',
  },
  chartCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: 100,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    borderRadius: 12,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  statsGrid: {
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
});
