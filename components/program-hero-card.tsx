import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
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
  todayDay: number;
  totalDays: number;
  exerciseCount: number;
  estimatedMinutes?: number;
  completedDays: number;
  imageUrl?: string | null;
};

export function ProgramHeroCard({
  programId,
  programName,
  todayDay,
  totalDays,
  exerciseCount,
  estimatedMinutes,
  completedDays,
  imageUrl,
}: ProgramHeroCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isCompleted = totalDays > 0 && completedDays >= totalDays;

  const isStarting = todayDay === 1 && completedDays === 0;
  const ctaLabel = isStarting ? "Fillo" : "Vazhdo";
  const ctaColor = isStarting ? "#000000" : colors.tint;

  const duration = estimatedMinutes ?? Math.max(15, exerciseCount * 4);
  const progress = totalDays > 0 ? completedDays / totalDays : 0;

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
      </View>

      <View style={styles.content}>
        <Text
          style={RNStyleSheet.flatten([styles.title, { color: colors.text }])}
          numberOfLines={2}
        >
          {programName}
        </Text>

        <View style={styles.metaRow}>
          <Text
            style={RNStyleSheet.flatten([
              styles.metaLabel,
              { color: colors.icon },
            ])}
          >
            Sot: Ditë {todayDay}
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
            <View
              style={RNStyleSheet.flatten([
                styles.progressTrack,
                { backgroundColor: `${colors.icon}25` },
              ])}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, progress * 100)}%`,
                    backgroundColor: colors.tint,
                  },
                ]}
              />
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
          <View style={styles.ctaRow}>
            <View
              style={RNStyleSheet.flatten([
                styles.completedBadge,
                { backgroundColor: `${colors.tint}20` },
              ])}
            >
              <Text
                style={RNStyleSheet.flatten([
                  styles.completedText,
                  { color: colors.tint },
                ])}
              >
                Përfunduar ✓
              </Text>
            </View>
            <Link href={`/(client)/program/${programId}`} asChild>
              <TouchableOpacity
                style={RNStyleSheet.flatten([
                  styles.primaryButton,
                  { backgroundColor: colors.tint },
                ])}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Shiko sërish</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          <Link href={`/(client)/program/${programId}`} asChild>
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
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.caption,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
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
