import { Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ClientHeaderBlockProps = {
  userName?: string;
  avatarUrl?: string | null;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("sq-AL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ClientHeaderBlock({
  userName = "",
  avatarUrl,
}: ClientHeaderBlockProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, Spacing.md);

  const today = formatDate(new Date());
  const greeting = userName ? `Përshëndetje, ${userName}` : "Përshëndetje";

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        {
          paddingTop,
          paddingBottom: Spacing.lg,
          marginBottom: Spacing.md,
        },
      ])}
    >
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text
            style={StyleSheet.flatten([
              styles.greeting,
              { color: colors.text },
            ])}
            numberOfLines={1}
          >
            {greeting}
          </Text>
          <Text
            style={StyleSheet.flatten([styles.date, { color: colors.icon }])}
            numberOfLines={1}
          >
            {today}
          </Text>
        </View>
        <View
          style={StyleSheet.flatten([
            styles.avatarWrap,
            { backgroundColor: colors.card },
          ])}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Text
              style={StyleSheet.flatten([
                styles.avatarInitials,
                { color: colors.tint },
              ])}
            >
              {userName ? getInitials(userName) : "?"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 35;

const styles = StyleSheet.create({
  container: {
    // Horizontal padding comes from parent ScrollView content
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: Typography.title,
    fontWeight: "700",
  },
  date: {
    fontSize: Typography.medium,
    marginTop: Spacing.xs,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: Typography.body,
    fontWeight: "700",
  },
});
