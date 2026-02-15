import {
  Colors,
  PAGE_CONTENT_PADDING,
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type {
  WorkoutSessionDetail,
  WorkoutSessionDetailExercise,
} from "@/lib/api/workout-tracking";
import {
  getCachedSessionDetail,
  getWorkoutSessionDetail,
} from "@/lib/api/workout-tracking";
import { formatWorkoutDuration } from "@/lib/utils/format-rest";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function StatItem({
  label,
  value,
  textColor,
  mutedColor,
}: {
  label: string;
  value: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

function ExerciseCard({
  exercise,
  textColor,
  mutedColor,
  tint,
  cardBg,
  isExpanded,
  onPress,
}: {
  exercise: WorkoutSessionDetailExercise;
  textColor: string;
  mutedColor: string;
  tint: string;
  cardBg: string;
  isExpanded: boolean;
  onPress: () => void;
}) {
  const setsLabel =
    exercise.totalSets > 0
      ? `${exercise.completedSetsCount} / ${exercise.totalSets} sete`
      : `${exercise.completedSetsCount} sete`;

  const hasSets = exercise.sets && exercise.sets.length > 0;

  return (
    <View style={[styles.exerciseCard, { backgroundColor: cardBg }]}>
      <TouchableOpacity
        style={styles.exerciseCardTouchable}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View
          style={[styles.exerciseThumb, { backgroundColor: mutedColor + "26" }]}
        >
          {exercise.thumbnailUrl ? (
            <Image
              source={{ uri: exercise.thumbnailUrl }}
              style={styles.exerciseThumbImage}
              contentFit="cover"
            />
          ) : (
            <MaterialIcons name="fitness-center" size={28} color={tint} />
          )}
        </View>
        <View style={styles.exerciseContent}>
          <Text
            style={[styles.exerciseTitle, { color: textColor }]}
            numberOfLines={1}
          >
            {exercise.title}
          </Text>
          <Text style={[styles.setsText, { color: mutedColor }]}>
            {setsLabel}
          </Text>
        </View>
        {hasSets && (
          <MaterialIcons
            name={isExpanded ? "expand-less" : "chevron-right"}
            size={24}
            color={mutedColor}
          />
        )}
      </TouchableOpacity>

      {isExpanded && hasSets && (
        <View
          style={[
            styles.setsTable,
            {
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: mutedColor + "20",
            },
          ]}
        >
          <View
            style={[
              styles.setsTableHeader,
              {
                backgroundColor: mutedColor + "15",
                borderBottomWidth: 1,
                borderBottomColor: mutedColor + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.setsTableHeaderText,
                styles.setsTableFirstCol,
                { color: mutedColor },
              ]}
            >
              Seti
            </Text>
            <Text style={[styles.setsTableHeaderText, { color: mutedColor }]}>
              Përsëritje
            </Text>
            <Text style={[styles.setsTableHeaderText, { color: mutedColor }]}>
              Pushim
            </Text>
            <View style={styles.setsTableHeaderCheck}>
              <Text style={[styles.setsTableHeaderText, { color: mutedColor }]}>
                ✓
              </Text>
            </View>
          </View>
          {exercise.sets!.map((s, i) => (
            <View
              key={s.setIndex}
              style={[
                styles.setsTableRow,
                i > 0
                  ? { borderTopWidth: 1, borderTopColor: mutedColor + "20" }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.setsTableCell,
                  styles.setsTableCellFirst,
                  { color: textColor },
                ]}
              >
                {s.setIndex}
              </Text>
              <Text style={[styles.setsTableCell, { color: textColor }]}>
                {s.reps ?? "-"}
              </Text>
              <Text style={[styles.setsTableCell, { color: textColor }]}>
                {s.rest ?? "-"}
              </Text>
              <View style={styles.setsTableCellCheck}>
                {s.isCompleted ? (
                  <MaterialIcons name="check-circle" size={20} color={tint} />
                ) : (
                  <View
                    style={[
                      styles.setsTableEmptyCheck,
                      { borderColor: mutedColor },
                    ]}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function WorkoutSessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const [detail, setDetail] = useState<WorkoutSessionDetail | null>(() =>
    sessionId ? getCachedSessionDetail(sessionId) : null,
  );
  const [loading, setLoading] = useState(
    () => !getCachedSessionDetail(sessionId ?? ""),
  );
  const [refreshing, setRefreshing] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(
    null,
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedExerciseId((prev) => (prev === id ? null : id));
  }, []);

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
    [sessionId],
  );

  useEffect(() => {
    if (sessionId && !getCachedSessionDetail(sessionId)) {
      load();
    } else if (sessionId) {
      setLoading(false);
    }
  }, [sessionId, load]);

  useEffect(() => {
    if (detail) {
      navigation.setOptions({
        title: detail.dayTitle || "Historia e stërvitjes",
      });
    }
  }, [detail, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const textColor = isDark ? "#fff" : "#1a1a1a";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const cardBg = isDark ? "#1e1e24" : "#fff";

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

  const workoutTitle = detail.dayTitle;
  const totalTime = formatWorkoutDuration(detail.totalSeconds);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: PAGE_CONTENT_PADDING },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
    >
      {/* Title */}
      <Text style={[styles.pageTitle, { color: textColor }]}>
        {workoutTitle}
      </Text>

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: "#fff" }]}>
        <StatItem
          label="Kohëzgjatja"
          value={totalTime}
          textColor={textColor}
          mutedColor={mutedColor}
        />
        <StatItem
          label="Vëllimi"
          value="-"
          textColor={textColor}
          mutedColor={mutedColor}
        />
        <StatItem
          label="Kalori"
          value="-"
          textColor={textColor}
          mutedColor={mutedColor}
        />
      </View>

      {/* Social row - placeholder for future */}
      {/* <View style={styles.socialRow}>
        <MaterialIcons name="favorite-border" size={20} color={mutedColor} />
        <Text style={[styles.socialCount, { color: mutedColor }]}>0</Text>
        <MaterialIcons name="chat-bubble-outline" size={20} color={mutedColor} />
        <Text style={[styles.socialCount, { color: mutedColor }]}>0</Text>
      </View> */}

      {/* Workout Log section */}
      <View style={styles.logHeader}>
        <Text style={[styles.logTitle, { color: textColor }]}>Ushtrimet</Text>
      </View>

      {detail.exercises.map((ex) => (
        <ExerciseCard
          key={ex.id}
          exercise={ex}
          textColor={textColor}
          mutedColor={mutedColor}
          tint={colors.tint}
          cardBg={cardBg}
          isExpanded={expandedExerciseId === ex.id}
          onPress={() => toggleExpanded(ex.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  pageTitle: {
    fontSize: Typography.headline,
    fontWeight: "700",
    marginBottom: Spacing.lg,
    lineHeight: 28,
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 14,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: Typography.small,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.bodyLarge,
    fontWeight: "700",
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  logTitle: {
    fontSize: Typography.title,
    fontWeight: "700",
  },
  exerciseCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  exerciseCardTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  exerciseThumbImage: { width: "100%", height: "100%" },
  exerciseContent: {
    flex: 1,
    minWidth: 0,
  },
  exerciseTitle: {
    fontSize: Typography.body,
    fontWeight: "600",
  },
  setsText: {
    fontSize: Typography.small,
    marginTop: Spacing.xs,
  },
  setsTable: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  setsTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  setsTableHeaderText: {
    flex: 1,
    fontSize: Typography.small,
    fontWeight: "600",
    textAlign: "center",
  },
  setsTableFirstCol: {
    flex: 0,
    width: 40,
  },
  setsTableHeaderCheck: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  setsTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  setsTableCell: {
    flex: 1,
    fontSize: Typography.body,
    textAlign: "center",
  },
  setsTableCellFirst: {
    flex: 0,
    width: 40,
  },
  setsTableCellCheck: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  setsTableEmptyCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  emptyText: { fontSize: Typography.body },
});
