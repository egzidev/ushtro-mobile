/**
 * Design tokens: colors, spacing, typography, shadows.
 * Follows mobile UI/UX best practices (44px touch targets, readable fonts, consistent spacing).
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563eb';
const tintColorDark = '#60a5fa';

/** Spacing scale (4px base) */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Typography scale */
export const Typography = {
  caption: 11,
  small: 12,
  body: 14,
  bodyLarge: 16,
  title: 18,
  titleLarge: 20,
  headline: 22,
  display: 26,
} as const;

/** Minimum touch target (44px per Apple HIG / Android) */
export const TOUCH_TARGET_MIN = 44;

/** Border radius */
export const Radius = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 28,
  full: 9999,
} as const;

/** Card shadow / elevation */
export const Shadows = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

export const Colors = {
  light: {
    text: '#000',
    background: '#f0f0f0',
    card: '#fff',
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#0a0a0d',
    card: '#1a1a1e',
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
