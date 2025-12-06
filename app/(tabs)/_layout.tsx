import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1a1a1a',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarButton: HapticTab,
   tabBarStyle: {
  position: 'absolute',
  bottom: 20,
  left: 20,
  right: 20,
  height: 80,
  paddingBottom: 20,
  paddingTop: 10,
  backgroundColor: '#fff',
  borderRadius: 24,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 5,
  borderTopWidth: 0,
},

        tabBarLabelStyle: {
          display: 'none',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
  <View
    style={{
      padding: 10,
      borderRadius: 20,
      backgroundColor: focused ? '#f0f0f0' : 'transparent',
    }}
  >
    <IconSymbol size={24} name="house.fill" color={color} />
  </View>
),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
      {/* Hidden tabs */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="premium" options={{ href: null }} />
      <Tabs.Screen name="index-old" options={{ href: null }} />
      <Tabs.Screen name="index-old-backup" options={{ href: null }} />
    </Tabs>
  );
}
