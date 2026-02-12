import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, Link } from "expo-router";
import React from "react";
import {
  StyleSheet as RNStyleSheet,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ProgramHeroCardProps = {
  programId: string;
  programName: string;
  nextDay: number; // 1-based display "Dita X"
  totalDays: number;
  exerciseCount: number;
  estimatedMinutes?: number;
  completedDays: number;
  cycleIndex?: number;
  allComplete?: boolean;
  nextDayIndex?: number; // 0-based for deep link
  dayItems?: Array<{ is_rest_day?: boolean }>; // ordered days, for rest-day squares
  imageUrl?: string | null;
};

export function ProgramHeroCard({
  programId,
  programName,
  nextDay,
  totalDays,
  exerciseCount,
  estimatedMinutes,
  completedDays,
  cycleIndex = 0,
  allComplete = false,
  nextDayIndex = 0,
  dayItems,
  imageUrl,
}: ProgramHeroCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isCompleted =
    allComplete || (totalDays > 0 && completedDays >= totalDays);

  const isStarting = completedDays === 0;
  const ctaLabel = isStarting ? "Fillo" : "Vazhdo";
  const ctaColor = isStarting ? "#22c55e" : colors.tint;
  const programHref =
    `/(client)/program/${programId}${nextDayIndex > 0 ? `?day=${nextDayIndex}` : ""}` as Href;

  const duration = estimatedMinutes ?? Math.max(15, exerciseCount * 4);

  return (
    <View
      style={RNStyleSheet.flatten([
        styles.card,
        { backgroundColor: colors.card },
      ])}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View
            style={RNStyleSheet.flatten([
              styles.placeholder,
              { backgroundColor: `${colors.tint}25` },
            ])}
          />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {isCompleted && (
          <>
            <LinearGradient
              colors={[
                "rgba(234,179,8,0.25)",
                "rgba(234,179,8,0.08)",
                "transparent",
              ]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.completeBadge} pointerEvents="none">
              <View
                style={RNStyleSheet.flatten([
                  styles.trophyIconWrap,
                  { backgroundColor: "rgba(234,179,8,0.3)" },
                ])}
              >
                <MaterialIcons name="emoji-events" size={40} color="#eab308" />
              </View>
              {cycleIndex === 0 && (
                <View
                  style={RNStyleSheet.flatten([
                    styles.cycleBadge,
                    { backgroundColor: "rgba(234,179,8,0.2)" },
                  ])}
                >
                  <Text style={styles.cycleBadgeText}>Java 1</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.content}>
        <Text
          style={RNStyleSheet.flatten([styles.title, { color: colors.text }])}
          numberOfLines={2}
        >
          {programName}
        </Text>

        <View style={styles.metaRow}>
          {cycleIndex > 0 && (
            <Text
              style={RNStyleSheet.flatten([
                styles.metaLabel,
                { color: colors.icon },
              ])}
            >
              Cikli {cycleIndex}
            </Text>
          )}
          <Text
            style={RNStyleSheet.flatten([
              styles.metaLabel,
              { color: colors.icon },
            ])}
          >
            {isCompleted ? `Ditë ${totalDays}` : `Dita tjetër: ${nextDay}`}
          </Text>
          <Text
            style={RNStyleSheet.flatten([
              styles.metaLabel,
              { color: colors.icon },
            ])}
          >
            {exerciseCount} ushtrime
          </Text>
          <Text
            style={RNStyleSheet.flatten([
              styles.metaLabel,
              { color: colors.icon },
            ])}
          >
            ~{duration} min
          </Text>
        </View>

        {totalDays > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.daySquaresRow}>
              {(
                dayItems ??
                Array.from({ length: totalDays }, () => ({
                  is_rest_day: false,
                }))
              ).map((day, i) => {
                if (day.is_rest_day) {
                  return (
                    <View
                      key={i}
                      style={RNStyleSheet.flatten([
                        styles.daySquare,
                        styles.restDaySquare,
                        {
                          backgroundColor:
                            colorScheme === "dark"
                              ? "rgba(107,114,128,0.3)"
                              : "rgba(229,231,235,0.9)",
                        },
                      ])}
                    >
                      <MaterialIcons name="bed" size={8} color={colors.icon} />
                    </View>
                  );
                }
                const workoutIndex = (dayItems ?? [])
                  .slice(0, i)
                  .filter((d) => !d.is_rest_day).length;
                const filled = workoutIndex < completedDays;
                return (
                  <View
                    key={i}
                    style={RNStyleSheet.flatten([
                      styles.daySquare,
                      filled
                        ? { backgroundColor: colors.tint }
                        : {
                            backgroundColor:
                              colorScheme === "dark"
                                ? "rgba(107,114,128,0.4)"
                                : "rgba(229,231,235,0.9)",
                          },
                    ])}
                  />
                );
              })}
            </View>
            <Text
              style={RNStyleSheet.flatten([
                styles.progressText,
                { color: colors.icon },
              ])}
            >
              {completedDays} / {totalDays} ditë
            </Text>
          </View>
        )}

        {isCompleted ? (
          <View style={styles.completedSection}>
            <Link href={`/(client)/program/${programId}` as Href} asChild>
              <TouchableOpacity
                style={RNStyleSheet.flatten([
                  styles.primaryButton,
                  { backgroundColor: "#eab308" },
                ])}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: "#1c1917" },
                  ]}
                >
                  Rifillo programin
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <Link href={programHref} asChild>
            <TouchableOpacity
              style={RNStyleSheet.flatten([
                styles.primaryButton,
                { backgroundColor: ctaColor },
              ])}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{ctaLabel}</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  imageWrap: {
    height: 200,
    position: "relative",
  },
  completeBadge: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  trophyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cycleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  cycleBadgeText: {
    color: "#eab308",
    fontSize: Typography.small,
    fontWeight: "700",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.titleLarge,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaLabel: {
    fontSize: Typography.small,
  },
  progressWrap: {
    marginBottom: Spacing.lg,
  },
  daySquaresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.xs,
  },
  daySquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  restDaySquare: {},
  progressText: {
    fontSize: Typography.caption,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  completedSection: {
    gap: Spacing.sm,
  },
  completedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  completedText: {
    fontSize: Typography.small,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: Typography.body,
    fontWeight: "700",
  },
});
