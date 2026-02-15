import {
  Colors,
  Radius,
  Spacing,
  TOUCH_TARGET_MIN,
  Typography,
} from "@/constants/theme";
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

type DayItem = {
  is_rest_day?: boolean;
  day_index?: number;
  exerciseCount?: number;
};

type ProgramHeroCardProps = {
  programId: string;
  programName: string;
  nextDay: number;
  totalDays: number;
  exerciseCount: number;
  estimatedMinutes?: number;
  completedDays: number;
  cycleIndex?: number;
  allComplete?: boolean;
  nextDayIndex?: number;
  dayItems?: DayItem[];
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
              <View style={styles.trophyRow}>
                {Array.from({ length: Math.min(cycleIndex || 1, 5) }).map(
                  (_, i) => (
                    <MaterialIcons
                      key={i}
                      name="emoji-events"
                      size={32}
                      color="#eab308"
                    />
                  ),
                )}
              </View>
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

        {totalDays > 0 &&
          (() => {
            const items =
              dayItems ??
              Array.from({ length: totalDays }, (_, i) => ({
                is_rest_day: false,
                day_index: i,
                exerciseCount: 1,
              }));
            let workoutCountBefore = 0;
            return (
              <>
                <View style={styles.daysRow}>
                  {items.map((day, i) => {
                    const isRestDay = day.is_rest_day ?? false;
                    const isCurrent = i === nextDayIndex;
                    let isCompleted = false;
                    if (!isRestDay) {
                      isCompleted = workoutCountBefore < completedDays;
                      workoutCountBefore++;
                    }
                    const dayNum = i + 1;
                    const bg = isRestDay
                      ? "#000"
                      : isCurrent
                        ? colors.tint
                        : colorScheme === "dark"
                          ? "rgba(107,114,128,0.35)"
                          : "rgba(229,231,235,0.95)";
                    return (
                      <View key={i} style={styles.dayItem}>
                        <View style={styles.dayCircleOuter}>
                          <View
                            style={RNStyleSheet.flatten([
                              styles.dayCircle,
                              { backgroundColor: bg },
                            ])}
                          >
                            {isRestDay ? (
                              <MaterialIcons
                                name="bed"
                                size={16}
                                color="rgba(255,255,255,0.8)"
                              />
                            ) : (
                              <Text
                                style={RNStyleSheet.flatten([
                                  styles.dayNum,
                                  {
                                    color:
                                      isRestDay || isCurrent ? "#fff" : colors.text,
                                  },
                                ])}
                              >
                                D{dayNum}
                              </Text>
                            )}
                          </View>
                          {!isRestDay && (
                            <View
                              style={RNStyleSheet.flatten([
                                styles.dayBadge,
                                {
                                  backgroundColor: isCompleted
                                    ? "#22c55e"
                                    : colorScheme === "dark"
                                      ? "rgba(107,114,128,0.6)"
                                      : "rgba(156,163,175,0.8)",
                                },
                              ])}
                            >
                              {isCompleted ? (
                                <MaterialIcons
                                  name="check"
                                  size={10}
                                  color="#fff"
                                />
                              ) : null}
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <MaterialIcons
                      name="bolt"
                      size={18}
                      color={colors.tint}
                      style={styles.statIcon}
                    />
                    <View>
                      <Text
                        style={RNStyleSheet.flatten([
                          styles.statValue,
                          { color: colors.text },
                        ])}
                      >
                        {cycleIndex + 1}
                      </Text>
                      <Text
                        style={RNStyleSheet.flatten([
                          styles.statLabel,
                          { color: colors.icon },
                        ])}
                      >
                        Java aktuale
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statItem}>
                    <View
                      style={RNStyleSheet.flatten([
                        styles.statCircle,
                        { borderColor: colors.tint },
                      ])}
                    >
                      <MaterialIcons
                        name="bolt"
                        size={16}
                        color={colors.tint}
                      />
                    </View>
                    <View>
                      <Text
                        style={RNStyleSheet.flatten([
                          styles.statValue,
                          { color: colors.text },
                        ])}
                      >
                        {completedDays} / {totalDays}
                      </Text>
                      <Text
                        style={RNStyleSheet.flatten([
                          styles.statLabel,
                          { color: colors.icon },
                        ])}
                      >
                        Ditë ushtrime
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            );
          })()}

        <Link
          href={
            isCompleted
              ? (`/(client)/program/${programId}?day=0&restart=1` as Href)
              : programHref
          }
          asChild
        >
          <TouchableOpacity
            style={RNStyleSheet.flatten([
              styles.primaryButton,
              {
                backgroundColor: completedDays >= 1 ? colors.tint : ctaColor,
              },
            ])}
            activeOpacity={0.8}
          >
            <Text
              style={styles.primaryButtonText}
              allowFontScaling={true}
              numberOfLines={1}
            >
              {completedDays >= 1 ? "Vazhdo" : ctaLabel}
            </Text>
          </TouchableOpacity>
        </Link>
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
    height: 260,
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
  trophyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    alignSelf: "flex-start",
  },
  dayItem: {
    alignItems: "center",
  },
  dayCircleOuter: {
    position: "relative",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  dayBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  dayNum: {
    fontSize: Typography.caption,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statIcon: {},
  statCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: Typography.body,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: Typography.caption,
    marginTop: 2,
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: TOUCH_TARGET_MIN,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: Typography.body,
    fontWeight: "700",
  },
});
