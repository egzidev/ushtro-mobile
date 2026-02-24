import { DayWorkoutBody } from "@/components/day-workout-body";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useDayWorkout } from "@/hooks/use-day-workout";
import { useWorkoutStore } from "@/lib/stores/workout-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const CLOSE_THRESHOLD = 120;
const RADIUS_OPEN = Radius.lg;
const OVERLAY_OPACITY_OPEN = 0.5;

export function WorkoutDayDrawer() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const workoutDrawerOpen = useWorkoutStore((s) => s.workoutDrawerOpen);
  const setWorkoutDrawerOpen = useWorkoutStore((s) => s.setWorkoutDrawerOpen);
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const gestureStartY = useSharedValue(0);

  const onFinish = useCallback(
    (sessionId: string) => {
      setWorkoutDrawerOpen(false);
      router.replace(`/(client)/program/history/${sessionId}` as any);
    },
    [router, setWorkoutDrawerOpen]
  );

  const {
    program,
    loading,
    selectedDay,
    workoutStarted,
    workoutLoading,
    activeWorkout: activeWorkoutFromHook,
    elapsedSeconds,
    effectiveCompletedSets,
    startWorkout,
    onFinishWorkout,
    toggleSetComplete,
    pauseActiveWorkout,
    resumeActiveWorkout,
    formatDuration,
    openVideo,
  } = useDayWorkout(
    activeWorkout?.programId ?? undefined,
    activeWorkout?.dayIndex ?? 0,
    { onFinish }
  );

  const closeDrawer = useCallback(() => {
    setWorkoutDrawerOpen(false);
  }, [setWorkoutDrawerOpen]);

  // Animate in when drawer opens
  useEffect(() => {
    if (!workoutDrawerOpen || !activeWorkout) return;
    translateY.value = withSpring(0, {
      damping: 24,
      stiffness: 200,
      mass: 0.8,
    });
    overlayOpacity.value = withTiming(OVERLAY_OPACITY_OPEN, { duration: 200 });
  }, [workoutDrawerOpen, activeWorkout]);

  const runClose = useCallback(() => {
    translateY.value = withSpring(
      SCREEN_HEIGHT,
      { damping: 28, stiffness: 180, mass: 0.9 },
      (finished) => {
        if (finished) runOnJS(closeDrawer)();
      }
    );
    overlayOpacity.value = withTiming(0, { duration: 220 });
  }, [closeDrawer]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      gestureStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      "worklet";
      const next = Math.max(
        0,
        Math.min(SCREEN_HEIGHT, gestureStartY.value + e.translationY)
      );
      translateY.value = next;
      overlayOpacity.value = interpolate(
        next,
        [0, SCREEN_HEIGHT],
        [OVERLAY_OPACITY_OPEN, 0]
      );
    })
    .onEnd((e) => {
      "worklet";
      const shouldClose =
        translateY.value > CLOSE_THRESHOLD || e.velocityY > 400;
      if (shouldClose) {
        translateY.value = withSpring(
          SCREEN_HEIGHT,
          { damping: 28, stiffness: 180, mass: 0.9 },
          (finished) => {
            if (finished) runOnJS(closeDrawer)();
          }
        );
        overlayOpacity.value = withTiming(0, { duration: 220 });
      } else {
        translateY.value = withSpring(0, {
          damping: 24,
          stiffness: 200,
          mass: 0.8,
        });
        overlayOpacity.value = withTiming(OVERLAY_OPACITY_OPEN, {
          duration: 200,
        });
      }
    });

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    borderTopLeftRadius: interpolate(
      translateY.value,
      [0, 60],
      [RADIUS_OPEN, 0]
    ),
    borderTopRightRadius: interpolate(
      translateY.value,
      [0, 60],
      [RADIUS_OPEN, 0]
    ),
  }));

  if (!workoutDrawerOpen || !activeWorkout) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={runClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.modalWrap}>
      <View style={styles.modalWrap}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={runClose}
          accessibilityLabel="Mbyll"
          accessibilityRole="button"
        >
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
        </Pressable>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
            sheetAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <View style={styles.dragArea}>
              <View style={styles.handleRow}>
                <View
                  style={[styles.handle, { backgroundColor: colors.icon + "40" }]}
                />
              </View>

              <View
                style={[
                  styles.drawerHeader,
                  {
                    paddingTop: Spacing.sm,
                    paddingBottom: Spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: `${colors.icon}15`,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={runClose}
                  style={styles.drawerCloseBtn}
                  hitSlop={10}
                  accessibilityLabel="Mbyll"
                >
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={28}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <View style={styles.drawerHeaderCenter}>
                  <Text
                    style={[styles.timerText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {formatDuration(elapsedSeconds)}
                  </Text>
                </View>
                {workoutStarted ? (
                  <TouchableOpacity
                    onPress={onFinishWorkout}
                    disabled={workoutLoading}
                    style={[
                      styles.finishButton,
                      { backgroundColor: colors.tint },
                      workoutLoading && { opacity: 0.6 },
                    ]}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="flag" size={18} color="#fff" />
                    <Text style={styles.finishButtonText}>Përfundo</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.headerPlaceholder} />
                )}
              </View>
            </View>
          </GestureDetector>

          <View style={styles.bodyWrap}>
            {loading || !program ? (
              <View
                style={[
                  styles.centered,
                  { backgroundColor: colors.background },
                ]}
              >
                <ActivityIndicator size="large" color={colors.tint} />
              </View>
            ) : selectedDay ? (
              <DayWorkoutBody
                selectedDay={selectedDay}
                colors={colors}
                workoutStarted={workoutStarted}
                effectiveCompletedSets={effectiveCompletedSets}
                toggleSetComplete={toggleSetComplete}
                openVideo={openVideo}
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrap: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,1)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  dragArea: {
    backgroundColor: "transparent",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  drawerCloseBtn: {
    padding: Spacing.xs,
    zIndex: 1,
  },
  drawerHeaderCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: Typography.title,
    fontWeight: "700",
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginLeft: "auto",
  },
  finishButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  headerPlaceholder: { width: 80 },
  bodyWrap: { flex: 1, minHeight: 200 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
});
