import {
  Colors,
  PAGE_CONTENT_PADDING,
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

// TODO: Fetch assigned nutrition plan from Supabase (client_nutrition_plans + nutrition_plans with days/meals/items)
const hasNutrition = false;

export default function NutritionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {hasNutrition ? (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Plani aktual
          </Text>
          <Text style={[styles.cardDesc, { color: colors.icon }]}>
            Ditët dhe vaktet do të shfaqen këtu.
          </Text>
        </View>
      ) : (
        <View
          style={[
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
          ]}
        >
          <View
            style={[
              styles.emptyIconWrap,
              { backgroundColor: `${colors.tint}15` },
            ]}
          >
            <MaterialIcons name="restaurant" size={40} color={colors.tint} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nuk ka plan ushqimi të caktuar ende
          </Text>
          <Text style={[styles.emptySub, { color: colors.icon }]}>
            Kontaktoni trajnerin tuaj për një plan ushqimi
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: 32,
    paddingHorizontal: PAGE_CONTENT_PADDING,
    paddingBottom: 48,
  },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  card: { borderRadius: 22, padding: 16 },
  cardTitle: { fontWeight: "600", fontSize: 16 },
  cardDesc: { fontSize: 13, marginTop: 4 },
  empty: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    alignItems: "center",
    minHeight: 160,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textAlign: "center",
    fontSize: Typography.bodyLarge,
  },
  emptySub: { fontSize: Typography.body, textAlign: "center" },
});
