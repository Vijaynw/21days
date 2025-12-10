/**
 * Supabase Client Configuration
 * 
 * IMPORTANT: Replace these with your actual Supabase project credentials
 * Get them from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project URL and anon key
const SUPABASE_URL = 'https://aicasdhibiraorjltjii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpY2FzZGhpYmlyYW9yamx0amlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzYxODMsImV4cCI6MjA3NTgxMjE4M30.jHxwIOYjfJY2ExPKtAopjMWyEpYrEF58jsetT772eo8';

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
