import { SessionCard } from "@/components/session-card";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { WorkoutHistoryProgram } from "@/lib/api/workout-tracking";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type WorkoutHistoryViewProps = {
  data: WorkoutHistoryProgram[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

export function WorkoutHistoryView({
  data,
  loading,
  refreshing,
  onRefresh,
}: WorkoutHistoryViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const textColor = isDark ? "#fff" : "#1a1a1a";

  if (loading) {
    return (
      <View
        style={StyleSheet.flatten([
          styles.centered,
          { backgroundColor: colors.background },
        ])}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <ScrollView
        style={StyleSheet.flatten([
          styles.container,
          { backgroundColor: colors.background },
        ])}
        contentContainerStyle={styles.emptyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      >
        <View
          style={StyleSheet.flatten([
            styles.emptyIconWrap,
            { backgroundColor: `${colors.tint}15` },
          ])}
        >
          <MaterialIcons name="history" size={48} color={colors.tint} />
        </View>
        <Text
          style={StyleSheet.flatten([
            styles.emptyTitle,
            { color: colors.text },
          ])}
        >
          Nuk ka aktivitet ende
        </Text>
        <Text
          style={StyleSheet.flatten([styles.emptySub, { color: colors.icon }])}
        >
          Stërvitjet e përfunduara do të shfaqen këtu
        </Text>
      </ScrollView>
    );
  }

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
      {data.map((program) => (
        <View key={program.programId} style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: textColor }]}
          >
            {program.programName}
          </Text>
          {program.sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  emptyContent: {
    flex: 1,
    padding: Spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.bodyLarge,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  emptySub: { fontSize: Typography.body, textAlign: "center" },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: {
    fontSize: Typography.title,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
});
