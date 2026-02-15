import { DayCard } from "@/components/day-card";
import { RingStat } from "@/components/ring-stat";
import { Colors, PAGE_CONTENT_PADDING, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkoutStore } from "@/lib/stores/workout-store";
import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Day = {
  id: string;
  day_index: number;
  title: string | null;
  is_rest_day?: boolean;
  program_exercises?: Array<{
    id: string;
    content?: {
      video_url?: string;
      content_type?: string;
      mux_playback_id?: string | null;
    } | null;
  }>;
};

export default function ProgramListScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const programs = useWorkoutStore((s) => s.programs);
  const progressMap = useWorkoutStore((s) => s.progressMap);
  const loading = useWorkoutStore((s) => s.loading);
  const loadedOnce = useWorkoutStore((s) => s.loadedOnce);
  const loadPrograms = useWorkoutStore((s) => s.loadPrograms);
  const refreshing = useWorkoutStore((s) => s.refreshing);

  const cp = programs[0];
  const prog = cp?.programs;
  const programId = cp?.program_id ?? null;
  const programName = prog?.name ?? null;
  const days = useMemo(
    () =>
      prog
        ? ([...(prog.program_days ?? [])].sort(
            (a, b) => (a.day_index ?? 0) - (b.day_index ?? 0),
          ) as Day[])
        : [],
    [prog]
  );
  const progress = programId && prog ? progressMap[prog.id] ?? null : null;

  useFocusEffect(
    useCallback(() => {
      if (!loadedOnce) loadPrograms();
    }, [loadedOnce, loadPrograms])
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!programId || days.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.icon }]}>
          Nuk ka programe të disponueshme
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={loadPrograms}
          tintColor={colors.tint}
        />
      }
    >
      {programName && (
        <Text
          style={[styles.programTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {programName}
        </Text>
      )}
      {progress && (
        <View style={styles.statsRow}>
          <RingStat
            completedDays={progress.completedDays}
            totalDays={progress.totalDays}
            totalDurationSeconds={
              Object.values(progress.completedDayDurations ?? {}).reduce<number>(
                (acc, s) => acc + (s ?? 0),
                0
              ) || null
            }
            cycleIndex={progress.cycleIndex}
            programName={programName ?? undefined}
          />
        </View>
      )}

      <View style={styles.dayCardsWrap}>
        {days.map((d, i) => {
          const thumbUrl = d.is_rest_day
            ? null
            : getContentThumbnailUrl(d.program_exercises?.[0]?.content);
          const dayTitle =
            d.title ||
            (d.is_rest_day ? "Dita e pushimit" : `Dita ${d.day_index + 1}`);
          const exCount = d.program_exercises?.length ?? 0;
          const isCompleted =
            !d.is_rest_day && progress?.completedDayIds?.includes(d.id);

          return (
            <View key={d.id} style={styles.dayCardItem}>
              <DayCard
                dayTitle={dayTitle}
                imageUrl={thumbUrl}
                exerciseCount={exCount}
                isRestDay={!!d.is_rest_day}
                isCompleted={!!isCompleted}
                completedDurationSeconds={progress?.completedDayDurations?.[d.id]}
                onPress={() =>
                  router.push(`/(client)/program/${programId}/day/${i}` as any)
                }
              />
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: PAGE_CONTENT_PADDING,
    paddingTop: PAGE_CONTENT_PADDING,
    paddingBottom: Spacing.xxxl,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16 },
  programTitle: {
    fontSize: Typography.title,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  statsRow: {
    marginBottom: Spacing.lg,
  },
  dayCardsWrap: { gap: Spacing.md },
  dayCardItem: {},
});
