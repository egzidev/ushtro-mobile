import { SessionCard } from "@/components/session-card";
import {
  Colors,
  PAGE_CONTENT_PADDING,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { WorkoutHistorySession } from "@/lib/api/workout-tracking";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WeekStatsCard } from "./week-stats-card";

type WeekHistoryContentProps = {
  sessions: WorkoutHistorySession[];
  weekLabel: string;
  loading?: boolean;
  refreshControl?: React.ReactElement;
};

/** Flatten programs to sessions (sorted by completedAt desc) */
export function flattenHistoryToSessions(
  programs: Array<{ sessions: WorkoutHistorySession[] }>,
): WorkoutHistorySession[] {
  const all = programs.flatMap((p) => p.sessions);
  all.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
  return all;
}

function computeWeekStats(sessions: WorkoutHistorySession[]) {
  const totalDuration = sessions.reduce(
    (acc, s) => acc + (s.totalSeconds ?? 0),
    0,
  );
  return { workoutCount: sessions.length, totalDurationSeconds: totalDuration };
}

export function WorkoutHistoryWeekView({
  sessions,
  weekLabel,
  loading,
  refreshControl,
}: WeekHistoryContentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const textColor = isDark ? "#fff" : "#1a1a1a";
  const { workoutCount, totalDurationSeconds } = computeWeekStats(sessions);

  if (loading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.centered, styles.loadingWrap]}
        refreshControl={refreshControl}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </ScrollView>
    );
  }

  if (sessions.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.emptyContent}
        refreshControl={refreshControl}
      >
        <WeekStatsCard
          workoutCount={0}
          totalDurationSeconds={0}
          weekLabel={weekLabel}
        />
        <View style={styles.emptyInner}>
          <View
            style={[
              styles.emptyIconWrap,
              { backgroundColor: `${colors.tint}15` },
            ]}
          >
            <MaterialIcons
              name="fitness-center"
              size={36}
              color={colors.tint}
            />
          </View>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            Nuk ka stërvitje këtë javë
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={refreshControl}
    >
      <WeekStatsCard
        workoutCount={workoutCount}
        totalDurationSeconds={totalDurationSeconds}
        weekLabel={weekLabel}
      />

      <View style={styles.logHeader}>
        <Text style={[styles.logTitle, { color: textColor }]}>
          Stërvitjet
        </Text>
      </View>

      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: PAGE_CONTENT_PADDING,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  loadingWrap: { flex: 1, minHeight: 200 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContent: {
    paddingHorizontal: PAGE_CONTENT_PADDING,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  emptyInner: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyText: { fontSize: Typography.body },
  logHeader: {
    marginBottom: Spacing.md,
  },
  logTitle: {
    fontSize: Typography.title,
    fontWeight: "700",
  },
});
