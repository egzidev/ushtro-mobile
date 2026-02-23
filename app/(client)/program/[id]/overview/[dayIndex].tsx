import {
  Colors,
  PAGE_CONTENT_PADDING,
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  startWorkout as apiStartWorkout,
  getCurrentCycle,
} from "@/lib/api/workout-tracking";
import { useWorkoutStore } from "@/lib/stores/workout-store";
import { supabase } from "@/lib/supabase";
import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
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

type ProgramExercise = NonNullable<Day["program_exercises"]>[number];

function FullscreenMuxVideo({
  playbackId,
  onClose,
}: {
  playbackId: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const videoSource = `https://stream.mux.com/${playbackId}.m3u8`;
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  return (
    <View style={fullscreenStyles.container}>
      <VideoView
        player={player}
        style={fullscreenStyles.video}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
        contentFit="contain"
      />
      <Pressable
        style={[
          fullscreenStyles.closeButton,
          { top: insets.top + 8 },
        ]}
        onPress={onClose}
        hitSlop={16}
      >
        <MaterialIcons name="close" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const fullscreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

type ContentForVideo = {
  video_url?: string;
  content_type?: string;
  mux_playback_id?: string | null;
};

function OverviewExerciseCard({
  exercise,
  textColor,
  mutedColor,
  tint,
  cardBg,
  isExpanded,
  onPress,
  onPlayVideo,
}: {
  exercise: ProgramExercise;
  textColor: string;
  mutedColor: string;
  tint: string;
  cardBg: string;
  isExpanded: boolean;
  onPress: () => void;
  onPlayVideo?: (content: ContentForVideo) => void;
}) {
  const content = exercise.content;
  const sets = exercise.program_exercise_sets ?? [];
  const hasSets = sets.length > 0;
  const setsLabel = hasSets
    ? `${sets.length} sete${exercise.reps ? ` × ${exercise.reps}` : ""}`
    : exercise.sets != null
      ? `${exercise.sets} sete`
      : exercise.reps ?? "-";
  const hasVideo =
    content && (content.video_url || content.mux_playback_id);

  return (
    <View style={[styles.exerciseCard, { backgroundColor: cardBg }]}>
      <TouchableOpacity
        style={styles.exerciseCardTouchable}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Pressable
          style={[styles.exerciseThumb, { backgroundColor: mutedColor + "26" }]}
          onPress={(e) => {
            e.stopPropagation?.();
            if (hasVideo && content && onPlayVideo) onPlayVideo(content);
          }}
        >
          {content && getContentThumbnailUrl(content) ? (
            <>
              <Image
                source={{ uri: getContentThumbnailUrl(content)! }}
                style={styles.exerciseThumbImage}
                contentFit="cover"
              />
              <View style={styles.playOverlay} pointerEvents="none">
                <MaterialIcons
                  name="play-circle-filled"
                  size={32}
                  color="rgba(255,255,255,0.9)"
                />
              </View>
            </>
          ) : (
            <MaterialIcons name="fitness-center" size={28} color={tint} />
          )}
        </Pressable>
        <View style={styles.exerciseContent}>
          <Text
            style={[styles.exerciseTitle, { color: textColor }]}
            numberOfLines={1}
          >
            {content?.title ?? "Ushtrim"}
          </Text>
          <Text style={[styles.setsText, { color: mutedColor }]}>
            {setsLabel}
          </Text>
        </View>
        {hasSets && (
          <MaterialIcons
            name={isExpanded ? "expand-less" : "chevron-right"}
            size={24}
            color={mutedColor}
          />
        )}
      </TouchableOpacity>

      {isExpanded && hasSets && (
        <View
          style={[
            styles.setsTable,
            {
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: mutedColor + "20",
            },
          ]}
        >
          <View
            style={[
              styles.setsTableHeader,
              {
                backgroundColor: mutedColor + "15",
                borderBottomWidth: 1,
                borderBottomColor: mutedColor + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.setsTableHeaderText,
                styles.setsTableFirstCol,
                { color: mutedColor },
              ]}
            >
              Seti
            </Text>
            <Text style={[styles.setsTableHeaderText, { color: mutedColor }]}>
              Përsëritje
            </Text>
            <Text style={[styles.setsTableHeaderText, { color: mutedColor }]}>
              Pushim
            </Text>
          </View>
          {sets.map((s, i) => (
            <View
              key={s.set_index}
              style={[
                styles.setsTableRow,
                i > 0
                  ? { borderTopWidth: 1, borderTopColor: mutedColor + "20" }
                  : null,
              ]}
            >
              <Text
                style={[
                  styles.setsTableCell,
                  styles.setsTableCellFirst,
                  { color: textColor },
                ]}
              >
                {s.set_index}
              </Text>
              <Text style={[styles.setsTableCell, { color: textColor }]}>
                {s.reps ?? "-"}
              </Text>
              <Text style={[styles.setsTableCell, { color: textColor }]}>
                {s.rest ?? "-"}
              </Text>
            </View>
          ))}
        </View>
      )}

      {isExpanded && exercise.notes ? (
        <View style={[styles.notesRow, { borderTopColor: mutedColor + "20" }]}>
          <Text style={[styles.notesLabel, { color: mutedColor }]}>Shënime</Text>
          <Text style={[styles.notesText, { color: textColor }]}>
            {exercise.notes}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function WorkoutDayOverviewScreen() {
  const { id, dayIndex } = useLocalSearchParams<{
    id: string;
    dayIndex: string;
  }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const dayIdx = parseInt(dayIndex ?? "0", 10) || 0;

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startLoading, setStartLoading] = useState(false);
  const [viewingCycle, setViewingCycle] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [videoModal, setVideoModal] = useState<
    null | { type: "mux"; playbackId: string }
  >(null);

  const setActiveWorkout = useWorkoutStore((s) => s.setActiveWorkout);

  const onPlayVideo = useCallback(
    (content: ContentForVideo) => {
      if (content.content_type === "youtube" && content.video_url) {
        WebBrowser.openBrowserAsync(content.video_url);
        return;
      }
      if (content.mux_playback_id) {
        setVideoModal({ type: "mux", playbackId: content.mux_playback_id });
      }
    },
    []
  );

  const load = useCallback(async () => {
    if (!id) return;
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
              program_exercise_sets (set_index, reps, rest),
              content:content_id (id, title, video_url, content_type, mux_playback_id)
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error || !prog) throw new Error("Program not found");

      const days = (prog.program_days as Day[] | null) ?? [];
      days.sort((a, b) => a.day_index - b.day_index);
      days.forEach((d) => {
        if (d.program_exercises) {
          d.program_exercises.sort(
            (a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0)
          );
          d.program_exercises.forEach((e) => {
            if (e.program_exercise_sets) {
              e.program_exercise_sets.sort(
                (a, b) => a.set_index - b.set_index
              );
            }
          });
        }
      });

      setProgram({ ...prog, program_days: days });
      setClientId(client.id);
      const cycle = await getCurrentCycle(client.id, prog.id, days);
      setViewingCycle(cycle);
      const day = days[dayIdx];
      if (day?.program_exercises) {
        setExpandedIds(
          new Set(day.program_exercises.map((e) => e.id))
        );
      }
    } catch (e) {
      console.error(e);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, dayIdx, router]);

  useEffect(() => {
    load();
  }, [load]);

  const onStartWorkout = async () => {
    const days = program?.program_days ?? [];
    const selDay = days[dayIdx];
    if (!program || !selDay || selDay.is_rest_day || !clientId) return;
    setStartLoading(true);
    try {
      const cycle =
        viewingCycle ?? (await getCurrentCycle(clientId, program.id, days));
      const sessionId = await apiStartWorkout(
        clientId,
        program.id,
        selDay.id,
        cycle
      );
      if (sessionId) {
        setActiveWorkout({
          sessionId,
          programId: program.id,
          programDayId: selDay.id,
          clientId,
          startTime: Date.now(),
          totalPausedMs: 0,
          pausedAt: null,
          completedSets: [],
        });
        router.replace(
          `/(client)/program/${id}/day/${dayIdx}` as any
        );
      }
    } finally {
      setStartLoading(false);
    }
  };

  const toggleExpanded = useCallback((exId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  }, []);

  if (loading || !program) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const days = program.program_days ?? [];
  const selectedDay = days[dayIdx];

  if (!selectedDay) {
    router.back();
    return null;
  }

  const isRestDay = selectedDay.is_rest_day ?? false;
  const dayTitle =
    selectedDay.title ||
    (isRestDay ? "Dita e pushimit" : `Dita ${selectedDay.day_index + 1}`);
  const exercises = selectedDay.program_exercises ?? [];
  const exerciseCount = exercises.length;

  const textColor = colorScheme === "dark" ? "#fff" : "#1a1a1a";
  const mutedColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const cardBg = colorScheme === "dark" ? "#1e1e24" : "#fff";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: textColor }]}>
          {dayTitle}
        </Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>
          {isRestDay
            ? "Ditë pushimi — nuk ka ushtrime"
            : `${exerciseCount} ushtrim${exerciseCount !== 1 ? "e" : ""}`}
        </Text>

        {!isRestDay && (
          <>
            <View style={styles.logHeader}>
              <Text style={[styles.logTitle, { color: textColor }]}>
                Ushtrimet
              </Text>
            </View>
            {exercises.map((ex) => (
              <OverviewExerciseCard
                key={ex.id}
                exercise={ex}
                textColor={textColor}
                mutedColor={mutedColor}
                tint={colors.tint}
                cardBg={cardBg}
                isExpanded={expandedIds.has(ex.id)}
                onPress={() => toggleExpanded(ex.id)}
                onPlayVideo={onPlayVideo}
              />
            ))}
          </>
        )}

        {isRestDay && (
          <View style={[styles.restBlock, { backgroundColor: cardBg }]}>
            <MaterialIcons name="bed" size={48} color={mutedColor} />
            <Text style={[styles.restText, { color: mutedColor }]}>
              Kjo është dita e pushimit. Pushoni dhe rikuperohuni.
            </Text>
          </View>
        )}
      </ScrollView>

      {!isRestDay && (
        <View
          style={[
            styles.bottomWrap,
            {
              paddingBottom: insets.bottom + Spacing.md,
              backgroundColor: colors.background,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onStartWorkout}
            disabled={startLoading}
            style={[
              styles.startButton,
              { backgroundColor: colors.tint },
              startLoading && styles.startButtonDisabled,
            ]}
            activeOpacity={0.85}
          >
            {startLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
                <Text style={styles.startButtonText}>Fillo stërvitjen</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={videoModal?.type === "mux"}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVideoModal(null)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {videoModal?.type === "mux" ? (
            <FullscreenMuxVideo
              playbackId={videoModal.playbackId}
              onClose={() => setVideoModal(null)}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: PAGE_CONTENT_PADDING,
    paddingTop: Spacing.lg,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: {
    fontSize: Typography.headline,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: Typography.body,
    marginBottom: Spacing.lg,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  logTitle: {
    fontSize: Typography.title,
    fontWeight: "700",
  },
  exerciseCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  exerciseCardTouchable: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    position: "relative",
  },
  exerciseThumbImage: { width: "100%", height: "100%" },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  exerciseContent: { flex: 1, minWidth: 0 },
  exerciseTitle: {
    fontSize: Typography.body,
    fontWeight: "600",
  },
  setsText: {
    fontSize: Typography.small,
    marginTop: Spacing.xs,
  },
  setsTable: {
    marginTop: Spacing.md,
    borderRadius: 12,
    overflow: "hidden",
  },
  setsTableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  setsTableHeaderText: {
    flex: 1,
    fontSize: Typography.small,
    fontWeight: "600",
    textAlign: "center",
  },
  setsTableFirstCol: { flex: 0, width: 40 },
  setsTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  setsTableCell: {
    flex: 1,
    fontSize: Typography.body,
    textAlign: "center",
  },
  setsTableCellFirst: { flex: 0, width: 40 },
  notesRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  notesLabel: { fontSize: Typography.small, fontWeight: "600", marginBottom: Spacing.xs },
  notesText: { fontSize: Typography.body },
  restBlock: {
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: "center",
  },
  restText: { fontSize: Typography.body, textAlign: "center", marginTop: Spacing.md },
  bottomWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: PAGE_CONTENT_PADDING,
    paddingTop: Spacing.md,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  startButtonDisabled: { opacity: 0.6 },
  startButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: Typography.bodyLarge,
  },
});
