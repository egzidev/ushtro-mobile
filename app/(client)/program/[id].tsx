import {
  areAllDaysComplete,
  finishWorkout,
  getClientId,
  getCurrentCycle,
  getSetLogsForDay,
  startExercise,
  startWorkout as apiStartWorkout,
  upsertSetLog,
} from "@/lib/api/workout-tracking";
import { Checkbox } from "@/components/ui/checkbox";
import { MuxVideoPlayer } from "@/components/video/mux-video-player";
import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    program_exercise_sets?: Array<{
      set_index: number;
      reps: string | null;
      rest: string | null;
    }>;
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
  const { id, day } = useLocalSearchParams<{ id: string; day?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exerciseSessionMap, setExerciseSessionMap] = useState<
    Record<string, string>
  >({});
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [viewingCycle, setViewingCycle] = useState<number | null>(null);
  const [allDaysComplete, setAllDaysComplete] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!workoutStarted || !workoutStartTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStarted, workoutStartTime]);

  // Load set logs when viewing a day (only when not in active workout)
  useEffect(() => {
    const days = program?.program_days ?? [];
    const selDay = days[selectedDayIndex];
    if (
      !clientId ||
      !program ||
      !selDay ||
      selDay.is_rest_day ||
      viewingCycle === null ||
      workoutSessionId
    )
      return;
    (async () => {
      const logs = await getSetLogsForDay(
        clientId,
        program.id,
        selDay.id,
        viewingCycle
      );
      const keys = new Set(
        logs.map((l) => `${l.program_exercise_id}-${l.set_index}`)
      );
      setCompletedSets(keys);
    })();
  }, [
    clientId,
    program?.id,
    program?.program_days,
    selectedDayIndex,
    viewingCycle,
    workoutSessionId,
  ]);

  const startWorkout = async () => {
    const days = program?.program_days ?? [];
    const selDay = days[selectedDayIndex];
    if (!program || !selDay || selDay.is_rest_day || !clientId) return;
    setWorkoutLoading(true);
    try {
      const cycle =
        viewingCycle ??
        (await getCurrentCycle(clientId, program.id, days));
      const sessionId = await apiStartWorkout(
        clientId,
        program.id,
        selDay.id,
        cycle
      );
      if (sessionId) {
        setWorkoutSessionId(sessionId);
        setWorkoutStarted(true);
        setWorkoutStartTime(Date.now());
      }
    } finally {
      setWorkoutLoading(false);
    }
  };

  const onFinishWorkout = async () => {
    if (!workoutSessionId || !clientId || !program) return;
    setWorkoutLoading(true);
    try {
      await finishWorkout(workoutSessionId);
      setWorkoutSessionId(null);
      setWorkoutStarted(false);
      setWorkoutStartTime(null);
      setElapsedSeconds(0);
      setExerciseSessionMap({});
      const days = program.program_days ?? [];
      const cycle = await getCurrentCycle(clientId, program.id, days);
      setViewingCycle(cycle);
      const allComplete = await areAllDaysComplete(clientId, program.id, days);
      setAllDaysComplete(allComplete);
    } finally {
      setWorkoutLoading(false);
    }
  };

  const onRifillo = () => {
    setSelectedDayIndex(0);
    setCompletedSets(new Set());
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleSetComplete = async (
    key: string,
    programExerciseId: string,
    setIndex: number
  ) => {
    if (!workoutStarted) return;
    const willBeChecked = !completedSets.has(key);
    setCompletedSets((prev) => {
      const next = new Set(prev);
      if (willBeChecked) next.add(key);
      else next.delete(key);
      return next;
    });

    if (workoutSessionId) {
      let exerciseSessionId = exerciseSessionMap[programExerciseId];
      if (!exerciseSessionId) {
        exerciseSessionId =
          (await startExercise(workoutSessionId, programExerciseId)) ?? "";
        if (exerciseSessionId) {
          setExerciseSessionMap((prev) => ({
            ...prev,
            [programExerciseId]: exerciseSessionId,
          }));
        }
      }
      if (exerciseSessionId) {
        await upsertSetLog(exerciseSessionId, setIndex, willBeChecked);
      }

      if (willBeChecked && program && clientId) {
        const days = program.program_days ?? [];
        const selDay = days[selectedDayIndex];
        if (selDay?.program_exercises) {
          const allKeys = new Set<string>();
          for (const ex of selDay.program_exercises) {
            for (const s of ex.program_exercise_sets ?? []) {
              allKeys.add(`${ex.id}-${s.set_index}`);
            }
          }
          const nextCompleted = new Set(completedSets);
          nextCompleted.add(key);
          const allComplete =
            allKeys.size > 0 &&
            [...allKeys].every((k) => nextCompleted.has(k));
          if (allComplete) {
            setWorkoutLoading(true);
            try {
              await finishWorkout(workoutSessionId);
              setWorkoutSessionId(null);
              setWorkoutStarted(false);
              setWorkoutStartTime(null);
              setElapsedSeconds(0);
              setExerciseSessionMap({});
              const cycle = await getCurrentCycle(clientId, program.id, days);
              setViewingCycle(cycle);
              const allDone = await areAllDaysComplete(
                clientId,
                program.id,
                days
              );
              setAllDaysComplete(allDone);
            } finally {
              setWorkoutLoading(false);
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const { data: client } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (!client) throw new Error("Client not found");

        const { data: cp } = await supabase
          .from("client_programs")
          .select("program_id")
          .eq("client_id", client.id)
          .eq("program_id", id)
          .single();
        if (!cp) throw new Error("Program not assigned");

        const { data: prog, error } = await supabase
          .from("programs")
          .select(
            `
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
          `,
          )
          .eq("id", id)
          .single();

        if (error || !prog) throw new Error("Program not found");

        const days = (prog.program_days as Day[] | null) ?? [];
        days.sort((a, b) => a.day_index - b.day_index);
        days.forEach((d) => {
          if (d.program_exercises) {
            d.program_exercises.sort(
              (a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0),
            );
            d.program_exercises.forEach((e) => {
              if (e.program_exercise_sets) {
                e.program_exercise_sets.sort(
                  (a, b) => a.set_index - b.set_index,
                );
              }
            });
          }
        });

        setProgram({ ...prog, program_days: days });
        setClientId(client.id);
        const parsed = day != null && day !== "" ? parseInt(day, 10) : NaN;
        if (!isNaN(parsed) && parsed >= 0) {
          setSelectedDayIndex(Math.min(parsed, days.length - 1));
        }
        const cycle = await getCurrentCycle(client.id, prog.id, days);
        setViewingCycle(cycle);
        const allComplete = await areAllDaysComplete(client.id, prog.id, days);
        setAllDaysComplete(allComplete);
        navigation.setOptions({
          title: (prog as ProgramDetail).name ?? "Detajet",
        });
      } catch (e) {
        console.error(e);
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const openVideo = (content: {
    content_type?: string;
    video_url?: string;
    mux_playback_id?: string | null;
  }) => {
    if (content.content_type === "youtube" && content.video_url) {
      Linking.openURL(content.video_url);
    } else if (content.mux_playback_id) {
      Linking.openURL(`https://stream.mux.com/${content.mux_playback_id}.m3u8`);
    }
  };

  const flatten = (arr: (object | null | undefined)[]) =>
    StyleSheet.flatten(arr.filter((s): s is object => s != null));

  if (loading || !program) {
    return (
      <View
        style={flatten([
          styles.centered,
          { backgroundColor: colors.background },
        ])}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const days = program.program_days ?? [];
  const selectedDay = days[selectedDayIndex];
  return (
    <View
      style={flatten([
        styles.container,
        { backgroundColor: colors.background },
      ])}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          !selectedDay?.is_rest_day && {
            paddingBottom: 160 + insets.bottom,
          },
        ]}
      >
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
                  selectedDayIndex === i
                    ? { backgroundColor: colors.tint }
                    : null,
                ])}
              >
                <Text
                  style={flatten([
                    styles.dayTabText,
                    { color: selectedDayIndex === i ? "#fff" : colors.text },
                  ])}
                >
                  {d.title || `Dita ${d.day_index + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {allDaysComplete && (
          <View
            style={flatten([
              styles.rifilloBanner,
              { backgroundColor: `${colors.tint}15` },
            ])}
          >
            <Text style={flatten([styles.rifilloText, { color: colors.text }])}>
              Programi i përfunduar! Rifillo për të filluar një cikël të ri.
            </Text>
            <TouchableOpacity
              onPress={onRifillo}
              style={flatten([
                styles.rifilloButton,
                { backgroundColor: colors.tint },
              ])}
              activeOpacity={0.85}
            >
              <Text style={styles.rifilloButtonText}>Rifillo programin</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedDay && (
          <View style={styles.dayContent}>
            {selectedDay.is_rest_day ? (
              <View style={styles.restDayRow}>
                <MaterialIcons name="bed" size={40} color={colors.icon} />
                <Text style={flatten([styles.restDay, { color: colors.text }])}>
                  Ditë pushimi
                </Text>
              </View>
            ) : (
              <>
                {(selectedDay.program_exercises ?? []).map((ex) => {
                  const content = ex.content;
                  const hasVideo =
                    content && (content.video_url || content.mux_playback_id);
                  const thumbnailUrl = getContentThumbnailUrl(content);
                  const isYouTube =
                    content?.content_type === "youtube" && content?.video_url;
                  const isMux =
                    content?.mux_playback_id &&
                    content?.content_type !== "youtube";

                  return (
                    <View
                      key={ex.id}
                      style={flatten([
                        styles.exerciseCard,
                        { backgroundColor: colors.card },
                      ])}
                    >
                      {hasVideo && (
                        <View style={styles.videoSection}>
                          {isMux ? (
                            <MuxVideoPlayer
                              playbackId={content!.mux_playback_id!}
                              style={styles.videoThumbnailWrap}
                            />
                          ) : (
                            <TouchableOpacity
                              activeOpacity={0.9}
                              onPress={() => openVideo(content!)}
                              style={styles.videoThumbnailWrap}
                            >
                              {thumbnailUrl ? (
                                <Image
                                  source={{ uri: thumbnailUrl }}
                                  style={styles.videoThumbnail}
                                  contentFit="cover"
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.videoThumbnailPlaceholder,
                                    { backgroundColor: `${colors.tint}20` },
                                  ]}
                                />
                              )}
                              <View style={styles.playOverlay}>
                                <MaterialIcons
                                  name="play-circle-filled"
                                  size={72}
                                  color="rgba(255,255,255,0.95)"
                                />
                              </View>
                              {isYouTube && (
                                <View style={styles.watchYoutubeBadge}>
                                  <MaterialIcons
                                    name="play-circle-filled"
                                    size={16}
                                    color="#fff"
                                  />
                                  <Text style={styles.watchYoutubeText}>
                                    Watch on YouTube
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          )}
                          <Text
                            style={flatten([
                              styles.videoTitle,
                              { color: colors.text },
                            ])}
                            numberOfLines={2}
                          >
                            {content?.title ?? "Ushtrim"}
                          </Text>
                        </View>
                      )}

                      {!hasVideo && (
                        <Text
                          style={flatten([
                            styles.exerciseTitle,
                            { color: colors.text },
                          ])}
                        >
                          {content?.title ?? "Ushtrim"}
                        </Text>
                      )}

                      {ex.program_exercise_sets?.length ? (
                        <View
                          style={[
                            styles.setsTable,
                            {
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: `${colors.icon}20`,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.setsTableHeader,
                              {
                                backgroundColor: `${colors.icon}15`,
                                borderBottomWidth: 1,
                                borderBottomColor: `${colors.icon}20`,
                              },
                            ]}
                          >
                            <Text
                              style={flatten([
                                styles.setsTableHeaderText,
                                styles.setsTableFirstCol,
                                { color: colors.icon },
                              ])}
                            >
                              Seti
                            </Text>
                            <Text
                              style={flatten([
                                styles.setsTableHeaderText,
                                { color: colors.icon },
                              ])}
                            >
                              Përsëritje
                            </Text>
                            <Text
                              style={flatten([
                                styles.setsTableHeaderText,
                                { color: colors.icon },
                              ])}
                            >
                              Pushim
                            </Text>
                            <View style={styles.setsTableHeaderCheck} />
                          </View>
                          {ex.program_exercise_sets.map((s, i) => (
                            <View
                              key={i}
                              style={[
                                styles.setsTableRow,
                                i > 0
                                  ? {
                                      borderTopWidth: 1,
                                      borderTopColor: `${colors.icon}15`,
                                    }
                                  : null,
                              ]}
                            >
                              <Text
                                style={flatten([
                                  styles.setsTableCell,
                                  styles.setsTableCellFirst,
                                  { color: colors.text },
                                ])}
                              >
                                {s.set_index}
                              </Text>
                              <Text
                                style={flatten([
                                  styles.setsTableCell,
                                  { color: colors.text },
                                ])}
                              >
                                {s.reps ?? "-"}
                              </Text>
                              <Text
                                style={flatten([
                                  styles.setsTableCell,
                                  { color: colors.text },
                                ])}
                              >
                                {s.rest ?? "-"}
                              </Text>
                              <View style={styles.setsTableCellCheck}>
                                <Checkbox
                                  shape="circle"
                                  checked={completedSets.has(
                                    `${ex.id}-${s.set_index}`,
                                  )}
                                  disabled={!workoutStarted}
                                  onPress={() =>
                                    toggleSetComplete(
                                      `${ex.id}-${s.set_index}`,
                                      ex.id,
                                      s.set_index
                                    )
                                  }
                                />
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.setsRow}>
                          <Text
                            style={flatten([
                              styles.meta,
                              { color: colors.icon },
                            ])}
                          >
                            Sete: {ex.sets ?? "-"} · Përsëritje:{" "}
                            {ex.reps ?? "-"} · Pushim: {ex.rest ?? "-"}
                            {ex.tempo ? ` · Tempo: ${ex.tempo}` : ""}
                          </Text>
                        </View>
                      )}
                      {(ex.tempo && ex.program_exercise_sets?.length) ||
                      ex.notes ? (
                        <View style={styles.extrasRow}>
                          {ex.tempo && ex.program_exercise_sets?.length ? (
                            <View style={styles.extraSection}>
                              <View style={styles.extraLabelRow}>
                                <MaterialIcons
                                  name="fitness-center"
                                  size={16}
                                  color={colors.icon}
                                  style={styles.extraIcon}
                                />
                                <Text
                                  style={flatten([
                                    styles.extraLabel,
                                    { color: colors.icon },
                                  ])}
                                >
                                  Tempo
                                </Text>
                              </View>
                              <Text
                                style={flatten([
                                  styles.extraText,
                                  { color: colors.text },
                                ])}
                              >
                                {ex.tempo}
                              </Text>
                            </View>
                          ) : null}
                          {ex.notes ? (
                            <View style={styles.extraSection}>
                              <View style={styles.extraLabelRow}>
                                <MaterialIcons
                                  name="description"
                                  size={16}
                                  color={colors.icon}
                                  style={styles.extraIcon}
                                />
                                <Text
                                  style={flatten([
                                    styles.extraLabel,
                                    { color: colors.icon },
                                  ])}
                                >
                                  Shënime
                                </Text>
                              </View>
                              <Text
                                style={flatten([
                                  styles.extraText,
                                  { color: colors.text },
                                ])}
                              >
                                {ex.notes}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                      {hasVideo && !thumbnailUrl && !isMux && (
                        <TouchableOpacity
                          style={flatten([
                            styles.videoButton,
                            { backgroundColor: colors.tint },
                          ])}
                          onPress={() => openVideo(content!)}
                        >
                          <Text style={styles.videoButtonText}>
                            Shiko videon
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {!selectedDay?.is_rest_day && (
        <View style={[styles.bottomBarWrap, { paddingBottom: insets.bottom }]}>
          <View
            style={flatten([
              styles.bottomBarInner,
              { backgroundColor: "#fff" },
            ])}
          >
            <View style={styles.workoutTimerRow}>
              <MaterialIcons name="timer" size={20} color={colors.icon} />
              <Text
                style={flatten([styles.workoutTimer, { color: colors.text }])}
              >
                {workoutStarted ? formatDuration(elapsedSeconds) : "00:00"}
              </Text>
            </View>
            {workoutStarted ? (
              <TouchableOpacity
                onPress={onFinishWorkout}
                disabled={workoutLoading}
                style={[styles.finishButton, workoutLoading && { opacity: 0.6 }]}
                activeOpacity={0.85}
              >
                <Text style={styles.finishButtonText}>Përfundo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startWorkout}
                disabled={workoutLoading || selectedDay?.is_rest_day}
                style={flatten([
                  styles.filloButton,
                  { backgroundColor: colors.tint },
                  workoutLoading ? { opacity: 0.6 } : null,
                ])}
                activeOpacity={0.85}
              >
                <Text style={styles.filloButtonText}>Fillo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  bottomBarWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  bottomBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadows,
  },
  workoutTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  workoutTimer: {
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  finishButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: "#dc2626",
  },
  finishButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  filloButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: "center",
  },
  filloButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  dayTabs: { marginBottom: 16 },
  dayTabsContent: { gap: 8, paddingRight: 16 },
  dayTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  dayTabText: { fontWeight: "600", fontSize: 14 },
  dayContent: { gap: 12 },
  rifilloBanner: {
    marginBottom: 16,
    padding: 16,
    borderRadius: Radius.lg,
    gap: 12,
  },
  rifilloText: {
    fontSize: 15,
    fontWeight: "600",
  },
  rifilloButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  rifilloButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  restDayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 12,
  },
  restDay: { fontSize: 16, textAlign: "center" },
  exerciseCard: {
    borderRadius: 22,
    padding: 14,
    overflow: "hidden",
  },
  exerciseTitle: { fontWeight: "700", fontSize: 16, marginTop: 6 },
  videoSection: {
    marginTop: -14,
    marginHorizontal: -14,
    marginBottom: 12,
  },
  videoThumbnailWrap: {
    position: "relative",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    backgroundColor: "#1a1a1a",
  },
  videoThumbnail: { width: "100%", height: "100%" },
  videoThumbnailPlaceholder: { width: "100%", height: "100%" },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  watchYoutubeBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  watchYoutubeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  videoTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginTop: 14,
    paddingHorizontal: 14,
  },
  setsRow: { marginTop: 6 },
  extrasRow: { marginTop: 12, gap: 12 },
  extraSection: { gap: 4 },
  extraLabelRow: { flexDirection: "row", alignItems: "center" },
  extraIcon: { marginRight: 6 },
  extraLabel: { fontSize: 12 },
  extraValue: { fontSize: 16, fontWeight: "700", marginLeft: 24 },
  extraText: { fontSize: 14, marginLeft: 24 },
  meta: { fontSize: 13 },
  setsTable: {
    marginTop: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  setsTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  setsTableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  setsTableFirstCol: {
    flex: 0,
    width: 54,
    textAlign: "center",
  },
  setsTableHeaderCheck: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  setsTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  setsTableCell: {
    flex: 1,
    fontSize: 14,
    textAlign: "center",
  },
  setsTableCellFirst: {
    flex: 0,
    width: 54,
    textAlign: "center",
  },
  setsTableCellCheck: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  videoButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  videoButtonText: { color: "#fff", fontWeight: "600" },
});
