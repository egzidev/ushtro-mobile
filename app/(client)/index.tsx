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
  getFirstVideoThumbnail,
  ProgramWithDays,
} from "@/lib/utils/program-thumbnail";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const CARD_WIDTH = screenWidth * 0.85;
  const CARD_MARGIN = 12;
  const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

  const load = async () => {
    try {
      const data = await fetchMyPrograms();
      setPrograms(data);
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
            {programs.map((cp) => (
              <View
                key={cp.id}
                style={[styles.heroCardItem, { width: CARD_WIDTH, marginRight: CARD_MARGIN }]}
              >
                <ProgramHeroCard
                  programId={cp.program_id}
                  programName={cp.programs?.name ?? "Program"}
                  todayDay={1}
                  totalDays={cp.programs?.day_count ?? 0}
                  exerciseCount={cp.programs?.exercise_count ?? 0}
                  completedDays={0}
                  imageUrl={
                    getFirstVideoThumbnail(
                      cp.programs as unknown as ProgramWithDays | null | undefined,
                    ).imageUrl
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View
          style={StyleSheet.flatten([
            styles.empty,
            { backgroundColor: colors.card },
          ])}
        >
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
            { backgroundColor: colors.card },
          ])}
        >
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
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
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
    padding: Spacing.xxl,
    alignItems: "center",
  },
  emptyTitle: { fontWeight: "600", marginBottom: Spacing.xs },
  emptySub: { fontSize: Typography.small },
  nutritionCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    minHeight: 44,
  },
  nutritionTitle: { fontWeight: "700", fontSize: Typography.bodyLarge },
  nutritionSub: { fontSize: Typography.body, marginTop: Spacing.xs },
});
