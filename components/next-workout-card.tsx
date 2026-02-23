import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet as RNStyleSheet,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NextWorkoutCardProps = {
  programId: string;
  programName: string;
  dayIndex: number;
  dayLabel: string;
  isRestDay: boolean;
  imageUrl: string | null;
  exerciseCount: number;
};

export function NextWorkoutCard({
  programId,
  programName,
  dayIndex,
  dayLabel,
  isRestDay,
  imageUrl,
  exerciseCount,
}: NextWorkoutCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={
        isRestDay
          ? undefined
          : () =>
              router.push(
                `/(client)/program/${programId}/overview/${dayIndex}` as any,
              )
      }
      disabled={isRestDay}
      style={RNStyleSheet.flatten([
        styles.card,
        { backgroundColor: colors.card },
        Shadows,
      ])}
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
                      intensity={50}
                      tint={colorScheme === "dark" ? "dark" : "light"}
                      style={[
                        styles.restDayIconBox,
                        {
                          borderColor: "rgba(255,255,255,0.35)",
                          backgroundColor: "rgba(255,255,255,0.2)",
                        },
                      ]}
                    >
                      <MaterialIcons name="bed" size={36} color="#fff" />
                    </BlurView>
                  </View>
                  <Text style={[styles.restDayTitle, { color: "#fff" }]}>
                    {dayLabel}
                  </Text>
                  <View style={styles.restDayBottomBadge}>
                    <BlurView
                      intensity={50}
                      tint={colorScheme === "dark" ? "dark" : "light"}
                      style={[
                        styles.glassBadgeSmall,
                        {
                          borderColor: "rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.12)",
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
                  style={RNStyleSheet.flatten([
                    styles.placeholder,
                    { backgroundColor: `${colors.tint}25` },
                  ])}
                >
                  <MaterialIcons
                    name="fitness-center"
                    size={48}
                    color={colors.tint}
                  />
                </View>
              )}
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.4)",
                  "rgba(0,0,0,0.45)",
                ]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.overlayContent} pointerEvents="none">
                <Text style={styles.dayLabel} numberOfLines={2}>
                  {dayLabel}
                </Text>
                {exerciseCount > 0 && (
                  <View style={styles.badgeWrap}>
                    <BlurView
                      intensity={60}
                      tint={colorScheme === "dark" ? "dark" : "light"}
                      style={[styles.badgeBlur, styles.glassBadgeBorder]}
                    >
                      <Text style={styles.exerciseCount}>
                        {exerciseCount} ushtrim{exerciseCount !== 1 ? "e" : ""}
                      </Text>
                    </BlurView>
                  </View>
                )}
                <View
                  style={[styles.filloButton, { backgroundColor: colors.tint }]}
                >
                  <MaterialIcons
                    name="play-arrow"
                    size={22}
                    color="#fff"
                  />
                  <Text style={styles.filloButtonText}>Fillo ushtrimin</Text>
                </View>
              </View>
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
    height: 240,
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
  upNextBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.lg,
    zIndex: 2,
    overflow: "hidden",
    borderRadius: Radius.full,
  },
  upNextPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  upNextText: {
    fontSize: Typography.small,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  dayLabel: {
    fontSize: Typography.display,
    color: "#fff",
    fontWeight: "600",
  },
  badgeWrap: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    alignSelf: "flex-start",
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
  exerciseCount: {
    fontSize: Typography.small,
    color: "#fff",
    fontWeight: "600",
  },
  filloButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filloButtonText: {
    fontSize: Typography.body,
    fontWeight: "700",
    color: "#fff",
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
  glassBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    overflow: "hidden",
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  restDayTopBadgeText: {
    fontSize: 12,
    fontWeight: "400",
    marginLeft: 6,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    top: -4,
    left: -4,
  },
  restDayIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  restDayTitle: {
    fontSize: Typography.headline,
    fontWeight: "400",
    marginTop: 4,
  },
  restDayBottomBadge: {
    marginTop: Spacing.sm,
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
  },
  restDayBottomBadgeText: {
    fontSize: 12,
    fontWeight: "400",
    marginLeft: 6,
  },
});
