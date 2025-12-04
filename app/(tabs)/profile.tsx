import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit } from '@/types/habit';
import { storage } from '@/utils/storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const colorScheme = useColorScheme();

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
    const total = loadedHabits.reduce((sum, h) => sum + h.completions.length, 0);
    setTotalCompletions(total);
  };

  const getLongestStreak = () => {
    let longest = 0;
    habits.forEach(habit => {
      if (habit.completions.length === 0) return;
      const sorted = [...habit.completions].sort();
      let currentStreak = 1;
      let maxStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      longest = Math.max(longest, maxStreak);
    });
    return longest;
  };

  const statCards = [
    { icon: 'checkmark.circle.fill', label: 'Total Habits', value: habits.length, color: '#4ECDC4' },
    { icon: 'star.fill', label: 'Completions', value: totalCompletions, color: '#F7DC6F' },
    { icon: 'flame.fill', label: 'Best Streak', value: `${getLongestStreak()} days`, color: '#FF6B6B' },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Profile</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
            <IconSymbol name="person.2.fill" size={48} color="#fff" />
          </View>
          <ThemedText type="subtitle" style={styles.greeting}>
            Keep building great habits!
          </ThemedText>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
              <IconSymbol name={stat.icon as any} size={24} color={stat.color} />
              <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
              <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
            </View>
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Settings</ThemedText>
          
          <TouchableOpacity style={styles.settingItem}>
            <IconSymbol name="calendar" size={24} color={Colors[colorScheme ?? 'light'].icon} />
            <ThemedText style={styles.settingText}>Reminder Time</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <IconSymbol name="star.fill" size={24} color={Colors[colorScheme ?? 'light'].icon} />
            <ThemedText style={styles.settingText}>App Theme</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>About</ThemedText>
          <ThemedText style={styles.aboutText}>
            21Days helps you build lasting habits through consistent daily tracking. 
            It takes 21 days to form a habit - start your journey today!
          </ThemedText>
          <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    textAlign: 'center',
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  version: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 12,
    textAlign: 'center',
  },
});
