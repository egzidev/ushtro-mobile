import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { borderColor: `${colors.icon}20` }]}>
        <Text style={[styles.label, { color: colors.icon }]}>Email</Text>
        <Text style={[styles.email, { color: colors.text }]}>{user?.email ?? '—'}</Text>
      </View>
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: '#dc2626' }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Dil (Logout)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  label: { fontSize: 12, marginBottom: 4 },
  email: { fontSize: 16, fontWeight: '500' },
  logoutButton: { padding: 16, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
