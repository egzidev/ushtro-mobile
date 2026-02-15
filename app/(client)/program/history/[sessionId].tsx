import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getCachedSessionDetail,
  getWorkoutSessionDetail,
} from "@/lib/api/workout-tracking";
import type { WorkoutSessionDetail } from "@/lib/api/workout-tracking";
import { formatDate, formatWorkoutDuration } from "@/lib/utils/format-rest";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WorkoutSessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [detail, setDetail] = useState<WorkoutSessionDetail | null>(() =>
    sessionId ? getCachedSessionDetail(sessionId) : null
  );
  const [loading, setLoading] = useState(() => !getCachedSessionDetail(sessionId ?? ""));
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (skipCache = false) => {
      if (!sessionId) {
        setDetail(null);
        setLoading(false);
        return;
      }
      try {
        const d = await getWorkoutSessionDetail(sessionId, { skipCache });
        setDetail(d);
      } catch (e) {
        console.error(e);
        setDetail(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (sessionId && !getCachedSessionDetail(sessionId)) {
      load();
    } else if (sessionId) {
      setLoading(false);
    }
  }, [sessionId, load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Stërvitja nuk u gjet
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
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: "#fff",
          },
        ]}
      >
        <Text style={[styles.programName, { color: colors.tint }]}>
          {detail.programName}
        </Text>
        <Text style={[styles.dayTitle, { color: colors.text }]}>
          {detail.dayTitle}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.icon }]}>
            {formatDate(detail.completedAt)}
          </Text>
          <Text style={[styles.metaText, { color: colors.icon }]}>
            Kohëzgjatja: {formatWorkoutDuration(detail.totalSeconds)}
          </Text>
          {detail.cycleIndex > 0 && (
            <Text style={[styles.metaText, { color: colors.icon }]}>
              Java {detail.cycleIndex}
            </Text>
          )}
        </View>
      </View>

      <Text style={[styles.exercisesTitle, { color: colors.text }]}>
        Ushtrimet
      </Text>
      {detail.exercises.map((ex) => (
        <View
          key={ex.id}
          style={[
            styles.exerciseCard,
            {
              backgroundColor: "#fff",
            },
          ]}
        >
          <View style={styles.exerciseRow}>
            <MaterialIcons
              name="fitness-center"
              size={20}
              color={colors.tint}
              style={styles.exerciseIcon}
            />
            <Text style={[styles.exerciseTitle, { color: colors.text }]}>
              {ex.title}
            </Text>
          </View>
          <Text style={[styles.setsText, { color: colors.icon }]}>
            {ex.completedSetsCount} / {ex.totalSets} sete
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  header: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: "#fff",
  },
  programName: {
    fontSize: Typography.small,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  dayTitle: {
    fontSize: Typography.title,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metaText: { fontSize: Typography.small },
  exercisesTitle: {
    fontSize: Typography.bodyLarge,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  exerciseCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: "#fff",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseIcon: { marginRight: Spacing.sm },
  exerciseTitle: {
    fontSize: Typography.body,
    fontWeight: "600",
    flex: 1,
  },
  setsText: { fontSize: Typography.small, marginTop: Spacing.xs, marginLeft: 28 },
  emptyText: { fontSize: Typography.body },
});
