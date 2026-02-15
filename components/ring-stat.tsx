import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatWorkoutDuration } from "@/lib/utils/format-rest";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type RingStatProps = {
  completedDays: number;
  totalDays: number;
  totalDurationSeconds: number | null;
  cycleIndex: number;
  programName?: string;
  onPress?: () => void;
};

const RING_SIZE = 62;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LIGHT_CARD_BG = "#F5F5F7";
const LIGHT_TEXT = "#2A2A2A";
const LIGHT_MUTED = "#5A5A5A";

const DARK_CARD_BG = "#1E1E24";
const DARK_TEXT = "#fff";
const DARK_MUTED = "#9ca3af";

export function RingStat({
  completedDays,
  totalDays,
  totalDurationSeconds,
  cycleIndex,
  programName,
  onPress,
}: RingStatProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const tint = colors.tint;
  const cardBg = isDark ? DARK_CARD_BG : LIGHT_CARD_BG;
  const tagBg = `${tint}20`;
  const tagText = tint;
  const progressBg = `${tint}20`;
  const textColor = isDark ? DARK_TEXT : LIGHT_TEXT;
  const mutedColor = isDark ? DARK_MUTED : LIGHT_MUTED;
  const ringTrack = isDark
    ? "rgba(255,255,255,0.20)"
    : "rgba(255, 255, 255, 0.56)";
  const ringFill = tint;

  const progress = totalDays > 0 ? Math.min(1, completedDays / totalDays) : 0;
  const percent = Math.round(progress * 100);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const hasNoData =
    completedDays === 0 &&
    (totalDurationSeconds === null || totalDurationSeconds === 0);

  const handlePress =
    onPress ?? (() => router.push("/(client)/program/history" as any));

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: { elevation: 2 },
            default: {},
          }),
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftContent}>
          <View style={[styles.tag, { backgroundColor: tagBg }]}>
            <Text style={[styles.tagText, { color: tagText }]}>
              {hasNoData ? "Fillo tani" : "Programi"}
            </Text>
          </View>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {programName ?? "Progresi yt"}
          </Text>
          <View style={styles.metaRow}>
            {hasNoData ? (
              <Text style={[styles.metaText, { color: mutedColor }]}>
                Nuk ke stërvitur ende
              </Text>
            ) : (
              <>
                <View style={styles.metaItem}>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={mutedColor}
                    style={styles.metaIcon}
                  />

                  <Text style={[styles.metaText, { color: mutedColor }]}>
                    {hasNoData
                      ? "Nuk ke stërvitur ende"
                      : formatWorkoutDuration(totalDurationSeconds)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons
                    name="emoji-events"
                    size={16}
                    color={mutedColor}
                    style={styles.metaIcon}
                  />
                <Text style={[styles.metaText, { color: mutedColor }]}>
                  Java {cycleIndex + 1}
                </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={[styles.progressWrap, { backgroundColor: progressBg }]}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={ringTrack}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={ringFill}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.ringCenter}>
              <Text style={[styles.percentText, { color: textColor }]}>
                {percent}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      {cardContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: Spacing.lg,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.xs,
  },
  tagText: {
    fontSize: Typography.small,
    fontWeight: "500",
  },
  title: {
    fontSize: Typography.titleLarge,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: Typography.small,
  },
  progressWrap: {
    width: RING_SIZE + 20,
    height: RING_SIZE + 20,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  svg: {
    position: "absolute",
  },
  ringCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  percentText: {
    fontSize: Typography.body,
    fontWeight: "700",
  },
});
