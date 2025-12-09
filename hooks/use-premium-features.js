/**
 * Premium Features Hook (JavaScript)
 */

import { usePremium } from '@/contexts/PremiumContext';
import { PremiumFeatures } from '@/utils/premium-features';
import { useCallback, useMemo, useState } from 'react';

export function usePremiumFeatures(habits) {
  const habitsArray = useMemo(function() {
    return habits || [];
  }, [habits]);
  const { isPremium, hasFeature } = usePremium();
  const [analytics, setAnalytics] = useState(null);

  // Advanced Analytics
  const getAnalytics = useCallback(function() {
    if (!isPremium) return null;
    const data = PremiumFeatures.getAdvancedAnalytics(habitsArray);
    setAnalytics(data);
    return data;
  }, [habitsArray, isPremium]);

  // Custom Reminders
  const setReminder = async function(habitId, reminderTime) {
    if (!isPremium) return false;
    return await PremiumFeatures.setReminder(habitId, reminderTime);
  };

  // Habit Notes
  const addNote = async function(habitId, date, note) {
    if (!isPremium) return false;
    return await PremiumFeatures.addHabitNote(habitId, date, note);
  };

  const getNotes = async function(habitId) {
    if (!isPremium) return {};
    return await PremiumFeatures.getHabitNotes(habitId);
  };

  // Export Data
  const exportData = function(format) {
    if (!isPremium) return null;
    return format === 'csv' 
      ? PremiumFeatures.exportToCSV(habitsArray)
      : PremiumFeatures.exportToJSON(habitsArray);
  };

  // Premium Themes
  const getThemes = function() {
    if (!isPremium) return [];
    return PremiumFeatures.getPremiumThemes();
  };

  // Home Screen Widgets
  const getWidgetData = useCallback(function() {
    if (!isPremium) return null;
    return PremiumFeatures.getWidgetData(habitsArray);
  }, [habitsArray, isPremium]);

  // Cloud Backup
  const backupToCloud = async function() {
    if (!isPremium) return null;
    return await PremiumFeatures.backupToCloud();
  };

  return {
    // Analytics
    analytics: analytics,
    getAnalytics: getAnalytics,
    
    // Reminders
    setReminder: setReminder,
    
    // Notes
    addNote: addNote,
    getNotes: getNotes,
    
    // Export
    exportData: exportData,
    
    // Themes
    getThemes: getThemes,
    
    // Widgets
    getWidgetData: getWidgetData,
    
    // Backup
    backupToCloud: backupToCloud,
    
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
