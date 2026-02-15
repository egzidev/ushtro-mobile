import { Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatWorkoutDuration } from "@/lib/utils/format-rest";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

type WeekStatsCardProps = {
  workoutCount: number;
  totalDurationSeconds: number;
  weekLabel: string;
};

const LIGHT_SECTION_BG = "#fff";
const DARK_SECTION_BG = "#1a1a1e";

function StatItem({
  label,
  value,
  textColor,
  mutedColor,
}: {
  label: string;
  value: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

export function WeekStatsCard({
  workoutCount,
  totalDurationSeconds,
  weekLabel,
}: WeekStatsCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const textColor = isDark ? "#fff" : "#1a1a1a";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const sectionBg = isDark ? DARK_SECTION_BG : LIGHT_SECTION_BG;

  const hasWorkouts = workoutCount > 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: sectionBg },
        Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
          },
          android: { elevation: 1 },
          default: {},
        }),
      ]}
    >
      {hasWorkouts ? (
        <View style={styles.statsRow}>
          <StatItem
            label="Stërvitje"
            value={String(workoutCount)}
            textColor={textColor}
            mutedColor={mutedColor}
          />
          <StatItem
            label="Kohëzgjatja"
            value={formatWorkoutDuration(totalDurationSeconds)}
            textColor={textColor}
            mutedColor={mutedColor}
          />
          <StatItem
            label="Vëllimi"
            value="-"
            textColor={textColor}
            mutedColor={mutedColor}
          />
        </View>
      ) : (
        <Text style={[styles.emptyHint, { color: mutedColor }]}>
          Nuk ke përfunduar asnjë stërvitje këtë javë
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  weekLabel: {
    fontSize: Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: Typography.small,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.bodyLarge,
    fontWeight: "700",
  },
  emptyHint: {
    fontSize: Typography.body,
  },
});
