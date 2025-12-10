/**
 * Sync Hook
 * Provides sync functionality with status tracking
 */

import { useAuth } from '@/contexts/AuthContext';
import { syncService } from '@/utils/sync-service';
import { useCallback, useEffect, useState } from 'react';

export function useSync() {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [error, setError] = useState(null);

  // Load initial sync state
  useEffect(() => {
    loadSyncState();
  }, []);

  const loadSyncState = async () => {
    const lastSyncTime = await syncService.getLastSyncTime();
    const status = await syncService.getSyncStatus();
    setLastSync(lastSyncTime);
    setSyncStatus(status);
  };

  const sync = useCallback(async () => {
    if (!user) {
      setError('Please sign in to sync');
      return { success: false, error: 'Not authenticated' };
    }

    setSyncing(true);
    setError(null);
    setSyncStatus('syncing');

    try {
      const result = await syncService.syncAll();
      
      if (result.success) {
        setSyncStatus('synced');
        setLastSync(new Date());
      } else {
        setSyncStatus('error');
        setError(result.error);
      }

      return result;
    } catch (err) {
      setSyncStatus('error');
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const pushToCloud = useCallback(async () => {
    if (!user) {
      setError('Please sign in to sync');
      return { success: false, error: 'Not authenticated' };
    }

    setSyncing(true);
    setError(null);

    try {
      const result = await syncService.pushToCloud();
      
      if (result.success) {
        setSyncStatus('synced');
        setLastSync(new Date());
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const pullFromCloud = useCallback(async () => {
    if (!user) {
      setError('Please sign in to sync');
      return { success: false, error: 'Not authenticated' };
    }

    setSyncing(true);
    setError(null);

    try {
      const result = await syncService.pullFromCloud();
      
      if (result.success) {
        setSyncStatus('synced');
        setLastSync(new Date());
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diff = now - lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return {
    syncing,
    lastSync,
    syncStatus,
    error,
    sync,
    pushToCloud,
    pullFromCloud,
    formatLastSync,
    isAuthenticated: !!user,
  };
}

export default useSync;
