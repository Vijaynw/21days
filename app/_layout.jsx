/**
 * Root Layout (JavaScript)
 */

import { LottieAnimation } from '@/components/lottie-animation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PremiumProvider } from '@/contexts/PremiumContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import 'react-native-reanimated';

// Register Android widgets
if (Platform.OS === 'android') {
  require('../widgets/register-widgets');
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        {Platform.OS === 'web' ? (
          <ActivityIndicator size="large" color="#1a1a1a" />
        ) : (
          <LottieAnimation
            source={require('../assets/animations/Calendar.json')}
            autoPlay={true}
            loop={true}
            style={{ width: 150, height: 150 }}
          />
        )}
        <Text style={{ marginTop: 16, fontSize: 18, color: '#1a1a1a', fontWeight: '600' }}>21days</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
      {/* Force redirect based on auth state */}
      {!user ? <Redirect href="/auth" /> : <Redirect href="/(tabs)" />}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <RootLayoutNav />
      </PremiumProvider>
    </AuthProvider>
  );
}
