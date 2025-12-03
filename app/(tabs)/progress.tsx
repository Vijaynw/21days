import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit } from '@/types/habit';
import { storage } from '@/utils/storage';
import { calculateStreaks, formatDate } from '@/utils/streaks';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface HabitStats {
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  overallCompletionRate: number;
  currentStreaks: number[];
  longestStreaks: number[];
  todayCompletions: number;
  weeklyCompletions: number;
  monthlyCompletions: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  target?: number;
}

const MOTIVATIONAL_QUOTES = [
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
];

export default function ProgressScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [dailyQuote, setDailyQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const colorScheme = useColorScheme();

  const loadData = useCallback(async () => {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
    calculateStats(loadedHabits);
    checkAchievements(loadedHabits);
    selectDailyQuote();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateStats = (habitsList: Habit[]) => {
    const today = formatDate(new Date());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let totalCompletions = 0;
    let todayCompletions = 0;
    let weeklyCompletions = 0;
    let monthlyCompletions = 0;
    const currentStreaks: number[] = [];
    const longestStreaks: number[] = [];

    habitsList.forEach(habit => {
      const streaks = calculateStreaks(habit);
      currentStreaks.push(streaks.currentStreak);
      longestStreaks.push(streaks.longestStreak);
      
      totalCompletions += habit.completions.length;
      
      if (habit.completions.includes(today)) {
        todayCompletions++;
      }

      habit.completions.forEach(completion => {
        const completionDate = new Date(completion);
        if (completionDate >= weekAgo) weeklyCompletions++;
        if (completionDate >= monthAgo) monthlyCompletions++;
      });
    });

    const possibleCompletions = habitsList.length * 21; // Assuming 21 days target
    const overallCompletionRate = possibleCompletions > 0 
      ? Math.round((totalCompletions / possibleCompletions) * 100)
      : 0;

    setStats({
      totalHabits: habitsList.length,
      activeHabits: habitsList.filter(h => {
        const streaks = calculateStreaks(h);
        return streaks.currentStreak > 0;
      }).length,
      totalCompletions,
      overallCompletionRate,
      currentStreaks,
      longestStreaks,
      todayCompletions,
      weeklyCompletions,
      monthlyCompletions,
    });
  };

  const checkAchievements = (habitsList: Habit[]) => {
    const newAchievements: Achievement[] = [
      {
        id: 'first_habit',
        title: 'Getting Started',
        description: 'Create your first habit',
        icon: 'star.fill',
        unlocked: habitsList.length > 0,
        progress: habitsList.length,
        target: 1,
      },
      {
        id: 'week_warrior',
        title: '7-Day Warrior',
        description: 'Complete a 7-day streak',
        icon: 'flame.fill',
        unlocked: habitsList.some(h => calculateStreaks(h).currentStreak >= 7),
      },
      {
        id: 'habit_master',
        title: 'Habit Master',
        description: 'Complete a 21-day streak',
        icon: 'crown.fill',
        unlocked: habitsList.some(h => calculateStreaks(h).currentStreak >= 21),
      },
      {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Complete all habits for 7 days straight',
        icon: 'checkmark.seal.fill',
        unlocked: false, // TODO: Implement logic
      },
      {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Complete habits before 9 AM',
        icon: 'sunrise.fill',
        unlocked: false, // TODO: Implement with time tracking
      },
      {
        id: 'comeback_kid',
        title: 'Comeback Kid',
        description: 'Restart a habit after a break',
        icon: 'arrow.uturn.up',
        unlocked: false, // TODO: Implement logic
      },
    ];

    setAchievements(newAchievements);
  };

  const selectDailyQuote = async () => {
    const today = new Date().toDateString();
    const savedQuoteDate = await storage.getItem('quoteDate');
    
    if (savedQuoteDate !== today) {
      const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
      setDailyQuote(MOTIVATIONAL_QUOTES[randomIndex]);
      await storage.setItem('quoteDate', today);
      await storage.setItem('quoteIndex', randomIndex.toString());
    } else {
      const savedIndex = parseInt((await storage.getItem('quoteIndex')) || '0');
      setDailyQuote(MOTIVATIONAL_QUOTES[savedIndex]);
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return '#10B981';
    if (rate >= 60) return '#F59E0B';
    return '#EF4444';
  };

  if (!stats) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading progress...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Progress
          </ThemedText>
        </View>

        {/* Daily Quote */}
        <View style={[styles.quoteCard, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '15' }]}>
          <IconSymbol name="quote.bubble" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.quoteText}>{dailyQuote.text}</ThemedText>
          <ThemedText style={styles.quoteAuthor}>— {dailyQuote.author}</ThemedText>
        </View>

        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <IconSymbol name="checkmark.circle.fill" size={32} color="#10B981" />
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {stats.todayCompletions}/{stats.totalHabits}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Today</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <IconSymbol name="flame.fill" size={32} color="#F59E0B" />
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {Math.max(...stats.currentStreaks, 0)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Best Streak</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={32} color="#3B82F6" />
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {stats.overallCompletionRate}%
            </ThemedText>
            <ThemedText style={styles.statLabel}>Completion</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <IconSymbol name="star.fill" size={32} color="#8B5CF6" />
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {stats.activeHabits}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Active</ThemedText>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map(period => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              style={[
                styles.periodButton,
                selectedPeriod === period && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              ]}>
              <ThemedText
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && { color: '#fff' },
                ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Habit Performance */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Habit Performance
          </ThemedText>
          {habits.map(habit => {
            const streaks = calculateStreaks(habit);
            const completionRate = habit.completions.length > 0
              ? Math.round((habit.completions.length / 21) * 100)
              : 0;

            return (
              <View key={habit.id} style={styles.habitPerformance}>
                <View style={styles.habitPerformanceHeader}>
                  <View style={[styles.habitDot, { backgroundColor: habit.color }]} />
                  <ThemedText style={styles.habitPerformanceName}>{habit.name}</ThemedText>
                  <ThemedText style={[
                    styles.habitPerformanceRate,
                    { color: getCompletionColor(completionRate) }
                  ]}>
                    {completionRate}%
                  </ThemedText>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${completionRate}%`,
                        backgroundColor: habit.color,
                      },
                    ]}
                  />
                </View>
                <View style={styles.habitPerformanceStats}>
                  <ThemedText style={styles.habitPerformanceStat}>
                    Current: {streaks.currentStreak} days
                  </ThemedText>
                  <ThemedText style={styles.habitPerformanceStat}>
                    Best: {streaks.longestStreak} days
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Achievements
          </ThemedText>
          <View style={styles.achievementsGrid}>
            {achievements.map(achievement => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  {
                    backgroundColor: achievement.unlocked
                      ? Colors[colorScheme ?? 'light'].tint + '20'
                      : Colors[colorScheme ?? 'light'].background,
                    opacity: achievement.unlocked ? 1 : 0.5,
                  },
                ]}>
                <IconSymbol
                  name={achievement.icon as any}
                  size={32}
                  color={
                    achievement.unlocked
                      ? Colors[colorScheme ?? 'light'].tint
                      : Colors[colorScheme ?? 'light'].tabIconDefault
                  }
                />
                <ThemedText style={styles.achievementTitle}>
                  {achievement.title}
                </ThemedText>
                <ThemedText style={styles.achievementDescription}>
                  {achievement.description}
                </ThemedText>
                {achievement.unlocked && (
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={20}
                    color="#10B981"
                    style={styles.achievementCheck}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
  },
  quoteCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 8,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    width: (screenWidth - 48) / 2,
    margin: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  habitPerformance: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
  },
  habitPerformanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  habitPerformanceName: {
    flex: 1,
    fontSize: 16,
  },
  habitPerformanceRate: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  habitPerformanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitPerformanceStat: {
    fontSize: 12,
    opacity: 0.6,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  achievementCard: {
    width: (screenWidth - 48) / 3,
    margin: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
  },
  achievementCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
