import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Day = {
  id: string;
  day_index: number;
  title: string | null;
  is_rest_day?: boolean;
  program_exercises?: Array<{
    id: string;
    content_id: string;
    sets: number | null;
    reps: string | null;
    rest: string | null;
    tempo: string | null;
    notes: string | null;
    exercise_order: number | null;
    program_exercise_sets?: Array<{ set_index: number; reps: string | null; rest: string | null }>;
    content?: {
      id: string;
      title: string;
      video_url: string;
      content_type: string;
      mux_playback_id?: string | null;
    } | null;
  }>;
};

type ProgramDetail = {
  id: string;
  name: string;
  program_days?: Day[];
};

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (!client) throw new Error('Client not found');

        const { data: cp } = await supabase
          .from('client_programs')
          .select('program_id')
          .eq('client_id', client.id)
          .eq('program_id', id)
          .single();
        if (!cp) throw new Error('Program not assigned');

        const { data: prog, error } = await supabase
          .from('programs')
          .select(`
            id,
            name,
            program_days (
              id,
              day_index,
              title,
              is_rest_day,
              program_exercises (
                id,
                content_id,
                sets,
                reps,
                rest,
                tempo,
                notes,
                exercise_order,
                program_exercise_sets (
                  set_index,
                  reps,
                  rest
                ),
                content:content_id (
                  id,
                  title,
                  video_url,
                  content_type,
                  mux_playback_id
                )
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error || !prog) throw new Error('Program not found');

        const days = (prog.program_days as Day[] | null) ?? [];
        days.sort((a, b) => a.day_index - b.day_index);
        days.forEach((d) => {
          if (d.program_exercises) {
            d.program_exercises.sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0));
            d.program_exercises.forEach((e) => {
              if (e.program_exercise_sets) {
                e.program_exercise_sets.sort((a, b) => a.set_index - b.set_index);
              }
            });
          }
        });

        setProgram({ ...prog, program_days: days });
      } catch (e) {
        console.error(e);
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const openVideo = (content: { content_type?: string; video_url?: string; mux_playback_id?: string | null }) => {
    if (content.content_type === 'youtube' && content.video_url) {
      Linking.openURL(content.video_url);
    } else if (content.mux_playback_id) {
      Linking.openURL(`https://stream.mux.com/${content.mux_playback_id}.m3u8`);
    }
  };

  const flatten = (arr: (object | null | undefined)[]) =>
    StyleSheet.flatten(arr.filter((s): s is object => s != null));

  if (loading || !program) {
    return (
      <View style={flatten([styles.centered, { backgroundColor: colors.background }])}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const days = program.program_days ?? [];
  const selectedDay = days[selectedDayIndex];

  return (
    <View style={flatten([styles.container, { backgroundColor: colors.background }])}>
      <ScrollView contentContainerStyle={styles.content}>
        {days.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabs}
            contentContainerStyle={styles.dayTabsContent}
          >
            {days.map((d, i) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => setSelectedDayIndex(i)}
                style={flatten([
                  styles.dayTab,
                  selectedDayIndex === i ? { backgroundColor: colors.tint } : null,
                ])}
              >
                <Text
                  style={flatten([
                    styles.dayTabText,
                    { color: selectedDayIndex === i ? '#fff' : colors.text },
                  ])}
                >
                  {d.title || `Dita ${d.day_index + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedDay && (
          <View style={styles.dayContent}>
            {selectedDay.is_rest_day ? (
              <Text style={flatten([styles.restDay, { color: colors.text }])}>Ditë pushimi</Text>
            ) : (
              <>
                {(selectedDay.program_exercises ?? []).map((ex) => {
                  const content = ex.content;
                  return (
                    <View
                      key={ex.id}
                      style={flatten([styles.exerciseCard, { borderColor: `${colors.tint}30` }])}
                    >
                      <Text style={flatten([styles.exerciseTitle, { color: colors.text }])}>
                        {content?.title ?? 'Ushtrim'}
                      </Text>
                      <View style={styles.setsRow}>
                        <Text style={flatten([styles.meta, { color: colors.icon }])}>
                          Sete: {ex.sets ?? '-'} · Përsëritje: {ex.reps ?? '-'} · Pushim: {ex.rest ?? '-'}
                        </Text>
                      </View>
                      {ex.program_exercise_sets?.length ? (
                        <View style={styles.setsList}>
                          {ex.program_exercise_sets.map((s, i) => (
                            <Text key={i} style={flatten([styles.setRow, { color: colors.text }])}>
                              Set {s.set_index + 1}: {s.reps ?? '-'} reps, pushim {s.rest ?? '-'}
                            </Text>
                          ))}
                        </View>
                      ) : null}
                      {content && (content.video_url || content.mux_playback_id) ? (
                        <TouchableOpacity
                          style={flatten([styles.videoButton, { backgroundColor: colors.tint }])}
                          onPress={() => openVideo(content)}
                        >
                          <Text style={styles.videoButtonText}>Shiko videon</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dayTabs: { marginBottom: 16 },
  dayTabsContent: { gap: 8, paddingRight: 16 },
  dayTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  dayTabText: { fontWeight: '600', fontSize: 14 },
  dayContent: { gap: 12 },
  restDay: { fontSize: 16, textAlign: 'center', paddingVertical: 24 },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  exerciseTitle: { fontWeight: '700', fontSize: 16 },
  setsRow: { marginTop: 6 },
  meta: { fontSize: 13 },
  setsList: { marginTop: 8, gap: 4 },
  setRow: { fontSize: 13 },
  videoButton: { marginTop: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  videoButtonText: { color: '#fff', fontWeight: '600' },
});
