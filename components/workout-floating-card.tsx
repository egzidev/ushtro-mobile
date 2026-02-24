import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkoutStore } from "@/lib/stores/workout-store";
import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function useElapsedSeconds() {
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activeWorkout || activeWorkout.pausedAt !== null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.sessionId, activeWorkout?.pausedAt]);
  if (!activeWorkout) return 0;
  const elapsedMs =
    activeWorkout.pausedAt !== null
      ? activeWorkout.pausedAt - activeWorkout.startTime - activeWorkout.totalPausedMs
      : now - activeWorkout.startTime - activeWorkout.totalPausedMs;
  return Math.floor(elapsedMs / 1000);
}

const TAB_BAR_OFFSET = 56;
const ORANGE_TIMER = "#f97316";

/** Current day's first exercise video thumbnail from store */
function useActiveDayThumbnail(programId: string, dayIndex: number): string | null {
  const programs = useWorkoutStore((s) => s.programs);
  const cp = programs.find((p) => p.program_id === programId);
  const prog = cp?.programs;
  const days = prog?.program_days
    ? [...prog.program_days].sort(
        (a, b) => (a.day_index ?? 0) - (b.day_index ?? 0)
      )
    : [];
  const day = days[dayIndex];
  const content = day?.program_exercises?.[0]?.content;
  return getContentThumbnailUrl(content ?? undefined) ?? null;
}

/** Day summary: total set count and reps for the given day (e.g. "12 set · 10 përsëritje") */
function useDaySummary(programId: string, dayIndex: number): string {
  const programs = useWorkoutStore((s) => s.programs);
  const cp = programs.find((p) => p.program_id === programId);
  const prog = cp?.programs;
  const days = prog?.program_days
    ? [...prog.program_days].sort(
        (a, b) => (a.day_index ?? 0) - (b.day_index ?? 0)
      )
    : [];
  const day = days[dayIndex];
  if (!day) return "";
  if (day.is_rest_day) return "Ditë pushimi";
  const exercises = day.program_exercises ?? [];
  if (exercises.length === 0) return "";

  let totalSets = 0;
  const repsValues: string[] = [];
  for (const ex of exercises) {
    const sets = (ex as { program_exercise_sets?: Array<{ reps: string | null }>; sets?: number | null }).program_exercise_sets;
    const reps = (ex as { reps?: string | null }).reps;
    if (sets?.length) {
      totalSets += sets.length;
      for (const s of sets) {
        if (s.reps) repsValues.push(s.reps);
      }
    } else {
      const n = (ex as { sets?: number | null }).sets ?? 1;
      totalSets += n;
      if (reps) repsValues.push(reps);
    }
  }
  if (totalSets === 0) return "";

  const setLabel = totalSets === 1 ? "1 set" : `${totalSets} set`;
  const uniqueReps = [...new Set(repsValues)];
  if (uniqueReps.length === 0) return setLabel;
  if (uniqueReps.length === 1) return `${setLabel} · ${uniqueReps[0]} përsëritje`;
  return setLabel;
}

export function WorkoutFloatingCard({
  /** If provided, only show when active workout is for this program. If omitted, show for any active workout (e.g. on home). */
  programId: programIdProp,
  /** When true, card is hidden (e.g. already on day screen) */
  hide,
}: {
  programId?: string;
  hide?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const setWorkoutDrawerOpen = useWorkoutStore((s) => s.setWorkoutDrawerOpen);
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const elapsed = useElapsedSeconds();
  const programId = programIdProp ?? activeWorkout?.programId ?? "";
  const dayIdx = activeWorkout?.dayIndex ?? 0;
  const imageUrl = useActiveDayThumbnail(programId, dayIdx);
  const daySummary = useDaySummary(programId, dayIdx);

  if (
    !activeWorkout ||
    (programIdProp != null && activeWorkout.programId !== programIdProp) ||
    hide
  )
    return null;

  const dayTitle = activeWorkout.dayTitle ?? `Dita ${dayIdx + 1}`;
  const cardBottom = TAB_BAR_OFFSET + insets.bottom + Spacing.sm;

  const openDrawer = () => setWorkoutDrawerOpen(true);

  return (
    <TouchableOpacity
      onPress={openDrawer}
      style={[
        styles.card,
        { backgroundColor: colors.card, bottom: cardBottom },
        Shadows,
      ]}
      activeOpacity={0.9}
    >
      <View style={[styles.imageWrap, { backgroundColor: colors.icon + "20" }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <MaterialIcons name="fitness-center" size={20} color={colors.tint} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {dayTitle}
        </Text>
        <Text style={[styles.nextReps, { color: colors.icon }]} numberOfLines={1}>
          {daySummary}
        </Text>
      </View>
      <Text style={[styles.timerRight, { color: ORANGE_TIMER }]}>
        {formatDuration(elapsed)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    ...(Platform.OS === "ios"
      ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 }
      : { elevation: 4 }),
  },
  imageWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: Spacing.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
  },
  nextReps: {
    fontSize: 11,
    marginTop: 1,
  },
  timerRight: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: Spacing.sm,
  },
});
