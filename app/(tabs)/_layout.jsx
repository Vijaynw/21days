/**
 * Tab Layout (JavaScript)
 */

import { IconSymbol } from '@/components/ui/icon-symbol';
import { storage } from '@/utils/storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { DeviceEventEmitter, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const [hasHabits, setHasHabits] = useState(false);

  const refreshHabits = useCallback(async function() {
    const habits = await storage.getHabits();
    setHasHabits(habits.length > 0);
  }, []);

  useFocusEffect(
    useCallback(function() {
      refreshHabits();
    }, [refreshHabits])
  );

  return (
    <SafeAreaView edges={['right', 'left', 'top']} style={styles.safeArea}>
      <Tabs
        tabBar={function(props) { return <FloatingTabBar {...props} />; }}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon: function(params) {
              return <IconSymbol size={24} name="house.fill" color={params.focused ? '#1a1a1a' : params.color} />;
            },
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: '',
            tabBarIcon: function(params) {
              return <IconSymbol size={24} name="chart.bar.fill" color={params.focused ? '#1a1a1a' : params.color} />;
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '',
            tabBarIcon: function(params) {
              return <IconSymbol size={24} name="person.fill" color={params.focused ? '#1a1a1a' : params.color} />;
            },
          }}
        />
        {/* Hidden tabs */}
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="premium" options={{ href: null }} />
        <Tabs.Screen name="index-old" options={{ href: null }} />
        <Tabs.Screen name="index-old-backup" options={{ href: null }} />
        <Tabs.Screen name="[id]" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  );
}

const PRIMARY_TABS = ['index', 'progress', 'profile'];

function FloatingTabBar(props) {
  const state = props.state;
  const descriptors = props.descriptors;
  const navigation = props.navigation;

  return (
    <View style={styles.tabWrapper}>
      <BlurView intensity={35} tint="light" style={styles.tabBackground}>
        {state.routes.map(function(route, index) {
          if (!PRIMARY_TABS.includes(route.name)) {
            return null;
          }

          const isFocused = state.index === index;
          const options = descriptors[route.key].options;

          const color = isFocused ? '#1a1a1a' : '#B3B8C5';

          const onPress = function() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icon = options.tabBarIcon
            ? options.tabBarIcon({
                focused: isFocused,
                color: color,
                size: 24,
              })
            : <IconSymbol size={24} name="circle" color={color} />;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            >
              {icon}
            </TouchableOpacity>
          );
        })}
      </BlurView>

      <View style={styles.centerButtonWrapper}>
        <LinearGradient
          colors={['#FFB347', '#FF5F6D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.centerButtonGradient}
        >
          <TouchableOpacity
            style={styles.centerButton}
            onPress={function() {
              navigation.navigate('index');
              DeviceEventEmitter.emit('open-add-habit');
            }}
          >
            <IconSymbol size={20} name="plus" color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Platform.OS !== 'ios' ? '#000000ff' : '#F2F4FB',
  },
  tabWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 12 : 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 30,
    backgroundColor: '#FFFFFFEE',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: -28,
  },
  centerButtonGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5F6D',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
