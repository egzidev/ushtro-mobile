import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { WorkoutHistorySession } from "@/lib/api/workout-tracking";
import { formatDateDDMMM, formatWorkoutDuration } from "@/lib/utils/format-rest";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { type Href, Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SessionCardProps = {
  session: WorkoutHistorySession;
};

export function SessionCard({ session }: SessionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const cardBg = isDark ? "#1e1e24" : "#fff";
  const textColor = isDark ? "#fff" : "#1a1a1a";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";

  return (
    <Link
      href={`/(client)/program/history/${session.id}` as Href}
      asChild
    >
      <TouchableOpacity
        style={StyleSheet.flatten([styles.sessionCard, { backgroundColor: cardBg }])}
        activeOpacity={0.8}
      >
        <View style={StyleSheet.flatten([styles.sessionThumb, { backgroundColor: mutedColor + "26" }])}>
          {session.thumbnailUrl ? (
            <Image
              source={{ uri: session.thumbnailUrl }}
              style={styles.sessionThumbImage}
              contentFit="cover"
            />
          ) : (
            <MaterialIcons name="fitness-center" size={28} color={colors.tint} />
          )}
        </View>
        <View style={styles.sessionContent}>
          <Text
            style={StyleSheet.flatten([styles.sessionTitle, { color: textColor }])}
            numberOfLines={1}
          >
            {session.dayTitle}
          </Text>
          <Text style={StyleSheet.flatten([styles.metaText, { color: mutedColor }])}>
            {formatWorkoutDuration(session.totalSeconds)} · {formatDateDDMMM(session.completedAt)}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={mutedColor} />
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  sessionThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  sessionThumbImage: { width: "100%", height: "100%" },
  sessionContent: {
    flex: 1,
    minWidth: 0,
  },
  sessionTitle: {
    fontSize: Typography.body,
    fontWeight: "600",
  },
  metaText: {
    fontSize: Typography.small,
    marginTop: Spacing.xs,
  },
});
