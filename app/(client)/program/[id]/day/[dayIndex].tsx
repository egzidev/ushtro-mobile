import { DayWorkoutBody } from "@/components/day-workout-body";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDayWorkout } from "@/hooks/use-day-workout";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DayWorkoutScreen() {
  const { id, dayIndex } = useLocalSearchParams<{ id: string; dayIndex: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const dayIdx = parseInt(dayIndex ?? "0", 10) || 0;

  const {
    program,
    loading,
    selectedDay,
    workoutStarted,
    workoutLoading,
    activeWorkout,
    elapsedSeconds,
    effectiveCompletedSets,
    startWorkout,
    onFinishWorkout,
    toggleSetComplete,
    pauseActiveWorkout,
    resumeActiveWorkout,
    formatDuration,
    openVideo,
  } = useDayWorkout(id, dayIdx, {
    onLoadError: () => router.back(),
    onFinish: (sessionId) =>
      router.replace(`/(client)/program/history/${sessionId}` as any),
  });

  if (loading || !program) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!selectedDay) {
    router.back();
    return null;
  }

  const headerPaddingTop = Math.max(insets.top, Spacing.lg);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.dayHeader,
          {
            backgroundColor: colors.background,
            paddingTop: headerPaddingTop,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.dayHeaderLeft}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Kthehu"
          accessibilityRole="button"
        >
          <MaterialIcons
            name="keyboard-arrow-down"
            size={32}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.dayHeaderCenterWrap}>
          <Text
            style={[styles.dayHeaderCenter, { color: colors.text }]}
            numberOfLines={1}
          >
            {formatDuration(elapsedSeconds)}
          </Text>
        </View>
        {workoutStarted ? (
          <View style={styles.dayHeaderRight}>
            <TouchableOpacity
              onPress={onFinishWorkout}
              disabled={workoutLoading}
              style={[
                styles.headerFinishButton,
                { backgroundColor: colors.tint },
                workoutLoading && { opacity: 0.6 },
              ]}
              activeOpacity={0.85}
            >
              <MaterialIcons name="flag" size={18} color="#fff" />
              <Text style={styles.headerFinishText}>Përfundo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dayHeaderRightPlaceholder} />
        )}
      </View>
      <DayWorkoutBody
        selectedDay={selectedDay}
        colors={colors}
        workoutStarted={workoutStarted}
        effectiveCompletedSets={effectiveCompletedSets}
        toggleSetComplete={toggleSetComplete}
        openVideo={openVideo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dayHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    height: 44,
  },
  dayHeaderLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: "center",
    zIndex: 1,
  },
  dayHeaderCenterWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  dayHeaderCenter: {
    fontSize: Typography.title,
    fontWeight: "700",
  },
  dayHeaderRight: {
    position: "absolute",
    right: 0,
    minHeight: 44,
    justifyContent: "center",
  },
  dayHeaderRightPlaceholder: {
    position: "absolute",
    right: 0,
    width: 80,
    height: 44,
  },
  headerFinishButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  headerFinishText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
