import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
      <Text style={[styles.title, { color: colors.text }]}>
        Plani i Ushqimit
      </Text>
      <Text style={[styles.subtitle, { color: colors.icon }]}>
        Plani juaj i ushqimit nga trajneri
      </Text>
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
        <View style={[styles.empty, { backgroundColor: `${colors.icon}10` }]}>
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
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  card: { borderRadius: 22, padding: 16 },
  cardTitle: { fontWeight: "600", fontSize: 16 },
  cardDesc: { fontSize: 13, marginTop: 4 },
  empty: { borderRadius: 22, padding: 24, alignItems: "center" },
  emptyTitle: { fontWeight: "600", marginBottom: 4 },
  emptySub: { fontSize: 13 },
});
