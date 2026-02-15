import { ClientHeaderBlock } from "@/components/header/client-header-block";
import { NextWorkoutCard } from "@/components/next-workout-card";
import { RingStat } from "@/components/ring-stat";
import {
  Colors,
  PAGE_CONTENT_PADDING,
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkoutStore } from "@/lib/stores/workout-store";
import {
  getDayFirstExerciseThumbnail,
  getFirstVideoThumbnail,
  ProgramWithDays,
} from "@/lib/utils/program-thumbnail";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClientDashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const userName =
    user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "";
  const avatarUrl =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const programs = useWorkoutStore((s) => s.programs);
  const progressMap = useWorkoutStore((s) => s.progressMap);
  const loading = useWorkoutStore((s) => s.loading);
  const loadedOnce = useWorkoutStore((s) => s.loadedOnce);
  const loadPrograms = useWorkoutStore((s) => s.loadPrograms);
  const refreshing = useWorkoutStore((s) => s.refreshing);

  useFocusEffect(
    useCallback(() => {
      if (!loadedOnce) loadPrograms();
    }, [loadedOnce, loadPrograms]),
  );

  const onRefresh = () => {
    loadPrograms();
  };

  if (loading) {
    return (
      <View
        style={StyleSheet.flatten([
          styles.centered,
          { backgroundColor: colors.background },
        ])}
      >
        <ActivityIndicator size="large" color={colors.tint} />
        <Text
          style={StyleSheet.flatten([
            styles.loadingText,
            { color: colors.text },
          ])}
        >
          Duke ngarkuar...
        </Text>
      </View>
    );
  }

  const hasNutrition = false;

  return (
    <ScrollView
      style={StyleSheet.flatten([
        styles.container,
        { backgroundColor: colors.background },
      ])}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
    >
      <ClientHeaderBlock userName={userName} avatarUrl={avatarUrl} />

      {programs.length > 0 &&
        (() => {
          const cp =
            programs.find((c) => {
              const prog = c.programs;
              const p = prog ? progressMap[prog.id] : undefined;
              return !p?.allComplete;
            }) ?? programs[0];
          const prog = cp?.programs;
          const progress = prog ? progressMap[prog.id] : undefined;
          return progress ? (
            <View style={styles.statsRow}>
              <RingStat
                completedDays={progress.completedDays}
                totalDays={progress.totalDays}
                totalDurationSeconds={
                  Object.values(
                    progress.completedDayDurations ?? {},
                  ).reduce<number>((acc, s) => acc + (s ?? 0), 0) || null
                }
                cycleIndex={progress.cycleIndex}
                programName={prog?.name}
              />
            </View>
          ) : null;
        })()}

      <Text
        style={StyleSheet.flatten([
          styles.sectionTitle,
          { color: colors.text },
        ])}
      >
        Ushtrimi yt i radhës
      </Text>

      {programs.length > 0 ? (
        (() => {
          const active = programs.find((cp) => {
            const prog = cp.programs;
            const progress = prog ? progressMap[prog.id] : undefined;
            return !progress?.allComplete;
          });
          const cp = active ?? programs[0];
          const prog = cp.programs;
          const progress = prog ? progressMap[prog.id] : undefined;
          const sortedDays =
            prog?.program_days != null
              ? [...prog.program_days].sort(
                  (a, b) => (a.day_index ?? 0) - (b.day_index ?? 0),
                )
              : [];
          const nextDayIndex = progress?.nextDayIndex ?? 0;
          const day = sortedDays[nextDayIndex];
          const isRestDay = day?.is_rest_day ?? false;
          const dayLabel = isRestDay
            ? "Dita e pushimit"
            : day?.title ||
              day?.program_exercises?.find((e) => e?.content?.title)?.content
                ?.title ||
              `Dita ${nextDayIndex + 1}`;
          const exerciseCount = day?.program_exercises?.length ?? 0;
          const imageUrl =
            getDayFirstExerciseThumbnail(
              prog as unknown as ProgramWithDays | null | undefined,
              nextDayIndex,
            ) ??
            getFirstVideoThumbnail(
              prog as unknown as ProgramWithDays | null | undefined,
            ).imageUrl;

          return (
            <View style={styles.nextWorkoutWrap}>
              <NextWorkoutCard
                programId={cp.program_id}
                programName={prog?.name ?? "Program"}
                dayIndex={nextDayIndex}
                dayLabel={dayLabel}
                isRestDay={isRestDay}
                imageUrl={imageUrl}
                exerciseCount={exerciseCount}
              />
            </View>
          );
        })()
      ) : (
        <View
          style={StyleSheet.flatten([
            styles.empty,
            {
              backgroundColor:
                colorScheme === "dark"
                  ? "rgba(55,65,81,0.4)"
                  : "rgba(243,244,246,0.9)",
              borderWidth: 1,
              borderColor: `${colors.icon}15`,
              borderStyle: "dashed",
            },
          ])}
        >
          <View
            style={StyleSheet.flatten([
              styles.emptyIconWrap,
              { backgroundColor: `${colors.tint}15` },
            ])}
          >
            <MaterialIcons
              name="fitness-center"
              size={36}
              color={colors.tint}
            />
          </View>
          <Text
            style={StyleSheet.flatten([
              styles.emptyTitle,
              { color: colors.text },
            ])}
          >
            Nuk ka programe të disponueshme
          </Text>
          <Text
            style={StyleSheet.flatten([
              styles.emptySub,
              { color: colors.icon },
            ])}
          >
            Kontaktoni trajnerin tuaj për të caktuar një program
          </Text>
        </View>
      )}

      <Text
        style={StyleSheet.flatten([
          styles.sectionTitle,
          { color: colors.text },
        ])}
      >
        Plani i Ushqimit
      </Text>
      <Link href="/(client)/nutrition" asChild>
        <TouchableOpacity
          style={StyleSheet.flatten([
            styles.nutritionCard,
            {
              backgroundColor: hasNutrition
                ? colors.card
                : colorScheme === "dark"
                  ? "rgba(55,65,81,0.4)"
                  : "rgba(243,244,246,0.9)",
              borderWidth: hasNutrition ? 0 : 1,
              borderColor: `${colors.icon}15`,
              borderStyle: "dashed",
              alignItems: hasNutrition ? "stretch" : "center",
            },
          ])}
        >
          {!hasNutrition && (
            <View
              style={StyleSheet.flatten([
                styles.emptyIconWrapSmall,
                { backgroundColor: `${colors.tint}15` },
              ])}
            >
              <MaterialIcons name="restaurant" size={24} color={colors.tint} />
            </View>
          )}
          <Text
            style={StyleSheet.flatten([
              styles.nutritionTitle,
              { color: colors.text },
            ])}
          >
            Plani i Ushqimit
          </Text>
          <Text
            style={StyleSheet.flatten([
              styles.nutritionSub,
              { color: colors.icon },
            ])}
          >
            {hasNutrition
              ? "Plani juaj aktual i ushqimit është aktiv"
              : "Nuk ka plan ushqimi të caktuar ende"}
          </Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: Spacing.xxxl,
    paddingHorizontal: PAGE_CONTENT_PADDING,
    paddingBottom: Spacing.xxxl + 16,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: Spacing.sm, fontSize: Typography.body },
  sectionTitle: {
    fontSize: Typography.title,
    fontWeight: "700",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  statsRow: {
    marginBottom: Spacing.md,
  },
  nextWorkoutWrap: {
    marginBottom: Spacing.lg,
  },
  empty: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    alignItems: "center",
    minHeight: 140,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyIconWrapSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  emptySub: { fontSize: Typography.small, textAlign: "center" },
  nutritionCard: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    minHeight: 44,
  },
  nutritionTitle: { fontWeight: "700", fontSize: Typography.bodyLarge },
  nutritionSub: { fontSize: Typography.body, marginTop: Spacing.xs },
});
