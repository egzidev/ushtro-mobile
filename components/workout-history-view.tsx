import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { WorkoutHistoryProgram } from "@/lib/api/workout-tracking";
import { formatDateDDMMM, formatWorkoutDuration } from "@/lib/utils/format-rest";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { type Href, Link } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
            style={StyleSheet.flatten([
              styles.sectionTitle,
              { color: colors.text },
            ])}
          >
            {program.programName}
          </Text>
          {program.sessions.map((session) => (
            <Link
              key={session.id}
              href={`/(client)/program/history/${session.id}` as Href}
              asChild
            >
              <TouchableOpacity
                style={StyleSheet.flatten([
                  styles.sessionCard,
                  {
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: `${colors.icon}12`,
                  },
                ])}
                activeOpacity={0.8}
              >
                <View style={styles.sessionCardInner}>
                  <View style={styles.sessionThumb}>
                    {session.thumbnailUrl ? (
                      <Image
                        source={{ uri: session.thumbnailUrl }}
                        style={styles.sessionThumbImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={StyleSheet.flatten([
                          styles.sessionThumbPlaceholder,
                          { backgroundColor: `${colors.tint}25` },
                        ])}
                      >
                        <MaterialIcons
                          name="fitness-center"
                          size={24}
                          color={colors.icon}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.sessionBody}>
                    <Text
                      style={StyleSheet.flatten([
                        styles.sessionTitle,
                        { color: colors.text },
                      ])}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {session.dayTitle}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <MaterialIcons
                          name="schedule"
                          size={14}
                          color={colors.icon}
                          style={styles.metaIcon}
                        />
                        <Text
                          style={StyleSheet.flatten([
                            styles.metaText,
                            { color: colors.icon },
                          ])}
                          numberOfLines={1}
                        >
                          {formatWorkoutDuration(session.totalSeconds)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialIcons
                          name="event"
                          size={14}
                          color={colors.icon}
                          style={styles.metaIcon}
                        />
                        <Text
                          style={StyleSheet.flatten([
                            styles.metaText,
                            { color: colors.icon },
                          ])}
                          numberOfLines={1}
                        >
                          {formatDateDDMMM(session.completedAt)}
                        </Text>
                      </View>
                      {session.cycleIndex > 0 && (
                        <View
                          style={StyleSheet.flatten([
                            styles.weekBadge,
                            { backgroundColor: `${colors.tint}20` },
                          ])}
                        >
                          <Text
                            style={StyleSheet.flatten([
                              styles.weekBadgeText,
                              { color: colors.tint },
                            ])}
                            numberOfLines={1}
                          >
                            Java {session.cycleIndex}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.chevronWrap}>
                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color={colors.icon}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
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
  sessionCard: {
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: 80,
    backgroundColor: "#fff",
  },
  sessionCardInner: {
    flexDirection: "row",
    alignItems: "stretch",
    flex: 1,
    minHeight: 64,
  },
  sessionThumb: {
    width: 64,
    minHeight: 64,
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  sessionThumbImage: {
    width: "100%",
    height: "100%",
  },
  sessionThumbPlaceholder: {
    width: "100%",
    height: "100%",
    minHeight: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionBody: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    justifyContent: "center",
  },
  sessionTitle: {
    fontSize: Typography.bodyLarge,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: { marginRight: Spacing.xs },
  metaText: {
    fontSize: Typography.small,
    opacity: 0.85,
    fontVariant: ["tabular-nums"],
  },
  chevronWrap: {
    justifyContent: "center",
    paddingLeft: Spacing.xs,
  },
  weekBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  weekBadgeText: {
    fontSize: Typography.small,
    fontWeight: "600",
  },
});
