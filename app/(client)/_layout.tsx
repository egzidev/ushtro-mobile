import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { Route } from '@react-navigation/native';
import { View } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppHeader } from '@/components/header/app-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { useWorkoutStore } from '@/lib/stores/workout-store';
import { WorkoutFloatingCard } from '@/components/workout-floating-card';
import { WorkoutDayDrawer } from '@/components/workout-day-drawer';

function getTabBarVisibility(route: Partial<Route<string>>) {
  const name = getFocusedRouteNameFromRoute(route);
  return name === '[id]' ? 'none' : 'flex';
}

export default function ClientTabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const rehydrateActiveWorkout = useWorkoutStore((s) => s.rehydrateActiveWorkout);

  useEffect(() => {
    rehydrateActiveWorkout();
  }, [rehydrateActiveWorkout]);
  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '';
  const router = useRouter();
  const segments = useSegments() as string[];
  const isOnDayScreen = segments.includes('day');
  const workoutDrawerOpen = useWorkoutStore((s) => s.workoutDrawerOpen);
  const hideFloatingCard = isOnDayScreen || workoutDrawerOpen;

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          display: getTabBarVisibility(route),
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarButton: HapticTab,
        header: ({ options }) => (
          <AppHeader
            title={options.title}
            greeting={route.name === 'index' && userName ? `Hi, ${userName}` : undefined}
            largeTitle
          />
        ),
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kryefaqja',
          tabBarLabel: 'Kryefaqja',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="program"
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/(client)/program');
          },
        })}
        options={{
          title: 'Ushtrimet',
          tabBarLabel: 'Ushtrimet',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="dumbbell.fill" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Ushqimi',
          tabBarLabel: 'Ushqimi',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="fork.knife" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profili',
          tabBarLabel: 'Profili',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
    <WorkoutFloatingCard hide={hideFloatingCard} />
    <WorkoutDayDrawer />
    </View>
  );
}
