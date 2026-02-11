import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  fetchMyPrograms,
  type ClientProgramWithDetails,
} from "@/lib/api/my-programs";
import {
  getFirstVideoThumbnail,
  ProgramWithDays,
} from "@/lib/utils/program-thumbnail";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProgramListScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [programs, setPrograms] = useState<ClientProgramWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <FlatList
      data={programs}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
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
      renderItem={({ item: cp }) => {
        const program = cp.programs;
        const { imageUrl } = getFirstVideoThumbnail(
          program as unknown as ProgramWithDays,
        );
        return (
          <Link href={`/(client)/program/${cp.program_id}`} asChild>
            <TouchableOpacity
              style={StyleSheet.flatten([
                styles.card,
                { backgroundColor: colors.card },
              ])}
              activeOpacity={0.8}
            >
              <View style={styles.thumb}>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.thumbImage}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.thumbPlaceholder,
                      { backgroundColor: `${colors.tint}20` },
                    ]}
                  />
                )}
              </View>
              <View style={styles.cardBody}>
                <Text
                  style={[styles.cardTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {program?.name ?? "Program"}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.icon }]}>
                  {program?.exercise_count ?? 0} ushtrime ·{" "}
                  {program?.day_count ?? 0} ditë
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, paddingBottom: 32, backgroundColor: 'transparent' },
  card: {
    flexDirection: "row",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 12,
  },
  thumb: { width: 100, height: 80 },
  thumbImage: { width: "100%", height: "100%" },
  thumbPlaceholder: { width: "100%", height: "100%" },
  cardBody: { flex: 1, padding: 12, justifyContent: "center" },
  cardTitle: { fontWeight: "600", fontSize: 16 },
  cardMeta: { fontSize: 12, marginTop: 4 },
});
