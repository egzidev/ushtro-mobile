import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatWorkoutDuration } from "@/lib/utils/format-rest";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DayCardProps = {
  dayTitle: string;
  imageUrl: string | null;
  exerciseCount: number;
  isRestDay: boolean;
  isCompleted: boolean;
  /** Duration in seconds when completed */
  completedDurationSeconds?: number | null;
  isSelected?: boolean;
  onPress: () => void;
};

export function DayCard({
  dayTitle,
  imageUrl,
  exerciseCount,
  isRestDay,
  isCompleted,
  completedDurationSeconds,
  isSelected,
  onPress,
}: DayCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={isRestDay ? undefined : onPress}
      disabled={isRestDay}
      style={[
        styles.card,
        { backgroundColor: colors.card },
        colorScheme === "dark" && {
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.02)",
        },
        isSelected && { borderWidth: 2, borderColor: colors.tint },
      ]}
    >
      <View style={[styles.cardInner, { borderRadius: Radius.lg }]}>
        <View style={styles.imageWrap}>
          {isRestDay ? (
            <View style={styles.restDayWrap}>
              <LinearGradient
                colors={
                  colorScheme === "dark"
                    ? ["#1a1a1a", "#0d0d0d", "#050505"]
                    : ["#2d2d2d", "#1a1a1a", "#0f0f0f"]
                }
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={[styles.image, styles.restDayImage]}
                  contentFit="cover"
                />
              ) : null}
              <View style={styles.restDayContent} pointerEvents="none">
                <View style={styles.restDayCenter}>
                  <View style={styles.restDayIconWrap}>
                    <BlurView
                      intensity={40}
                      tint={colorScheme === "dark" ? "dark" : "light"}
                      style={[
                        styles.restDayIconBox,
                        {
                          borderColor: "rgba(255,255,255,0.25)",
                          backgroundColor: "rgba(255,255,255,0.1)",
                        },
                      ]}
                    >
                      <MaterialIcons name="bed" size={28} color="#fff" />
                    </BlurView>
                  </View>
                  <Text style={[styles.restDayTitle, { color: "#fff" }]}>
                    {dayTitle}
                  </Text>
                  <View style={styles.restDayBottomBadge}>
                    <BlurView
                      intensity={50}
                      tint={colorScheme === "dark" ? "dark" : "light"}
                      style={[
                        styles.glassBadgeSmall,
                        {
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.03)",
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="dark-mode"
                        size={12}
                        color="rgba(255,255,255,0.95)"
                      />
                      <Text
                        style={[
                          styles.restDayBottomBadgeText,
                          { color: "rgba(255,255,255,0.95)" },
                        ]}
                      >
                        Muskujt riparohen gjatë gjumit
                      </Text>
                    </BlurView>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.placeholder,
                    { backgroundColor: `${colors.tint}20` },
                  ]}
                >
                  <MaterialIcons
                    name="fitness-center"
                    size={40}
                    color={colors.tint}
                  />
                </View>
              )}
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.3)",
                  "rgba(0,0,0,0.30)",
                ]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.overlay} pointerEvents="none">
                <Text style={styles.title} numberOfLines={2}>
                  {dayTitle}
                </Text>
                <View style={styles.badgesRow}>
                  {exerciseCount > 0 && (
                    <View style={styles.badgeWrap}>
                      <BlurView
                        intensity={60}
                        tint={colorScheme === "dark" ? "dark" : "light"}
                        style={[styles.badgeBlur, styles.glassBadgeBorder]}
                      >
                        <Text style={styles.badgeText}>
                          {exerciseCount} ushtrim
                          {exerciseCount !== 1 ? "e" : ""}
                        </Text>
                      </BlurView>
                    </View>
                  )}
                  {isCompleted && completedDurationSeconds != null && (
                    <View style={styles.badgeWrap}>
                      <BlurView
                        intensity={60}
                        tint={colorScheme === "dark" ? "dark" : "light"}
                        style={[styles.badgeBlur, styles.glassBadgeBorder]}
                      >
                        <Text style={styles.badgeText}>
                          {formatWorkoutDuration(completedDurationSeconds)}
                        </Text>
                      </BlurView>
                    </View>
                  )}
                </View>
              </View>
              {isCompleted && (
                <View style={styles.doneBadge} pointerEvents="none">
                  <MaterialIcons
                    name="check-circle"
                    size={28}
                    color="#22c55e"
                  />
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
  },
  cardInner: {
    overflow: "hidden",
  },
  imageWrap: {
    height: 160,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.bodyLarge,
    fontWeight: "600",
    color: "#fff",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  badgeWrap: {
    overflow: "hidden",
    borderRadius: Radius.sm,
  },
  badgeBlur: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    overflow: "hidden",
    borderRadius: Radius.sm,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  glassBadgeBorder: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  glassBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    overflow: "hidden",
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  glassBadgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    overflow: "hidden",
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  restDayWrap: {
    flex: 1,
    position: "relative",
  },
  restDayImage: {
    opacity: 0.4,
  },
  restDayContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  restDayTopBadge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.lg,
    zIndex: 1,
  },
  restDayTopBadgeText: {
    fontSize: 12,
    fontWeight: "400",
  },
  restDayCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  restDayIconWrap: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  restDayIconGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    top: -4,
    left: -4,
  },
  restDayIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  restDayTitle: {
    fontSize: Typography.bodyLarge,
    fontWeight: "400",
  },
  restDayBottomBadge: {
    marginTop: Spacing.sm,
  },
  restDayBottomBadgeText: {
    fontSize: 12,
    fontWeight: "400",
  },
  badgeText: {
    fontSize: Typography.small,
    color: "#fff",
    fontWeight: "600",
  },
  doneBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
});
