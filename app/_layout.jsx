/**
 * Root Layout (JavaScript)
 */

import { AuthProvider } from '@/contexts/AuthContext';
import { PremiumProvider } from '@/contexts/PremiumContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

// Register Android widgets
if (Platform.OS === 'android') {
  require('../widgets/register-widgets');
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <PremiumProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="auth" 
              options={{ 
                headerShown: false,
                presentation: 'modal',
              }} 
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}
