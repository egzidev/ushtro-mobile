import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme, type ThemePreference } from '@/contexts/theme-context';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'E ndritur', icon: 'light-mode' },
  { value: 'dark', label: 'E errët', icon: 'dark-mode' },
  { value: 'system', label: 'Sistemi', icon: 'settings-brightness' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const theme = useTheme();

  const handleLogout = () => {
    Alert.alert('Dilni', 'Jeni të sigurt që dëshironi të dilni?', [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Dil',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.icon }]}>Email</Text>
        <Text style={[styles.email, { color: colors.text }]}>{user?.email ?? '—'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.icon }]}>Theme</Text>
        <Text style={[styles.sublabel, { color: colors.icon }]}>E ndritur, e errët ose sistemi</Text>
        <View style={styles.themeOptions}>
          {THEME_OPTIONS.map((opt) => {
            const selected = theme?.preference === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: selected ? `${colors.tint}20` : `${colors.icon}10`,
                  },
                ]}
                onPress={() => theme?.setPreference(opt.value)}
              >
                <MaterialIcons
                  name={opt.icon as 'light-mode' | 'dark-mode' | 'settings-brightness'}
                  size={20}
                  color={selected ? colors.tint : colors.icon}
                />
                <Text style={[styles.themeOptionLabel, { color: colors.text }]}>{opt.label}</Text>
                {selected && (
                  <MaterialIcons name="check" size={18} color={colors.tint} style={styles.check} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: '#dc2626' }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Dil (Logout)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
  },
  label: { fontSize: 12, marginBottom: 4 },
  sublabel: { fontSize: 11, marginBottom: 12 },
  email: { fontSize: 16, fontWeight: '500' },
  themeOptions: { gap: 8 },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  themeOptionLabel: { fontSize: 15, fontWeight: '500', flex: 1 },
  check: { marginLeft: 'auto' },
  logoutButton: { padding: 16, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
