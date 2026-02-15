import { DayCard } from "@/components/day-card";
import { RingStat } from "@/components/ring-stat";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getProgramProgress,
  type ProgramProgress,
} from "@/lib/api/workout-tracking";
import { useWorkoutStore } from "@/lib/stores/workout-store";
import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";

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

type ProgramDetail = {
  id: string;
  name: string;
  program_days?: Day[];
};

export default function ProgramDayListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const programs = useWorkoutStore((s) => s.programs);
  const progressMap = useWorkoutStore((s) => s.progressMap);
  const loadPrograms = useWorkoutStore((s) => s.loadPrograms);
  const loadedOnce = useWorkoutStore((s) => s.loadedOnce);
  const refreshing = useWorkoutStore((s) => s.refreshing);

  const storeProgram = useMemo(
    () => programs.find((p) => p.program_id === id)?.programs ?? null,
    [programs, id]
  );
  const storeProgress = id ? progressMap[id] ?? null : null;

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [progress, setProgress] = useState<ProgramProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFallback = async () => {
    if (!id) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!client) throw new Error("Client not found");

      const { data: cp } = await supabase
        .from("client_programs")
        .select("program_id")
        .eq("client_id", client.id)
        .eq("program_id", id)
        .single();
      if (!cp) throw new Error("Program not assigned");

      const { data: prog, error } = await supabase
        .from("programs")
        .select(
          `
          id,
          name,
          program_days (
            id,
            day_index,
            title,
            is_rest_day,
            program_exercises (
              id,
              content_id,
              content:content_id (
                id,
                title,
                video_url,
                content_type,
                mux_playback_id
              )
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error || !prog) throw new Error("Program not found");

      const days = (prog.program_days as Day[] | null) ?? [];
      days.sort((a, b) => a.day_index - b.day_index);

      setProgram({ ...prog, program_days: days });
      navigation.setOptions({ title: (prog as ProgramDetail).name ?? "Detajet" });

      const progProgress = await getProgramProgress(
        client.id,
        prog.id,
        days.map((d) => ({ id: d.id, is_rest_day: d.is_rest_day })),
      );
      setProgress(progProgress);
    } catch (e) {
      console.error(e);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const programDetail = program ?? (storeProgram ? { ...storeProgram, program_days: storeProgram.program_days ?? [] } as ProgramDetail : null);
  const progressData = progress ?? storeProgress;

  useEffect(() => {
    if (!id) return;
    if (storeProgram && loadedOnce) {
      setLoading(false);
      setProgram(null);
      setProgress(null);
      return;
    }
    if (!loadedOnce) return;
    loadFallback();
  }, [id, storeProgram, loadedOnce]);

  useEffect(() => {
    if (!loadedOnce) loadPrograms();
  }, [loadedOnce, loadPrograms]);

  const onRefresh = () => {
    loadPrograms();
  };

  if (!id) return null;
  const showLoader = !loadedOnce || (!programDetail && loading);
  if (showLoader) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  useEffect(() => {
    if (programDetail?.name) {
      navigation.setOptions({ title: programDetail.name ?? "Detajet" });
    }
  }, [programDetail?.name, navigation]);

  const days = programDetail?.program_days ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
    >
      {progressData && (
        <View style={styles.statsRow}>
          <RingStat
            completedDays={progressData.completedDays}
            totalDays={progressData.totalDays}
            totalDurationSeconds={
              Object.values(progressData.completedDayDurations ?? {}).reduce<number>(
                (acc, s) => acc + (s ?? 0),
                0
              ) || null
            }
            cycleIndex={progressData.cycleIndex}
            programName={programDetail?.name}
          />
        </View>
      )}

      {days.length > 0 && (
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
              !d.is_rest_day && progressData?.completedDayIds?.includes(d.id);

            return (
              <View key={d.id} style={styles.dayCardItem}>
                <DayCard
                  dayTitle={dayTitle}
                  imageUrl={thumbUrl}
                  exerciseCount={exCount}
                  isRestDay={!!d.is_rest_day}
                  isCompleted={!!isCompleted}
                  completedDurationSeconds={progressData?.completedDayDurations?.[d.id]}
                  onPress={() =>
                    router.push(
                      `/(client)/program/${id}/day/${i}` as any,
                    )
                  }
                />
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsRow: {
    marginBottom: Spacing.lg,
  },
  dayCardsWrap: { gap: Spacing.md },
  dayCardItem: {},
});
