import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { fetchMyPrograms, type ClientProgramWithDetails } from '@/lib/api/my-programs';
import { getFirstVideoThumbnail } from '@/lib/utils/program-thumbnail';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ClientDashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Duke ngarkuar...</Text>
      </View>
    );
  }

  const totalPrograms = programs.length;
  const totalExercises = programs.reduce((s, cp) => s + (cp.programs?.exercise_count ?? 0), 0);
  const totalDays = programs.reduce((s, cp) => s + (cp.programs?.day_count ?? 0), 0);
  const hasNutrition = false;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: `${colors.tint}15` }]}>
          <Text style={[styles.statValue, { color: colors.tint }]}>{totalPrograms}</Text>
          <Text style={styles.statLabel}>Programet Aktive</Text>
        </View>
        <View style={styles.statCardBlue}>
          <Text style={styles.statValueBlue}>{totalExercises}</Text>
          <Text style={styles.statLabelBlue}>Ushtrime Total</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCardPurple}>
          <Text style={styles.statValuePurple}>{totalDays}</Text>
          <Text style={styles.statLabelPurple}>Ditë Trajnimi</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: hasNutrition ? '#dcfce715' : '#fed7aa15' }]}>
          <Text style={[styles.statValue, { color: hasNutrition ? '#16a34a' : '#ea580c' }]}>
            {hasNutrition ? 'Aktiv' : 'Nuk ka'}
          </Text>
          <Text style={styles.statLabel}>Plani Ushqimor</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Programet e Mia</Text>

      {programs.length > 0 ? (
        <View style={styles.programList}>
          {programs.map((cp) => {
            const program = cp.programs;
            const { imageUrl } = getFirstVideoThumbnail(program ?? undefined);
            return (
              <Link key={cp.id} href={`/(client)/program/${cp.program_id}`} asChild>
                <TouchableOpacity style={styles.programCard} activeOpacity={0.9}>
                  <View style={styles.programImageWrap}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.programImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.programImagePlaceholder, { backgroundColor: `${colors.tint}20` }]} />
                    )}
                    <View style={styles.programOverlay}>
                      <Text style={styles.programName} numberOfLines={2}>
                        {program?.name ?? 'Program'}
                      </Text>
                      <View style={styles.badges}>
                        <Text style={styles.badge}>{program?.exercise_count ?? 0} Ushtrime</Text>
                        <Text style={styles.badge}>{program?.day_count ?? 0} Ditë</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>
            );
          })}
        </View>
      ) : (
        <View style={[styles.empty, { backgroundColor: `${colors.icon}10` }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Nuk ka programe të disponueshme
          </Text>
          <Text style={[styles.emptySub, { color: colors.icon }]}>
            Kontaktoni trajnerin tuaj për të caktuar një program
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Plani i Ushqimit</Text>
      <Link href="/(client)/nutrition" asChild>
        <TouchableOpacity style={[styles.nutritionCard, { backgroundColor: '#fed7aa20' }]}>
          <Text style={[styles.nutritionTitle, { color: colors.text }]}>Plani i Ushqimit</Text>
          <Text style={styles.nutritionSub}>
            {hasNutrition
              ? 'Plani juaj aktual i ushqimit është aktiv'
              : 'Nuk ka plan ushqimi të caktuar ende'}
          </Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
  },
  statCardBlue: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#dbeafe',
  },
  statCardPurple: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f3e8ff',
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statValueBlue: { fontSize: 22, fontWeight: '700', color: '#1e40af' },
  statValuePurple: { fontSize: 22, fontWeight: '700', color: '#6b21a8' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statLabelBlue: { fontSize: 11, color: '#1e40af', marginTop: 2 },
  statLabelPurple: { fontSize: 11, color: '#6b21a8', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  programList: { gap: 16 },
  programCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  programImageWrap: { height: 200, position: 'relative' },
  programImage: { width: '100%', height: '100%' },
  programImagePlaceholder: { width: '100%', height: '100%' },
  programOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  programName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badge: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  empty: { borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyTitle: { fontWeight: '600', marginBottom: 4 },
  emptySub: { fontSize: 12 },
  nutritionCard: { borderRadius: 16, padding: 16, marginTop: 8 },
  nutritionTitle: { fontWeight: '700', fontSize: 16 },
  nutritionSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
});
