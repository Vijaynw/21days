/**
 * Sync Card Component
 * Shows sync status and provides sync controls
 */

import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/hooks/use-sync';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function SyncCard({ onSignInPress }) {
  const { user } = useAuth();
  const { syncing, syncStatus, error, sync, formatLastSync, isAuthenticated } = useSync();

  if (!isAuthenticated) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>☁️</Text>
          <Text style={styles.title}>Cloud Sync</Text>
        </View>
        <Text style={styles.description}>
          Sign in to sync your habits across devices and never lose your progress.
        </Text>
        <TouchableOpacity style={styles.signInButton} onPress={onSignInPress}>
          <Text style={styles.signInButtonText}>Sign In to Enable</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
      default:
        return 'Not Synced';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>☁️</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>Cloud Sync</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.lastSync}>Last sync: {formatLastSync()}</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
        onPress={sync}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.syncIcon}>🔄</Text>
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 16,
    lineHeight: 20,
  },
  userInfo: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  lastSync: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
  },
  signInButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SyncCard;
