import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { formatWorkoutDuration } from "@/lib/utils/format-rest";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type RingStatProps = {
  completedDays: number;
  totalDays: number;
  totalDurationSeconds: number | null;
  cycleIndex: number;
};

const RING_SIZE = 88;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RingStat({
  completedDays,
  totalDays,
  totalDurationSeconds,
  cycleIndex,
}: RingStatProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const progress = totalDays > 0 ? Math.min(1, completedDays / totalDays) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <BlurView
      intensity={40}
      tint={colorScheme === "dark" ? "dark" : "light"}
      style={[
        styles.container,
        {
          backgroundColor:
            colorScheme === "dark"
              ? "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,0.6)",
          borderColor: "rgba(255,255,255,0.15)",
        },
      ]}
    >
      <View style={styles.leftStat}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.tint}20` }]}>
          <MaterialIcons name="timer" size={20} color={colors.tint} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {formatWorkoutDuration(totalDurationSeconds)}
        </Text>
        <Text style={[styles.statLabel, { color: colors.icon }]}>
          Kohë totale
        </Text>
      </View>

      <View style={styles.centerRing}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colorScheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.tint}
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
            <Text style={[styles.ringValue, { color: colors.text }]}>
              {completedDays}/{totalDays}
            </Text>
            <Text style={[styles.ringLabel, { color: colors.icon }]}>Ditë</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightStat}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.tint}20` }]}>
          <MaterialIcons name="loop" size={20} color={colors.tint} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {cycleIndex} javë
        </Text>
        <Text style={[styles.statLabel, { color: colors.icon }]}>
          Java
        </Text>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  leftStat: {
    flex: 1,
    alignItems: "center",
  },
  centerRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginHorizontal: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  svg: {
    position: "absolute",
  },
  ringCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ringValue: {
    fontSize: Typography.bodyLarge,
    fontWeight: "700",
  },
  ringLabel: {
    fontSize: Typography.caption,
    marginTop: 2,
  },
  rightStat: {
    flex: 1,
    alignItems: "center",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.body,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: Typography.caption,
    marginTop: 2,
  },
});
