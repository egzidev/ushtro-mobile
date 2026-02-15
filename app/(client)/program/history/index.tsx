import {
  WorkoutHistoryWeekView,
  flattenHistoryToSessions,
} from "@/components/workout-history-week-view";
import {
  Colors,
  PAGE_CONTENT_PADDING,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { WorkoutHistoryProgram } from "@/lib/api/workout-tracking";
import { getWorkoutHistoryForRange } from "@/lib/api/workout-tracking";
import { formatWeekLabel, getWeekBounds } from "@/lib/utils/format-rest";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const WEEK_COUNT = 12;
const WEEK_OFFSETS = Array.from({ length: WEEK_COUNT }, (_, i) => -i);

export default function WorkoutHistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [cache, setCache] = useState<Map<number, WorkoutHistoryProgram[]>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState<Map<number, boolean>>(() => new Map());
  const [refreshing, setRefreshing] = useState(false);
  const loadWeek = useCallback(
    async (weekOffset: number, skipCache = false) => {
      if (!skipCache && cache.has(weekOffset)) return;

      setLoading((prev) => new Map(prev).set(weekOffset, true));

      try {
        const { from, to } = getWeekBounds(weekOffset);
        const data = await getWorkoutHistoryForRange(from, to);
        setCache((prev) => new Map(prev).set(weekOffset, data));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading((prev) => {
          const next = new Map(prev);
          next.set(weekOffset, false);
          return next;
        });
      }
    },
    [cache],
  );

  useEffect(() => {
    loadWeek(selectedWeek);
  }, [selectedWeek, loadWeek]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWeek(selectedWeek, true).finally(() => setRefreshing(false));
  }, [selectedWeek, loadWeek]);

  const weekData = cache.get(selectedWeek) ?? [];
  const sessions = flattenHistoryToSessions(weekData);
  const weekLoading = loading.get(selectedWeek) ?? false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabsWrap]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsContent,
            { paddingHorizontal: PAGE_CONTENT_PADDING },
          ]}
          style={styles.tabsScroll}
        >
          {WEEK_OFFSETS.map((offset) => {
            const isSelected = selectedWeek === offset;
            return (
              <TouchableOpacity
                key={offset}
                onPress={() => setSelectedWeek(offset)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isSelected
                      ? colors.tint
                      : colorScheme === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isSelected ? "#fff" : colors.text,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {formatWeekLabel(offset)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <WorkoutHistoryWeekView
        sessions={sessions}
        weekLabel={formatWeekLabel(selectedWeek)}
        loading={weekLoading}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsWrap: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tabsContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  tab: {
    flexShrink: 0,
    marginRight: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabText: {
    fontSize: Typography.body,
    fontWeight: "600",
  },
});
