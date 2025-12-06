import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { usePremium } from '@/contexts/PremiumContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit, HabitCategory } from '@/types/habit';
import { FREE_TIER_LIMITS } from '@/types/premium';
import { storage } from '@/utils/storage';
import { calculateStreaks, formatDate, isCompletedToday } from '@/utils/streaks';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.35;
const CARD_SPACING = 12;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const HABIT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

const HABIT_CATEGORIES: { value: HabitCategory; label: string; icon: string; color: string; gradient: string }[] = [
  { value: 'health', label: 'Health', icon: 'heart.fill', color: '#FF6B6B', gradient: '#FF8E8E' },
  { value: 'productivity', label: 'Productivity', icon: 'briefcase.fill', color: '#4ECDC4', gradient: '#7EDDD6' },
  { value: 'learning', label: 'Learning', icon: 'book.fill', color: '#F7DC6F', gradient: '#FAE89F' },
  { value: 'mindfulness', label: 'Mindfulness', icon: 'leaf.fill', color: '#BB8FCE', gradient: '#D4B3E0' },
  { value: 'social', label: 'Social', icon: 'person.2.fill', color: '#85C1E2', gradient: '#A8D4ED' },
  { value: 'creative', label: 'Creative', icon: 'paintbrush.fill', color: '#FFA07A', gradient: '#FFB99A' },
  { value: 'custom', label: 'Custom', icon: 'star.fill', color: '#98D8C8', gradient: '#B5E5D9' },
];

const HABIT_TEMPLATES = [
  { name: 'Drink 8 glasses of water', category: 'health' as HabitCategory, color: '#45B7D1' },
  { name: '10-minute meditation', category: 'mindfulness' as HabitCategory, color: '#BB8FCE' },
  { name: 'Read for 30 minutes', category: 'learning' as HabitCategory, color: '#F7DC6F' },
  { name: 'Exercise for 20 minutes', category: 'health' as HabitCategory, color: '#FF6B6B' },
  { name: 'Write in journal', category: 'mindfulness' as HabitCategory, color: '#98D8C8' },
  { name: 'Practice gratitude', category: 'mindfulness' as HabitCategory, color: '#FFA07A' },
];

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory>('custom');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<HabitCategory | 'all'>('all');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const colorScheme = useColorScheme();
  const { canAddMoreHabits, isPremium, getHabitLimit } = usePremium();
  const router = useRouter();

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
        `Free users can track up to ${FREE_TIER_LIMITS.maxHabits} habits. Upgrade to Premium for unlimited habits!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Go Premium', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    setIsAdding(!isAdding);
  };

  const addHabit = async (template?: typeof HABIT_TEMPLATES[0]) => {
    const habitName = template ? template.name : newHabitName.trim();
    if (!habitName) return;

    // Double-check premium status before adding
    if (!canAddMoreHabits(habits.length)) {
      Alert.alert(
        'Habit Limit Reached',
        `Upgrade to Premium for unlimited habits!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Premium', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: habitName,
      category: template ? template.category : selectedCategory,
      color: template ? template.color : selectedColor,
      createdAt: new Date().toISOString(),
      completions: [],
    };

    await storage.addHabit(newHabit);
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setIsAdding(false);
    setShowTemplates(false);
    setSelectedColor(HABIT_COLORS[0]);
    setSelectedCategory('custom');
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
    console.log('Delete function called with habitId:', habitId);
    
    // Temporary: Delete immediately without confirmation for testing
    console.log('Immediate delete (testing)');
    storage.deleteHabit(habitId).then(() => {
      console.log('Habit deleted from storage');
      const filteredHabits = habits.filter(h => h.id !== habitId);
      console.log('Filtered habits count:', filteredHabits.length);
      console.log('Original habits count:', habits.length);
      setHabits(filteredHabits);
      console.log('State updated');
    }).catch(error => {
      console.error('Error deleting habit:', error);
      Alert.alert('Error', 'Failed to delete habit');
    });
    
    // Original code with confirmation (commented out for testing)
    /*
    Alert.alert('Delete Habit', 'Are you sure you want to delete this habit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          console.log('Delete button pressed in alert');
          storage.deleteHabit(habitId).then(() => {
            console.log('Habit deleted from storage');
            const filteredHabits = habits.filter(h => h.id !== habitId);
            console.log('Filtered habits count:', filteredHabits.length);
            console.log('Original habits count:', habits.length);
            setHabits(filteredHabits);
            console.log('State updated');
          }).catch(error => {
            console.error('Error deleting habit:', error);
            Alert.alert('Error', 'Failed to delete habit');
          });
        },
      },
    ]);
    */
  };

  const filteredHabits = selectedFilter === 'all' 
    ? habits 
    : habits.filter(h => h.category === selectedFilter);

  const getCategoryIcon = (category?: HabitCategory) => {
    const cat = HABIT_CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : 'star.fill';
  };

  // Calendar helpers
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
    if (!selectedHabit) return false;
    const dateStr = formatDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
    return selectedHabit.completions.includes(dateStr);
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarDate(newDate);
  };

  const openCalendar = (habit: Habit) => {
    setSelectedHabit(habit);
    setCalendarDate(new Date());
  };

  const calendarDays = getDaysInMonth(calendarDate);

  return (
    <ThemedView style={styles.container}>
      {/* Calendar Modal */}
      <Modal
        visible={selectedHabit !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedHabit(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalDot, { backgroundColor: selectedHabit?.color }]} />
              <ThemedText type="subtitle" style={styles.modalTitle}>{selectedHabit?.name}</ThemedText>
              <TouchableOpacity onPress={() => setSelectedHabit(null)}>
                <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                <IconSymbol name="chevron.left" size={24} color={selectedHabit?.color || Colors[colorScheme ?? 'light'].tint} />
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold" style={styles.monthText}>
                {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </ThemedText>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                <IconSymbol name="chevron.right" size={24} color={selectedHabit?.color || Colors[colorScheme ?? 'light'].tint} />
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {DAYS.map(day => (
                <View key={day} style={styles.dayHeader}>
                  <ThemedText style={styles.dayHeaderText}>{day}</ThemedText>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((day, index) => (
                <View key={index} style={styles.dayCell}>
                  {day !== null && (
                    <View style={[
                      styles.dayCircle,
                      isDateCompleted(day) && { backgroundColor: selectedHabit?.color },
                    ]}>
                      <ThemedText style={[
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

            {/* Stats */}
            {selectedHabit && (
              <View style={styles.modalStats}>
                <View style={[styles.modalStatCard, { borderLeftColor: selectedHabit.color }]}>
                  <IconSymbol name="flame.fill" size={20} color={selectedHabit.color} />
                  <ThemedText style={styles.modalStatValue}>{calculateStreaks(selectedHabit).currentStreak}</ThemedText>
                  <ThemedText style={styles.modalStatLabel}>Current Streak</ThemedText>
                </View>
                <View style={[styles.modalStatCard, { borderLeftColor: selectedHabit.color }]}>
                  <IconSymbol name="trophy.fill" size={20} color={selectedHabit.color} />
                  <ThemedText style={styles.modalStatValue}>{calculateStreaks(selectedHabit).longestStreak}</ThemedText>
                  <ThemedText style={styles.modalStatLabel}>Best Streak</ThemedText>
                </View>
                <View style={[styles.modalStatCard, { borderLeftColor: selectedHabit.color }]}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color={selectedHabit.color} />
                  <ThemedText style={styles.modalStatValue}>{selectedHabit.completions.length}</ThemedText>
                  <ThemedText style={styles.modalStatLabel}>Total Days</ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="title" style={styles.title}>
            My Habits
          </ThemedText>
          {!isPremium && (
            <TouchableOpacity 
              onPress={() => router.push('/premium')}
              style={styles.limitBadge}>
              <ThemedText style={styles.limitBadgeText}>
                {habits.length}/{getHabitLimit()} habits
              </ThemedText>
            </TouchableOpacity>
          )}
          {isPremium && (
            <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
              <IconSymbol name="crown.fill" size={12} color="#fff" />
              <ThemedText style={styles.premiumBadgeText}>PRO</ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={handleAddHabitPress}
          style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <IconSymbol name={isAdding ? 'xmark' : 'plus'} size={24} color={colorScheme !== 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={[styles.addForm, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <View style={styles.addFormHeader}>
            <TouchableOpacity
              onPress={() => setShowTemplates(false)}
              style={[
                styles.formTab,
                !showTemplates && { borderBottomColor: Colors[colorScheme ?? 'light'].tint },
              ]}>
              <ThemedText style={[styles.formTabText, !showTemplates && styles.formTabTextActive]}>Custom</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowTemplates(true)}
              style={[
                styles.formTab,
                showTemplates && { borderBottomColor: Colors[colorScheme ?? 'light'].tint },
              ]}>
              <ThemedText style={[styles.formTabText, showTemplates && styles.formTabTextActive]}>Templates</ThemedText>
            </TouchableOpacity>
          </View>

          {!showTemplates ? (
            <>
              {/* Swipeable Category Cards */}
              <ThemedText style={styles.sectionLabel}>Choose a category</ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.categoryCardsContainer}
                contentContainerStyle={styles.categoryCardsContent}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
              >
                {HABIT_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => {
                        setSelectedCategory(cat.value);
                        setSelectedColor(cat.color);
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.categoryCard,
                        { 
                          backgroundColor: cat.color,
                          width: CARD_WIDTH,
                          transform: [{ scale: isSelected ? 1.05 : 1 }],
                        },
                        isSelected && styles.categoryCardSelected,
                      ]}>
                      <View style={styles.categoryCardIcon}>
                        <IconSymbol name={cat.icon as any} size={32} color="#fff" />
                      </View>
                      <Text style={styles.categoryCardLabel}>{cat.label}</Text>
                      {isSelected && (
                        <View style={styles.categoryCardCheck}>
                          <IconSymbol name="checkmark" size={16} color={cat.color} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Habit Name Input */}
              <ThemedText style={styles.sectionLabel}>Name your habit</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: selectedColor,
                    borderWidth: 2,
                  },
                ]}
                placeholder="e.g., Exercise for 30 minutes"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={newHabitName}
                onChangeText={setNewHabitName}
              />
              
              {/* Create Button */}
              <TouchableOpacity
                onPress={() => addHabit()}
                disabled={!newHabitName.trim()}
                style={[
                  styles.saveButton, 
                  { backgroundColor: selectedColor },
                  !newHabitName.trim() && { opacity: 0.5 },
                ]}>
                <IconSymbol name="plus" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Create Habit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView style={styles.templatesList}>
              {HABIT_TEMPLATES.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => addHabit(template)}
                  style={[styles.templateItem, { borderLeftColor: template.color }]}>
                  <View style={[styles.templateDot, { backgroundColor: template.color }]} />
                  <ThemedText style={styles.templateName}>{template.name}</ThemedText>
                  <IconSymbol name="plus.circle.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          onPress={() => setSelectedFilter('all')}
          style={[
            styles.filterPill,
            selectedFilter === 'all' && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
          ]}>
          <ThemedText
            style={[
              styles.filterPillText,
              selectedFilter === 'all' && { color: '#fff' },
            ]}>
            All ({habits.length})
          </ThemedText>
        </TouchableOpacity>
        {HABIT_CATEGORIES.map(cat => {
          const count = habits.filter(h => h.category === cat.value).length;
          if (count === 0) return null;
          return (
            <TouchableOpacity
              key={cat.value}
              onPress={() => setSelectedFilter(cat.value)}
              style={[
                styles.filterPill,
                selectedFilter === cat.value && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              ]}>
              <ThemedText
                style={[
                  styles.filterPillText,
                  selectedFilter === cat.value && { color: '#fff' },
                ]}>
                {cat.label} ({count})
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.habitsList}>
        {filteredHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="star" size={64} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyText}>No habits yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Tap + to create your first habit</ThemedText>
          </View>
        ) : (
          filteredHabits.map(habit => {
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
                    <View style={styles.habitNameRow}>
                      <ThemedText type="defaultSemiBold" style={styles.habitName}>
                        {habit.name}
                      </ThemedText>
                      {habit.category && (
                        <IconSymbol
                          name={getCategoryIcon(habit.category) as any}
                          size={16}
                          color={habit.color}
                          style={styles.categoryIcon}
                        />
                      )}
                    </View>
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
                  onPress={() => openCalendar(habit)}
                  style={styles.calendarButton}>
                  <IconSymbol name="calendar" size={20} color={habit.color} />
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
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 32,
  },
  limitBadge: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  limitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
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
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  addFormHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  formTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  formTabText: {
    fontSize: 14,
    opacity: 0.6,
  },
  formTabTextActive: {
    opacity: 1,
    fontWeight: '600',
  },
  categoryPicker: {
    marginBottom: 12,
    maxHeight: 40,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    gap: 4,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  templatesList: {
    maxHeight: 200,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderLeftWidth: 3,
  },
  templateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  templateName: {
    flex: 1,
    fontSize: 14,
  },
  filterContainer: {
    maxHeight: 40,
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    marginLeft: 4,
  },
  calendarButton: {
    padding: 8,
    marginRight: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  modalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
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
  modalStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderLeftWidth: 3,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  modalStatLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 2,
  },
  // New Swipeable Category Cards
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.7,
  },
  categoryCardsContainer: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  categoryCardsContent: {
    paddingHorizontal: 20,
    gap: CARD_SPACING,
  },
  categoryCard: {
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryCardSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  categoryCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryCardCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
