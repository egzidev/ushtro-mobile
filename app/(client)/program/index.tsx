import { DayCard } from "@/components/day-card";
import { RingStat } from "@/components/ring-stat";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { fetchMyPrograms } from "@/lib/api/my-programs";
import {
  getClientId,
  getProgramProgress,
  type ProgramProgress,
} from "@/lib/api/workout-tracking";
import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  const [programId, setProgramId] = useState<string | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [progress, setProgress] = useState<ProgramProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchMyPrograms();
      const cp = data[0];
      if (!cp?.programs) {
        setProgramId(null);
        setDays([]);
        setProgress(null);
        return;
      }
      const prog = cp.programs;
      const sortedDays = [...(prog.program_days ?? [])].sort(
        (a, b) => (a.day_index ?? 0) - (b.day_index ?? 0),
      ) as Day[];

      setProgramId(cp.program_id);
      setDays(sortedDays);

      const clientId = await getClientId();
      if (clientId) {
        const progProgress = await getProgramProgress(
          clientId,
          prog.id,
          sortedDays.map((d) => ({ id: d.id, is_rest_day: d.is_rest_day })),
        );
        setProgress(progProgress);
      } else {
        setProgress(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
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
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16 },
  statsRow: {
    marginBottom: Spacing.lg,
  },
  dayCardsWrap: { gap: Spacing.md },
  dayCardItem: {},
});
