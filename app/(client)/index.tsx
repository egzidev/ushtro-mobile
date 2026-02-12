import { ClientHeaderBlock } from "@/components/header/client-header-block";
import { ProgramHeroCard } from "@/components/program-hero-card";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  fetchMyPrograms,
  type ClientProgramWithDetails,
} from "@/lib/api/my-programs";
import {
  getClientId,
  getProgramProgress,
  type ProgramProgress,
} from "@/lib/api/workout-tracking";
import {
  getFirstVideoThumbnail,
  ProgramWithDays,
} from "@/lib/utils/program-thumbnail";
import { Link } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
  const { width: screenWidth } = useWindowDimensions();
  const [programs, setPrograms] = useState<ClientProgramWithDetails[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProgramProgress>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const CARD_WIDTH = screenWidth * 0.85;
  const CARD_MARGIN = 12;
  const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

  const load = async () => {
    try {
      const data = await fetchMyPrograms();
      setPrograms(data);

      const clientId = await getClientId();
      if (!clientId) return;

      const map: Record<string, ProgramProgress> = {};
      for (const cp of data) {
        const prog = cp.programs;
        if (!prog?.program_days?.length) continue;
        const days = [...prog.program_days].sort(
          (a, b) => (a.day_index ?? 0) - (b.day_index ?? 0)
        );
        const progress = await getProgramProgress(
          clientId,
          prog.id,
          days.map((d) => ({ id: d.id, is_rest_day: d.is_rest_day }))
        );
        map[prog.id] = progress;
      }
      setProgressMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
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

      <Text
        style={StyleSheet.flatten([
          styles.sectionTitle,
          { color: colors.text },
        ])}
      >
        Programet e Mia
      </Text>

      {programs.length > 0 ? (
        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
          >
            {programs.map((cp) => {
              const prog = cp.programs;
              const progress = prog ? progressMap[prog.id] : undefined;
              const dayItems =
                prog?.program_days != null
                  ? [...prog.program_days]
                      .sort(
                        (a, b) =>
                          (a.day_index ?? 0) - (b.day_index ?? 0)
                      )
                      .map((d) => ({ is_rest_day: d.is_rest_day }))
                  : undefined;
              const workoutDays =
                dayItems != null
                  ? dayItems.filter((d) => !d.is_rest_day).length
                  : prog?.day_count ?? 0;
              const totalDays = progress?.totalDays ?? workoutDays;
              const nextDay1Based = progress
                ? progress.nextDayIndex + 1
                : 1;
              return (
                <View
                  key={cp.id}
                  style={[styles.heroCardItem, { width: CARD_WIDTH, marginRight: CARD_MARGIN }]}
                >
                  <ProgramHeroCard
                    programId={cp.program_id}
                    programName={prog?.name ?? "Program"}
                    nextDay={nextDay1Based}
                    totalDays={totalDays}
                    exerciseCount={prog?.exercise_count ?? 0}
                    completedDays={progress?.completedDays ?? 0}
                    cycleIndex={progress?.cycleIndex ?? 0}
                    allComplete={progress?.allComplete ?? false}
                    nextDayIndex={progress?.nextDayIndex ?? 0}
                    dayItems={dayItems}
                    imageUrl={
                      getFirstVideoThumbnail(
                        prog as unknown as ProgramWithDays | null | undefined,
                      ).imageUrl
                    }
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
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
              <MaterialIcons
                name="restaurant"
                size={24}
                color={colors.tint}
              />
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
    paddingHorizontal: Spacing.lg,
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
  carouselWrap: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.lg,
  },
  carouselContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  heroCardItem: {},
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
  emptyTitle: { fontWeight: "600", marginBottom: Spacing.xs, textAlign: "center" },
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
