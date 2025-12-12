import { LottieAnimation } from '@/components/lottie-animation';
import { usePremium } from '@/contexts/PremiumContext';
// Types removed for JavaScript
import { FREE_TIER_LIMITS } from '@/types/premium';
import { collectionsStorage } from '@/utils/collections';
import { storage } from '@/utils/storage';
import { calculateStreaks, formatDate } from '@/utils/streaks';
import { Button } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
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
const MOTIVATIONAL_QUOTES = [
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
];

const HABIT_TEMPLATES = [
  { name: 'sleep 8hrs', category: 'health', icon: '😴' },
  { name: 'exercise', category: 'health', icon: '🏃' },
  { name: 'drink water', category: 'health', icon: '💧' },
  { name: 'take vitamins', category: 'health', icon: '💊' },
  { name: 'stretch', category: 'health', icon: '🤸' },
  { name: 'no junk food', category: 'health', icon: '🥗' },
  { name: 'walk 10k steps', category: 'health', icon: '👟' },
  { name: 'meditate', category: 'mindfulness', icon: '🧘' },
  { name: 'journal', category: 'mindfulness', icon: '📝' },
  { name: 'gratitude', category: 'mindfulness', icon: '🙏' },
  { name: 'deep breathing', category: 'mindfulness', icon: '🌬️' },
  { name: 'no phone before bed', category: 'mindfulness', icon: '📵' },
  { name: 'read 30 mins', category: 'learning', icon: '📖' },
  { name: 'learn language', category: 'learning', icon: '🗣️' },
  { name: 'practice coding', category: 'learning', icon: '💻' },
  { name: 'watch tutorial', category: 'learning', icon: '🎓' },
  { name: 'take notes', category: 'learning', icon: '✏️' },
  { name: 'wake up early', category: 'productivity', icon: '⏰' },
  { name: 'plan tomorrow', category: 'productivity', icon: '📋' },
  { name: 'inbox zero', category: 'productivity', icon: '📧' },
  { name: 'no social media', category: 'productivity', icon: '🚫' },
  { name: 'focus time', category: 'productivity', icon: '🎯' },
  { name: 'call family', category: 'social', icon: '📞' },
  { name: 'meet a friend', category: 'social', icon: '🤝' },
  { name: 'compliment someone', category: 'social', icon: '💬' },
  { name: 'draw/sketch', category: 'creative', icon: '✏️' },
  { name: 'play music', category: 'creative', icon: '🎸' },
  { name: 'write', category: 'creative', icon: '✍️' },
  { name: 'photography', category: 'creative', icon: '📷' },
];

const ICON_CHOICES = ['😴', '🏃', '💧', '💊', '🤸', '🥗', '👟', '🧘', '📝', '🙏', '🌬️', '📵', '📖', '🗣️', '💻', '🎓', '✏️', '⏰', '📋', '📧', '🚫', '🎯', '📞', '🤝', '💬', '🎨', '🎸', '✍️', '📷'];

// Feature 2: Scrollable past dates timeline
const getTimelineDates = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // reset time to midnight
  const dates = [];
  const range = 7; // total number of days
  const halfRange = Math.floor(range / 2);
  for (let i = -halfRange; i <= halfRange; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  return dates;
};

// Helper to get current date index for centering
export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('🎯');
  const [isEditingHabit, setIsEditingHabit] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [editedHabitName, setEditedHabitName] = useState('');
  const [editedHabitIcon, setEditedHabitIcon] = useState('🎯');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [habitPendingDelete, setHabitPendingDelete] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null); // null = all habits
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionIcon, setNewCollectionIcon] = useState('📁');
  const [showMoveToCollectionModal, setShowMoveToCollectionModal] = useState(false);
  const [habitToMove, setHabitToMove] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { canAddMoreHabits } = usePremium();
  const router = useRouter();
  const timelineDates = getTimelineDates();
  const currentMonth = MONTHS_SHORT[new Date().getMonth()];
  const [dailyQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  useEffect(() => {
    loadHabits();
    loadCollections();
  }, []);

  const loadHabits = async () => {
    const loadedHabits = await storage.getHabits();
    setHabits(loadedHabits);
  };

  const loadCollections = async () => {
    const loadedCollections = await collectionsStorage.getCollections();
    setCollections(loadedCollections);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Name required', 'Please enter a collection name.');
      return;
    }
    await collectionsStorage.addCollection(newCollectionName.trim(), newCollectionIcon);
    await loadCollections();
    setNewCollectionName('');
    setNewCollectionIcon('📁');
    setShowCollectionModal(false);
  };

  const handleDeleteCollection = async (collectionId) => {
    Alert.alert(
      'Delete Collection',
      'Are you sure? Habits in this collection will be moved to "All Habits".',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Move habits from this collection to no collection
            const allHabits = await storage.getHabits();
            const updatedHabits = allHabits.map(h => 
              h.collectionId === collectionId ? { ...h, collectionId: null } : h
            );
            await storage.saveHabits(updatedHabits);
            await collectionsStorage.deleteCollection(collectionId);
            await loadCollections();
            await loadHabits();
            if (selectedCollection === collectionId) {
              setSelectedCollection(null);
            }
          },
        },
      ]
    );
  };

  const handleMoveToCollection = async (collectionId) => {
    if (!habitToMove) return;
    const updatedHabit = { ...habitToMove, collectionId };
    await storage.updateHabit(updatedHabit);
    await loadHabits();
    setShowMoveToCollectionModal(false);
    setHabitToMove(null);
  };

  const openMoveToCollection = (habit) => {
    setHabitToMove(habit);
    setShowMoveToCollectionModal(true);
  };

  // Filter habits by selected collection
  const filteredHabits = selectedCollection
    ? habits.filter(h => h.collectionId === selectedCollection)
    : habits;

  const openEditHabit = (habit) => {
    setHabitToEdit(habit);
    setEditedHabitName(habit.name);
    setEditedHabitIcon(habit.icon ?? '🎯');
    setIsEditingHabit(true);
  };

  const handleSaveHabitName = async () => {
    if (!habitToEdit) return;
    const trimmed = editedHabitName.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a valid habit name.');
      return;
    }

    const updatedHabit = { ...habitToEdit, name: trimmed, icon: editedHabitIcon };
    await storage.updateHabit(updatedHabit);
    setHabits((prev) => prev.map((h) => (h.id === updatedHabit.id ? updatedHabit : h)));
    setIsEditingHabit(false);
    setHabitToEdit(null);
    setEditedHabitName('');
    setEditedHabitIcon('🎯');
  };

  const handleAddHabitPress = useCallback(() => {
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
  }, [canAddMoreHabits, habits.length, router]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('open-add-habit', () => {
      handleAddHabitPress();
    });
    const habitUpdateSubscription = DeviceEventEmitter.addListener('habits-updated', () => {
      loadHabits();
    });
    return () => {
      subscription.remove();
      habitUpdateSubscription.remove();
    };
  }, [handleAddHabitPress]);

  const addHabit = async (template = null) => {
    const habitName = template?.name || newHabitName.trim();
    if (!habitName) return;

    const newHabit = {
      id: Date.now().toString(),
      name: habitName.toLowerCase(),
      color: '#1a1a1a',
      createdAt: new Date().toISOString(),
      completions: [],
      icon: template?.icon || newHabitIcon,
    };

    await storage.addHabit(newHabit);
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setIsAdding(false);
    setNewHabitIcon('🎯');
  };

  const toggleCompletion = async (habit, date) => {
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

    // Show success animation when completing a habit (not uncompleting)
    if (!isCompleted && isToday(date)) {
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 1500);
    }
  };

  const isDateCompleted = (habit, date) => {
    return habit.completions.includes(formatDate(date));
  };

  const isDateMissed = (habit, date) => {
    return (habit.missed || []).includes(formatDate(date));
  };

  const toggleMissed = async (habit, date) => {
    const dateStr = formatDate(date);
    const isMissed = (habit.missed || []).includes(dateStr);
    const isCompleted = habit.completions.includes(dateStr);

    // If completed, remove from completions first
    let updatedCompletions = habit.completions;
    if (isCompleted) {
      updatedCompletions = habit.completions.filter(d => d !== dateStr);
    }

    const updatedHabit = {
      ...habit,
      completions: updatedCompletions,
      missed: isMissed
        ? (habit.missed || []).filter(d => d !== dateStr)
        : [...(habit.missed || []), dateStr],
    };

    await storage.updateHabit(updatedHabit);
    setHabits(habits.map(h => (h.id === habit.id ? updatedHabit : h)));
  };

  
  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  // Feature 3: Streak badge
  const getCurrentStreak = (habit) => calculateStreaks(habit).currentStreak;

  // Feature 5: Fade past days
  const getDaysAgo = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  };

  const requestHabitDelete = (habit) => {
    setHabitPendingDelete(habit);
    setDeleteModalVisible(true);
  };

  const cancelHabitDelete = () => {
    setDeleteModalVisible(false);
    setHabitPendingDelete(null);
  };

  const confirmHabitDelete = async () => {
    if (!habitPendingDelete) return;
    await storage.deleteHabit(habitPendingDelete.id);
    setHabits(prev => prev.filter(h => h.id !== habitPendingDelete.id));
    cancelHabitDelete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <SyncButton style={styles.syncButton} /> */}
        <Text style={styles.title}>My Habits</Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowHelpModal(true)}
        >
          <Text style={styles.helpButtonText}>?</Text>
        </TouchableOpacity>
      </View>

                  {/* Feature 4: Weekly Summary Widget */}
            {habits.length > 0 && <View style={styles.widget}>
              <View style={styles.widgetRow}>
                <View style={styles.widgetSection}>
                  <Text style={styles.widgetTitle}>today</Text>
                  <Text style={styles.widgetNumber}>
                    {habits.filter(h => h.completions.includes(formatDate(new Date()))).length}/{habits.length}
                  </Text>
                </View>
                {/* <View style={styles.widgetDivider} /> */}
                {/* <View style={styles.widgetSection}>
                  <Text style={styles.widgetTitle}>this week</Text>
                  <Text style={styles.widgetNumber}>{getWeekProgress()}%</Text>
                </View> */}
              </View>
            </View>}

      {/* Collection Tabs */}
      {habits.length > 0 && <View style={styles.collectionTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionTabsContent}>
          <TouchableOpacity
            style={[styles.collectionTab, selectedCollection === null && styles.collectionTabActive]}
            onPress={() => setSelectedCollection(null)}
          >
            <Text style={[styles.collectionTabText, selectedCollection === null && styles.collectionTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {collections.map(collection => (
            <TouchableOpacity
              key={collection.id}
              style={[styles.collectionTab, selectedCollection === collection.id && styles.collectionTabActive]}
              onPress={() => setSelectedCollection(collection.id)}
              onLongPress={() => handleDeleteCollection(collection.id)}
            >
              <Text style={[styles.collectionTabText, selectedCollection === collection.id && styles.collectionTabTextActive]}>
                {collection.icon} {collection.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addCollectionTab}
            onPress={() => setShowCollectionModal(true)}
          >
            <Text style={styles.addCollectionText}>+ New</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>}

      <ScrollView style={styles.habitsList} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {filteredHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>track</Text>
            <Text style={styles.emptySubtitle}>your habit.</Text>
            
            {/* <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>&ldquo;{dailyQuote.text}&rdquo;</Text>
              <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
            </View> */}
            
            <LottieAnimation
              source={require('@/assets/animations/Social Engagement.json')}
              autoPlay
              loop
              style={styles.emptyAnimation}
            />
          </View>
          
        ) : (
          <>


             

            {filteredHabits.map(habit => {
              const streak = getCurrentStreak(habit);
              return (
                <TouchableOpacity
                  key={habit.id}
                  style={styles.habitCard}
                  // onPress={() => router.push({ pathname: '[id]' as any, params: { id: habit.id } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.habitHeader}>
                    <View style={styles.habitNameRow}>
                      <Text style={styles.habitName}>{habit.icon} {habit.name}</Text>
                      {streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakIcon}>🔥</Text>
                          <Text style={styles.streakText}>{streak}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.habitActions}>
                      <TouchableOpacity
                        onPress={() => openMoveToCollection(habit)}
                        style={styles.moveButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.moveButtonText}>📁</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => requestHabitDelete(habit)}
                        style={styles.deleteButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.deleteButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{flex:1,flexDirection:"row"}}>
                    <Button color='#9da1a4ff' onPress={() => router.push({ pathname: '[id]', params: { id: habit.id} })}>Progress </Button>
                    <Button color='#9da1a4ff' onPress={() => openEditHabit(habit)}>edit</Button>
                  </View>

                  <Text style={styles.monthLabel}>{currentMonth}</Text>

                  {/* Feature 2: Scrollable Date Timeline */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.weekRow}
                    contentContainerStyle={styles.weekRowContent}
                  >
                    {timelineDates.map((date) => {
                      const completed = isDateCompleted(habit, date);
                      const missed = isDateMissed(habit, date);
                      const today = isToday(date);
                      const dayIndex = (date.getDay() + 6) % 7;
                      const daysAgo = getDaysAgo(date);
                      // Feature 5: Fade past days
                      const fadeOpacity = today ? 1 : Math.max(0.4, 1 - daysAgo * 0.04);

                      return (
                        <TouchableOpacity
                          key={formatDate(date)}
                          style={[styles.dayColumn, { opacity: fadeOpacity }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleCompletion(habit, date);
                          }}
                          onLongPress={(e) => {
                            e.stopPropagation();
                            toggleMissed(habit, date);
                          }}
                          delayLongPress={300}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.dayDot,
                              completed && styles.dayDotCompleted,
                              missed && styles.dayDotMissed,
                              today && !completed && !missed && styles.dayDotToday,
                            ]}
                          >
                            {missed ? (
                              <Text style={styles.missedX}>✕</Text>
                            ) : (
                              <Text
                                style={[
                                  styles.dayNumber,
                                  completed && styles.dayNumberCompleted,
                                ]}
                              >
                                {date.getDate()}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.dayLabel}>{DAYS_SHORT[dayIndex]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        {/* <View style={{ height: 100 }} /> */}
      </ScrollView>

      <Modal visible={isAdding} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Habit</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Habit Name"
              placeholderTextColor="#999"
              value={newHabitName}
              onChangeText={setNewHabitName}
              autoFocus
            />
                        <Text style={styles.suggestionsTitle}>Icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconScroll}
              contentContainerStyle={styles.iconScrollContent}
            >
              {ICON_CHOICES.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconChip,
                    newHabitIcon === icon && styles.iconChipActive,
                  ]}
                  onPress={() => setNewHabitIcon(icon)}
                >
                  <Text style={styles.iconChipText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.suggestionsTitle}>Category</Text>
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
                      onPress={() => addHabit(template)}
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

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteBadge}>
              <Text style={styles.deleteBadgeText}>⚠️</Text>
            </View>
            <Text style={styles.deleteTitle}>Delete habit?</Text>
            <Text style={styles.deleteSubtitle}>
              {habitPendingDelete?.name
                ? `This will remove “${habitPendingDelete.name}” and its history.`
                : 'This will remove the habit and its history.'}
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelHabitDelete}
              >
                <Text style={styles.cancelButtonText}>Keep habit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={confirmHabitDelete}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditingHabit} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>edit habit</Text>

            <TextInput
              style={styles.input}
              placeholder="habit name"
              placeholderTextColor="#999"
              value={editedHabitName}
              onChangeText={setEditedHabitName}
              autoFocus
            />

            <Text style={styles.suggestionsTitle}>icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconScroll}
              contentContainerStyle={styles.iconScrollContent}
            >
              {ICON_CHOICES.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconChip,
                    editedHabitIcon === icon && styles.iconChipActive,
                  ]}
                  onPress={() => setEditedHabitIcon(icon)}
                >
                  <Text style={styles.iconChipText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditingHabit(false);
                  setHabitToEdit(null);
                  setEditedHabitName('');
                  setEditedHabitIcon('🎯');
                }}
              >
                <Text style={styles.cancelButtonText}>cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !editedHabitName.trim() && styles.createButtonDisabled]}
                onPress={handleSaveHabitName}
                disabled={!editedHabitName.trim()}
              >
                <Text style={styles.createButtonText}>save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Animation Modal */}
      <Modal
        visible={showSuccessAnimation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessAnimation(false)}
      >
        <View style={styles.successAnimationOverlay}>
          <View style={styles.successAnimationContainer}>
            <LottieAnimation
              source={require('@/assets/animations/Smart Card.json')}
              autoPlay={true}
              loop={false}
              style={styles.successAnimation}
              onAnimationFinish={() => setShowSuccessAnimation(false)}
            />
            <Text style={styles.successText}>Great job!</Text>
          </View>
        </View>
      </Modal>

      {/* Create Collection Modal */}
      <Modal
        visible={showCollectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCollectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <View style={styles.iconSelector}>
              {['📁', '💼', '🏠', '💪', '🧠', '❤️', '⭐', '🎯'].map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, newCollectionIcon === icon && styles.iconOptionSelected]}
                  onPress={() => setNewCollectionIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Collection name"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCollectionModal(false);
                  setNewCollectionName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, !newCollectionName.trim() && styles.createButtonDisabled]}
                onPress={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Move to Collection Modal */}
      <Modal
        visible={showMoveToCollectionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMoveToCollectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move to Collection</Text>
            <TouchableOpacity
              style={styles.collectionOption}
              onPress={() => handleMoveToCollection(null)}
            >
              <Text style={styles.collectionOptionText}>📋 No Collection</Text>
              {habitToMove?.collectionId === null && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            {collections.map(collection => (
              <TouchableOpacity
                key={collection.id}
                style={styles.collectionOption}
                onPress={() => handleMoveToCollection(collection.id)}
              >
                <Text style={styles.collectionOptionText}>{collection.icon} {collection.name}</Text>
                {habitToMove?.collectionId === collection.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMoveToCollectionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help/Tutorial Modal */}
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpModalContent}>
            <View style={styles.helpHeader}>
              <Text style={styles.helpTitle}>How to use</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Text style={styles.helpCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>1</Text>
              </View>
              <View style={styles.helpStepContent}>
                <Text style={styles.helpStepTitle}>Tap to complete</Text>
                <Text style={styles.helpStepDesc}>Tap any date circle to mark your habit as done for that day</Text>
              </View>
            </View>

            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>2</Text>
              </View>
              <View style={styles.helpStepContent}>
                <Text style={styles.helpStepTitle}>Long press to mark missed</Text>
                <Text style={styles.helpStepDesc}>Hold a date to mark it as missed (shows ✕)</Text>
              </View>
            </View>

            <View style={styles.helpStep}>
              <View style={styles.helpStepNumber}>
                <Text style={styles.helpStepNumberText}>3</Text>
              </View>
              <View style={styles.helpStepContent}>
                <Text style={styles.helpStepTitle}>Edit & organize</Text>
                <Text style={styles.helpStepDesc}>Use the edit button to rename habits, or 📁 to move to collections</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.helpGotItButton}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.helpGotItText}>Got it!</Text>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  syncButton: {
    marginRight: 12,
  },
  headerSpacer: {
    width: 40,
  },
  helpButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  helpModalContent: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  helpCloseText: {
    fontSize: 20,
    color: '#999',
  },
  helpStep: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  helpStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  helpStepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  helpStepContent: {
    flex: 1,
  },
  helpStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  helpStepDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  helpGotItButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  helpGotItText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  // Feature 4: Widget styles
  widget: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetSection: {
    flex: 1,
    alignItems: 'center',
  },
  widgetDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  widgetTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  widgetNumber: {
    fontSize: 28,
    fontWeight: '700',
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
  habitNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  habitName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  // Feature 3: Streak badge styles
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9800',
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  iconScroll: {
    marginHorizontal: -24,
    marginBottom: 16,
  },
  iconScrollContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  iconChipActive: {
    borderColor: '#1a1a1a',
    backgroundColor: '#1a1a1a10',
  },
  iconChipText: {
    fontSize: 20,
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
  // Feature 2: Scrollable timeline styles
  weekRow: {
    flexDirection: 'row',
  },
  weekRowContent: {
    paddingRight: 24,
    gap: 12,
  },
  dayColumn: {
    alignItems: 'center',
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
  dayDotMissed: {
    backgroundColor: '#ffebee',
    borderWidth: 2,
    borderColor: '#ff4444',
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
  missedX: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff4444',
  },
  dayLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
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
    quoteCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginTop: 10,
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
  deleteModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  deleteBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBadgeText: {
    fontSize: 24,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  deleteSubtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ff5f6d',
  },
  deleteConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
    title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1a1a1a',
    textAlign:"left"
  },
  // Success Animation styles
  successAnimationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successAnimationContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  successAnimation: {
    width: 150,
    height: 150,
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
  },
  // Collection styles
  collectionTabs: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  collectionTabsContent: {
    gap: 8,
  },
  collectionTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  collectionTabActive: {
    backgroundColor: '#1a1a1a',
  },
  collectionTabText: {
    fontSize: 14,
    color: '#666',
  },
  collectionTabTextActive: {
    color: '#fff',
  },
  addCollectionTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addCollectionText: {
    fontSize: 14,
    color: '#999',
  },
  moveButton: {
    padding: 4,
    marginRight: 8,
  },
  moveButtonText: {
    fontSize: 16,
  },
  collectionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  collectionOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  checkmark: {
    fontSize: 18,
    color: '#22c55e',
  },
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOptionSelected: {
    backgroundColor: '#1a1a1a',
  },
  iconOptionText: {
    fontSize: 20,
  },
});
