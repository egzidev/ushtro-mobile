import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Pressable,
} from 'react-native';
import { Radius, Shadows, Spacing, TOUCH_TARGET_MIN } from '@/constants/theme';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Use when card is tappable; ensures min touch target */
  padded?: boolean;
};

export function Card({ children, onPress, style, contentStyle, padded = true }: CardProps) {
  const containerStyle = [
    styles.card,
    padded && styles.padded,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyle,
          pressed && styles.pressed,
          style,
        ]}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={[...containerStyle, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadows,
  },
  padded: {
    padding: Spacing.lg,
  },
  content: {},
  pressed: {
    opacity: 0.9,
  },
});
