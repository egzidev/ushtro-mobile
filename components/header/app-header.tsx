import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Spacing, Typography } from '@/constants/theme';

type AppHeaderProps = {
  /** "Hi, {name}" on Home; screen title elsewhere */
  title?: string;
  /** Show personalized greeting instead of title */
  greeting?: string;
  /** Show back button and handle navigation */
  showBack?: boolean;
  /** Called when back is pressed; defaults to router.back() */
  onBack?: () => void;
};

export function AppHeader({ title, greeting, showBack, onBack }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const displayText = greeting ?? title ?? 'Ushtro';
  const paddingTop = Math.max(insets.top, Spacing.md);

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          paddingTop,
          paddingBottom: Spacing.md,
        },
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { minWidth: 44, minHeight: 44 }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Kthehu"
            accessibilityRole="button"
          >
            <MaterialIcons
              name={Platform.OS === 'ios' ? 'chevron-left' : 'arrow-back'}
              size={Platform.OS === 'ios' ? 28 : 24}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : null}
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              flex: 1,
              marginLeft: showBack ? 0 : Spacing.lg,
            },
          ]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {displayText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: '600',
  },
});
