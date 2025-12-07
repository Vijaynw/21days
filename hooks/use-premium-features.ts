import { usePremium } from '@/contexts/PremiumContext';
import { Habit } from '@/types/habit';
import { PremiumFeatures } from '@/utils/premium-features';
import { useCallback, useState } from 'react';

export function usePremiumFeatures(habits: Habit[] = []) {
  const { isPremium, hasFeature } = usePremium();
  const [analytics, setAnalytics] = useState<any>(null);

  // Advanced Analytics
  const getAnalytics = useCallback(() => {
    if (!isPremium) return null;
    const data = PremiumFeatures.getAdvancedAnalytics(habits);
    setAnalytics(data);
    return data;
  }, [habits, isPremium]);

  // Custom Reminders
  const setReminder = async (habitId: string, reminderTime: string) => {
    if (!isPremium) return false;
    return await PremiumFeatures.setReminder(habitId, reminderTime);
  };

  // Habit Notes
  const addNote = async (habitId: string, date: string, note: string) => {
    if (!isPremium) return false;
    return await PremiumFeatures.addHabitNote(habitId, date, note);
  };

  const getNotes = async (habitId: string) => {
    if (!isPremium) return {};
    return await PremiumFeatures.getHabitNotes(habitId);
  };

  // Export Data
  const exportData = (format: 'csv' | 'json') => {
    if (!isPremium) return null;
    return format === 'csv' 
      ? PremiumFeatures.exportToCSV(habits)
      : PremiumFeatures.exportToJSON(habits);
  };

  // Premium Themes
  const getThemes = () => {
    if (!isPremium) return [];
    return PremiumFeatures.getPremiumThemes();
  };

  // Home Screen Widgets
  const getWidgetData = useCallback(() => {
    if (!isPremium) return null;
    return PremiumFeatures.getWidgetData(habits);
  }, [habits, isPremium]);

  // Cloud Backup
  const backupToCloud = async () => {
    if (!isPremium) return null;
    return await PremiumFeatures.backupToCloud();
  };

  return {
    // Analytics
    analytics,
    getAnalytics,
    
    // Reminders
    setReminder,
    
    // Notes
    addNote,
    getNotes,
    
    // Export
    exportData,
    
    // Themes
    getThemes,
    
    // Widgets
    getWidgetData,
    
    // Backup
    backupToCloud,
    
    // Feature availability
    canUseAnalytics: isPremium && hasFeature('hasAdvancedAnalytics'),
    canUseReminders: isPremium && hasFeature('hasCustomReminders'),
    canUseNotes: isPremium && hasFeature('hasHabitNotes'),
    canExport: isPremium && hasFeature('hasExportData'),
    canUseThemes: isPremium && hasFeature('hasPremiumThemes'),
    canUseWidgets: isPremium && hasFeature('hasWidgets'),
    canBackup: isPremium && hasFeature('hasCloudBackup'),
  };
}
