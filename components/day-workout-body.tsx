import { Checkbox } from "@/components/ui/checkbox";
import { MuxVideoPlayer } from "@/components/video/mux-video-player";
import { Colors, Radius, Spacing } from "@/constants/theme";
import type { Day } from "@/hooks/use-day-workout";
import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useState } from "react";
import { Platform, Pressable } from "react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const THUMBNAIL_SIZE = 64;
const COMPLETED_CIRCLE_SIZE = 8;
const COMPLETED_CIRCLE_GAP = 6;

export type DayWorkoutBodyProps = {
  selectedDay: Day;
  colors: (typeof Colors)["light"];
  workoutStarted: boolean;
  effectiveCompletedSets: Set<string>;
  toggleSetComplete: (key: string) => void;
  openVideo: (content: {
    content_type?: string;
    video_url?: string;
    mux_playback_id?: string | null;
  }) => void;
};

export function DayWorkoutBody({
  selectedDay,
  colors,
  workoutStarted,
  effectiveCompletedSets,
  toggleSetComplete,
  openVideo,
}: DayWorkoutBodyProps) {
  const insets = useSafeAreaInsets();
  const [expandedCompletedId, setExpandedCompletedId] = useState<string | null>(
    null
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 32 + insets.bottom },
        ]}
      >
        {selectedDay.is_rest_day ? (
          <View style={styles.restDayRow}>
            <MaterialIcons name="bed" size={40} color={colors.icon} />
            <Text style={[styles.restDay, { color: colors.text }]}>
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
                content?.mux_playback_id && content?.content_type !== "youtube";

              const sets = ex.program_exercise_sets ?? [];
              const isCompleted =
                sets.length > 0 &&
                sets.every((s) =>
                  effectiveCompletedSets.has(`${ex.id}-${s.set_index}`)
                );
              const isExpanded = expandedCompletedId === ex.id;

              if (isCompleted && !isExpanded) {
                return (
                  <Pressable
                    key={ex.id}
                    onPress={() => setExpandedCompletedId(ex.id)}
                    style={[
                      styles.completedCard,
                      { backgroundColor: colors.card },
                      Platform.OS === "ios"
                        ? {
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 8,
                          }
                        : { elevation: 3 },
                    ]}
                  >
                    <View
                      style={[
                        styles.completedThumbWrap,
                        {
                          backgroundColor: `${colors.icon}15`,
                          borderRadius: Radius.sm,
                        },
                      ]}
                    >
                      {thumbnailUrl ? (
                        <Image
                          source={{ uri: thumbnailUrl }}
                          style={styles.completedThumbnail}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.completedThumbnail,
                            {
                              backgroundColor: `${colors.tint}20`,
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.completedRight}>
                      <Text
                        style={[styles.completedTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {content?.title ?? "Ushtrim"}
                      </Text>
                      <View style={styles.completedCirclesRow}>
                        {sets.map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.completedCircle,
                              { backgroundColor: "#22c55e" },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    <MaterialIcons
                      name="keyboard-arrow-down"
                      size={24}
                      color={colors.icon}
                      style={styles.completedChevron}
                    />
                  </Pressable>
                );
              }

              if (isCompleted && isExpanded) {
                return (
                  <View
                    key={ex.id}
                    style={[
                      styles.completedCardExpandedWrap,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <View
                      style={[
                        styles.completedCard,
                        { backgroundColor: colors.card },
                        styles.completedCardHeaderOnly,
                      ]}
                    >
                      <View
                        style={[
                          styles.completedThumbWrap,
                          {
                            backgroundColor: `${colors.icon}15`,
                            borderRadius: Radius.sm,
                          },
                        ]}
                      >
                        {thumbnailUrl ? (
                          <Image
                            source={{ uri: thumbnailUrl }}
                            style={styles.completedThumbnail}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.completedThumbnail,
                              {
                                backgroundColor: `${colors.tint}20`,
                              },
                            ]}
                          />
                        )}
                      </View>
                      <View style={styles.completedRight}>
                        <Text
                          style={[
                            styles.completedTitle,
                            { color: colors.text },
                          ]}
                          numberOfLines={2}
                        >
                          {content?.title ?? "Ushtrim"}
                        </Text>
                        <View style={styles.completedCirclesRow}>
                          {sets.map((_, i) => (
                            <View
                              key={i}
                              style={[
                                styles.completedCircle,
                                { backgroundColor: "#22c55e" },
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                      <Pressable
                        onPress={() => setExpandedCompletedId(null)}
                        style={styles.completedChevron}
                        hitSlop={10}
                      >
                        <MaterialIcons
                          name="keyboard-arrow-up"
                          size={24}
                          color={colors.icon}
                        />
                      </Pressable>
                    </View>
                    <View style={styles.completedExpandedTableWrap}>
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
                            style={[
                              styles.setsTableHeaderText,
                              styles.setsTableFirstCol,
                              { color: colors.icon },
                            ]}
                          >
                            Seti
                          </Text>
                          <Text
                            style={[
                              styles.setsTableHeaderText,
                              { color: colors.icon },
                            ]}
                          >
                            Përsëritje
                          </Text>
                          <Text
                            style={[
                              styles.setsTableHeaderText,
                              { color: colors.icon },
                            ]}
                          >
                            Pushim
                          </Text>
                          <View style={styles.setsTableHeaderCheck} />
                        </View>
                        {ex.program_exercise_sets.map((s, i) => {
                          const setKey = `${ex.id}-${s.set_index}`;
                          const rowBg = "rgba(34, 197, 94, 0.18)";
                          return (
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
                                { backgroundColor: rowBg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.setsTableCell,
                                  styles.setsTableCellFirst,
                                  { color: colors.text },
                                ]}
                              >
                                {s.set_index}
                              </Text>
                              <Text
                                style={[
                                  styles.setsTableCell,
                                  { color: colors.text },
                                ]}
                              >
                                {s.reps ?? "-"}
                              </Text>
                              <Text
                                style={[
                                  styles.setsTableCell,
                                  { color: colors.text },
                                ]}
                              >
                                {s.rest ?? "-"}
                              </Text>
                              <View style={styles.setsTableCellCheck}>
                                <Checkbox
                                  shape="circle"
                                  checked={true}
                                  checkedColor="#22c55e"
                                  disabled={!workoutStarted}
                                  onPress={() => toggleSetComplete(setKey)}
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.setsRow}>
                        <Text style={[styles.meta, { color: colors.icon }]}>
                          Sete: {ex.sets ?? "-"} · Përsëritje: {ex.reps ?? "-"} ·
                          Pushim: {ex.rest ?? "-"}
                          {ex.tempo ? ` · Tempo: ${ex.tempo}` : ""}
                        </Text>
                      </View>
                    )}
                    </View>
                  </View>
                );
              }

              return (
                <View
                  key={ex.id}
                  style={[
                    styles.exerciseCard,
                    { backgroundColor: colors.card },
                  ]}
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
                        style={[styles.videoTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {content?.title ?? "Ushtrim"}
                      </Text>
                    </View>
                  )}

                  {!hasVideo && (
                    <Text
                      style={[styles.exerciseTitle, { color: colors.text }]}
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
                          style={[
                            styles.setsTableHeaderText,
                            styles.setsTableFirstCol,
                            { color: colors.icon },
                          ]}
                        >
                          Seti
                        </Text>
                        <Text
                          style={[
                            styles.setsTableHeaderText,
                            { color: colors.icon },
                          ]}
                        >
                          Përsëritje
                        </Text>
                        <Text
                          style={[
                            styles.setsTableHeaderText,
                            { color: colors.icon },
                          ]}
                        >
                          Pushim
                        </Text>
                        <View style={styles.setsTableHeaderCheck} />
                      </View>
                      {ex.program_exercise_sets.map((s, i) => {
                        const setKey = `${ex.id}-${s.set_index}`;
                        const isChecked = effectiveCompletedSets.has(setKey);
                        const isFirstSet = i === 0;
                        const rowBg = isChecked
                          ? "rgba(34, 197, 94, 0.18)"
                          : isFirstSet
                            ? "rgba(56, 189, 248, 0.12)"
                            : undefined;
                        return (
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
                              rowBg ? { backgroundColor: rowBg } : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.setsTableCell,
                                styles.setsTableCellFirst,
                                { color: colors.text },
                              ]}
                            >
                              {s.set_index}
                            </Text>
                            <Text
                              style={[
                                styles.setsTableCell,
                                { color: colors.text },
                              ]}
                            >
                              {s.reps ?? "-"}
                            </Text>
                            <Text
                              style={[
                                styles.setsTableCell,
                                { color: colors.text },
                              ]}
                            >
                              {s.rest ?? "-"}
                            </Text>
                            <View style={styles.setsTableCellCheck}>
                              <Checkbox
                                shape="circle"
                                checked={isChecked}
                                checkedColor={isChecked ? "#22c55e" : undefined}
                                disabled={!workoutStarted}
                                onPress={() => toggleSetComplete(setKey)}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.setsRow}>
                      <Text style={[styles.meta, { color: colors.icon }]}>
                        Sete: {ex.sets ?? "-"} · Përsëritje: {ex.reps ?? "-"} ·
                        Pushim: {ex.rest ?? "-"}
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
                              style={[
                                styles.extraLabel,
                                { color: colors.icon },
                              ]}
                            >
                              Tempo
                            </Text>
                          </View>
                          <Text
                            style={[styles.extraText, { color: colors.text }]}
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
                              style={[
                                styles.extraLabel,
                                { color: colors.icon },
                              ]}
                            >
                              Shënime
                            </Text>
                          </View>
                          <Text
                            style={[styles.extraText, { color: colors.text }]}
                          >
                            {ex.notes}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  {hasVideo && !thumbnailUrl && !isMux && (
                    <TouchableOpacity
                      style={[
                        styles.videoButton,
                        { backgroundColor: colors.tint },
                      ]}
                      onPress={() => openVideo(content!)}
                    >
                      <Text style={styles.videoButtonText}>Shiko videon</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  restDayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 12,
  },
  restDay: { fontSize: 16, textAlign: "center" },
  completedCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  completedCardHeaderOnly: {
    marginBottom: 0,
  },
  completedCardExpandedWrap: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  completedExpandedTableWrap: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  completedThumbWrap: {
    position: "relative",
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: Radius.sm,
    overflow: "hidden",
    marginRight: Spacing.md,
  },
  completedThumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  completedRight: {
    flex: 1,
    minWidth: 0,
  },
  completedTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  completedCirclesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: COMPLETED_CIRCLE_GAP,
  },
  completedCircle: {
    width: COMPLETED_CIRCLE_SIZE,
    height: COMPLETED_CIRCLE_SIZE,
    borderRadius: COMPLETED_CIRCLE_SIZE / 2,
  },
  completedChevron: {
    marginLeft: Spacing.sm,
  },
  exerciseCard: {
    borderRadius: 22,
    padding: 14,
    overflow: "hidden",
    marginBottom: Spacing.lg,
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
  extraText: { fontSize: 14, marginLeft: 24 },
  meta: { fontSize: 13 },
  setsTable: { marginTop: 6, borderRadius: 12, overflow: "hidden" },
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
  setsTableFirstCol: { flex: 0, width: 54, textAlign: "center" },
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
  setsTableCell: { flex: 1, fontSize: 14, textAlign: "center" },
  setsTableCellFirst: { flex: 0, width: 54, textAlign: "center" },
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
