import { Tabs } from 'expo-router';
import React from 'react';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { Route } from '@react-navigation/native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppHeader } from '@/components/header/app-header';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

function getTabBarVisibility(route: Partial<Route<string>>) {
  const name = getFocusedRouteNameFromRoute(route);
  return name === '[id]' ? 'none' : 'flex';
}

export default function ClientTabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '';

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
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
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('program', { screen: 'index' });
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
  );
}
