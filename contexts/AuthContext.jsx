/**
 * Auth Context for Supabase Authentication
 */

import { supabase } from '@/utils/supabase';
import { syncService } from '@/utils/sync-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  deleteUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const previousUserId = useRef(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      previousUserId.current = session?.user?.id ?? null;
      setLoading(false);
      
      // Pull cloud data on initial load if user is logged in
      if (session?.user) {
        syncService.pullFromCloud().then(() => {
          console.log('Initial cloud sync completed');
          DeviceEventEmitter.emit('habits-updated');
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const newUserId = session?.user?.id ?? null;
        
        // User changed - clear local cache and pull new user's data
        if (newUserId && newUserId !== previousUserId.current) {
          console.log('User changed, pulling cloud data...');
          await syncService.pullFromCloud();
          DeviceEventEmitter.emit('habits-updated');
        }
        
        previousUserId.current = newUserId;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Clear local habits cache on sign out
      await AsyncStorage.removeItem('@habits');
      await AsyncStorage.removeItem('@last_sync');
      await AsyncStorage.removeItem('@sync_status');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const deleteUser = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(
        user.id
      );
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
