import { Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AppHeaderProps = {
  /** "Hi, {name}" on Home; screen title elsewhere */
  title?: string;
  /** Show personalized greeting instead of title */
  greeting?: string;
  /** Show back button and handle navigation */
  showBack?: boolean;
  /** Called when back is pressed; defaults to router.back() */
  onBack?: () => void;
  /** Larger title for main pages (list/detail); false for drill-down like workout day */
  largeTitle?: boolean;
  /** Optional element rendered on the right side of the header */
  rightAction?: React.ReactNode;
};

export function AppHeader({
  title,
  greeting,
  showBack,
  onBack,
  largeTitle,
  rightAction,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const displayText = greeting ?? title ?? "Ushtro";
  const paddingTop = Math.max(insets.top, Spacing.lg);
  const paddingBottom = Spacing.lg;

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop,
          paddingBottom,
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
              name={Platform.OS === "ios" ? "chevron-left" : "arrow-back"}
              size={Platform.OS === "ios" ? 28 : 24}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : null}
        <Text
          style={[
            largeTitle && !showBack ? styles.titleLarge : styles.title,
            {
              color: colors.text,
              flex: 1,
            },
          ]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {displayText}
        </Text>
        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.xs,
  },
  iconSpacer: {
    width: Spacing.lg,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: "600",
  },
  titleLarge: {
    fontSize: Typography.headline,
    fontWeight: "700",
  },
});
