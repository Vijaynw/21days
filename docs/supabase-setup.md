# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details and create

## 2. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy the **Project URL** and **anon public** key
3. Update `/utils/supabase.js` with your credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## 3. Create the Database Table

Go to **SQL Editor** and run this query:

```sql
-- Create habits table
CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'custom',
  color TEXT DEFAULT '#1a1a1a',
  icon TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completions TEXT[] DEFAULT '{}',
  reminder_time TEXT,
  notes JSONB DEFAULT '{}',
  
  UNIQUE(id, user_id)
);

-- Create index for faster queries
CREATE INDEX habits_user_id_idx ON habits(user_id);

-- Enable Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own habits
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy: Users can insert their own habits
CREATE POLICY "Users can insert own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own habits
CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy: Users can delete their own habits
CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 4. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Optional: Enable **Google** provider for social login

### For Google OAuth (Optional):
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add your Supabase callback URL: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

## 5. Test the Setup

1. Run the app: `npx expo start`
2. Go to Settings → Cloud Sync
3. Create an account or sign in
4. Tap "Sync Now" to sync your habits

## Troubleshooting

### "Invalid API key"
- Make sure you copied the **anon public** key, not the service role key

### "User not found"
- Check if email confirmation is required in Auth settings
- Look in Authentication → Users to see registered users

### "Permission denied"
- Verify RLS policies are created correctly
- Check that user_id matches auth.uid()

## Security Notes

- Never commit your Supabase keys to git
- The anon key is safe for client-side use (RLS protects data)
- For production, consider using environment variables
