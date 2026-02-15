import { DayCard } from "@/components/day-card";
import { RingStat } from "@/components/ring-stat";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getProgramProgress,
  type ProgramProgress,
} from "@/lib/api/workout-tracking";
import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [progress, setProgress] = useState<ProgramProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading || !program) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const days = program.program_days ?? [];

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
