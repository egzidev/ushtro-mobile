import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useWorkoutStore } from "@/lib/stores/workout-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function useElapsedSeconds() {
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!activeWorkout || activeWorkout.pausedAt !== null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.sessionId, activeWorkout?.pausedAt]);
  if (!activeWorkout) return 0;
  const elapsedMs =
    activeWorkout.pausedAt !== null
      ? activeWorkout.pausedAt -
        activeWorkout.startTime -
        activeWorkout.totalPausedMs
      : now - activeWorkout.startTime - activeWorkout.totalPausedMs;
  return Math.floor(elapsedMs / 1000);
}

export function WorkoutDrawerTrigger({
  programId,
  onPress,
  title,
}: {
  programId: string;
  onPress: () => void;
  title?: string;
}) {
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const elapsed = useElapsedSeconds();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  if (!activeWorkout || activeWorkout.programId !== programId) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.trigger, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
    >
      <Text style={[styles.triggerTimer, { color: colors.text }]}>
        {formatDuration(elapsed)}
      </Text>
      <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.text} />
    </TouchableOpacity>
  );
}

export function WorkoutDrawerModal({
  programId,
  visible,
  onClose,
  programTitle,
}: {
  programId: string;
  visible: boolean;
  onClose: () => void;
  programTitle?: string;
}) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const pauseActiveWorkout = useWorkoutStore((s) => s.pauseActiveWorkout);
  const resumeActiveWorkout = useWorkoutStore((s) => s.resumeActiveWorkout);

  const elapsed = useElapsedSeconds();

  if (!activeWorkout || activeWorkout.programId !== programId) return null;

  const isPaused = activeWorkout.pausedAt !== null;
  const dayIndex = activeWorkout.dayIndex ?? 0;

  const goToDay = () => {
    onClose();
    router.push(`/(client)/program/${programId}/day/${dayIndex}` as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.panel, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.panelHandle, { backgroundColor: colors.icon }]}
          />
          <View
            style={[
              styles.panelContent,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              Stërvitje në progres
            </Text>
            <Text style={[styles.timerBig, { color: colors.text }]}>
              {formatDuration(elapsed)}
            </Text>
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                onPress={isPaused ? resumeActiveWorkout : pauseActiveWorkout}
                style={[styles.pauseBtn, { backgroundColor: colors.icon }]}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={isPaused ? "play-arrow" : "pause"}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.pauseBtnText}>
                  {isPaused ? "Vazhdo" : "Ndalo"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goToDay}
                style={[styles.finishBtn, { backgroundColor: colors.tint }]}
                activeOpacity={0.85}
              >
                <MaterialIcons name="flag" size={24} color="#fff" />
                <Text style={styles.finishBtnText}>Shko te dita</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    minHeight: 36,
  },
  triggerTimer: {
    fontSize: Typography.body,
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  panel: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }
      : { elevation: 8 }),
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  panelContent: {
    paddingBottom: Spacing.xl,
  },
  panelTitle: {
    fontSize: Typography.small,
    fontWeight: "600",
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  timerBig: {
    fontSize: 42,
    fontWeight: "700",
    marginBottom: Spacing.xl,
    letterSpacing: 1,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  pauseBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: Typography.body,
  },
  finishBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  finishBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: Typography.body,
  },
});
