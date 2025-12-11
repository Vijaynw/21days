/**
 * Profile Screen (JavaScript)
 */

import LottieAnimation from '@/components/lottie-animation';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/utils/storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BUYMEACOFFEE_URL = 'https://buymeacoffee.com/mrstardust';

export default function ProfileScreen() {
  const [habits, setHabits] = useState([]);
  const { user, signOut, deleteUser } = useAuth();
  console.log("user",user)

  const handleSignOut = function() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async function() {
            await signOut();
          },
        },
      ]
    );
  };

  const handleDeleteUser = function() {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async function() {
            const { error } = await deleteUser();
            if (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } else {
              Alert.alert('Success', 'Your account has been deleted successfully.');
            }
          },
        },
      ]
    );
  };
  const [totalCompletions, setTotalCompletions] = useState(0);
  const router = useRouter();

  useFocusEffect(
    useCallback(function() {
      loadStats();
    }, [])
  );

  const loadStats = async function() {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
    const total = loadedHabits.reduce(function(sum, h) {
      return sum + h.completions.length;
    }, 0);
    setTotalCompletions(total);
  };

  const getLongestStreak = function() {
    let longest = 0;
    habits.forEach(function(habit) {
      if (habit.completions.length === 0) return;
      const sorted = habit.completions.slice().sort();
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

  const getCurrentStreak = function() {
    let maxCurrentStreak = 0;
    habits.forEach(function(habit) {
      if (habit.completions.length === 0) return;
      const sorted = habit.completions.slice().sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (sorted[0] !== today && sorted[0] !== yesterday) return;
      
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffDays = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
      maxCurrentStreak = Math.max(maxCurrentStreak, streak);
    });
    return maxCurrentStreak;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              <LottieAnimation
                source={require('@/assets/animations/Data Profile.json')}
                style={styles.avatarAnimation}
              />
            </Text>
          </View>
          <Text style={styles.greeting}>keep building</Text>
          <Text style={styles.greetingBold}>great habits. {user?.name}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{habits.length}</Text>
            <Text style={styles.statLabel}>habits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCompletions}</Text>
            <Text style={styles.statLabel}>completions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getCurrentStreak()}</Text>
            <Text style={styles.statLabel}>current streak</Text>
          </View>
        </View>

        {/* Best Streak */}
        <View style={styles.bestStreakCard}>
          <Text style={styles.bestStreakLabel}>best streak</Text>
          <Text style={styles.bestStreakValue}>{getLongestStreak()} days</Text>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>settings</Text> */}

          {/* <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingText}>reminders</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity> */}

          {/* <TouchableOpacity 
            style={styles.settingItem}
            onPress={function() { router.push('/premium'); }}
          >
            <Text style={styles.settingIcon}>👑</Text>
            <Text style={styles.settingText}>premium</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity> */}
           <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>support mrstardust</Text> */}
          <TouchableOpacity 
            style={styles.coffeeCard}
            onPress={function() { Linking.openURL(BUYMEACOFFEE_URL); }}
            activeOpacity={0.8}
          >
            <Text style={styles.coffeeEmoji}>☕</Text>
            <View style={styles.coffeeTextContainer}>
              <Text style={styles.coffeeTitle}>Buy Me a Cup of Motivation</Text>
              <Text style={styles.coffeeSubtext}>A little support goes a long way</Text>
            </View>
            <Text style={styles.coffeeArrow}>›</Text>
          </TouchableOpacity>
        </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={function() { router.push('./settings'); }}
          >
            <Text style={styles.settingIcon}>⚙️</Text>
            <Text style={styles.settingText}>settings</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleSignOut}
          >
            <Text style={styles.settingIcon}>🚀</Text>
            <Text style={[styles.settingText, { color: '#ff4444' }]}>sign out</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleDeleteUser}
          >
            <Text style={styles.settingIcon}>🗑️</Text>
            <Text style={[styles.settingText, { color: '#ff4444' }]}>delete account</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            21days helps you build lasting habits through consistent daily tracking.
          </Text>
          <Text style={styles.version}>version 1.0.0</Text>
        </View>

        {/* Support Section */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>support {BUYMEACOFFEE_URL}</Text>
          <TouchableOpacity 
            style={styles.coffeeCard}
            onPress={function() { Linking.openURL(BUYMEACOFFEE_URL); }}
            activeOpacity={0.8}
          >
            <Text style={styles.coffeeEmoji}>☕</Text>
            <View style={styles.coffeeTextContainer}>
              <Text style={styles.coffeeTitle}>Buy Me a Coffee</Text>
              <Text style={styles.coffeeSubtext}>Support the development of 21days</Text>
            </View>
            <Text style={styles.coffeeArrow}>›</Text>
          </TouchableOpacity>
        </View> */}

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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '300',
    color: '#1a1a1a',
  },
  greetingBold: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  bestStreakCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  bestStreakLabel: {
    fontSize: 16,
    color: '#999',
  },
  bestStreakValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },
  version: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 12,
    textAlign: "center",
  },
  coffeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDD00',
    borderRadius: 16,
    padding: 16,
  },
  coffeeEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  coffeeTextContainer: {
    flex: 1,
  },
  coffeeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  coffeeSubtext: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  coffeeArrow: {
    fontSize: 20,
    color: '#333',
  },
});
