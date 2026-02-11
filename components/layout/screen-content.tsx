import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';

type ScreenContentProps = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Additional bottom inset (e.g. for tab bar) */
  bottomInset?: number;
};

export function ScreenContent({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  bottomInset = 0,
}: ScreenContentProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Spacing.lg) + bottomInset;
  const containerPadding = [styles.content, { paddingBottom }];

  if (scroll) {
    return (
      <ScrollView
        style={[styles.scroll, style]}
        contentContainerStyle={[containerPadding, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.container, containerPadding, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
