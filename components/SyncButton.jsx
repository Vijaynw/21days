/**
 * Compact Sync Button Component
 * Small button for header placement with auto-sync functionality
 */

import { useSync } from '@/hooks/use-sync';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const AUTO_SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

export function SyncButton({ style }) {
  const { syncing, syncStatus, sync, isAuthenticated } = useSync();
  const syncIntervalRef = useRef(null);

  // Auto-sync every 5 minutes when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initial sync on mount
      sync();

      // Set up interval for auto-sync
      syncIntervalRef.current = setInterval(() => {
        sync();
      }, AUTO_SYNC_INTERVAL);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [isAuthenticated, sync]);

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return '#22c55e';
      case 'syncing':
        return '#0a7ea4';
      case 'error':
        return '#ef4444';
      default:
        return '#9BA1A6';
    }
  };

  const handlePress = () => {
    sync();
  };

  // Don't render if not authenticated (user must be logged in now)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={syncing}
    >
      {syncing ? (
        <ActivityIndicator color="#1a1a1a" size="small" />
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>☁️</Text>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonNotAuth: {
    opacity: 0.6,
  },
  content: {
    position: 'relative',
  },
  icon: {
    fontSize: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
});

export default SyncButton;
