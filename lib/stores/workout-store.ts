import {
  fetchMyPrograms,
  type ClientProgramWithDetails,
} from "@/lib/api/my-programs";
import {
  getClientId,
  getProgramProgress,
  type ProgramProgress,
} from "@/lib/api/workout-tracking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const ACTIVE_WORKOUT_KEY = "@ushtro/activeWorkout";

export type ActiveWorkout = {
  sessionId: string;
  programId: string;
  programDayId: string;
  /** 0-based day index for navigation (e.g. program/id/day/0) */
  dayIndex: number;
  /** Display title for the floating card (e.g. "Dita 1" or custom day title) */
  dayTitle: string;
  clientId: string;
  startTime: number;
  /** Total milliseconds the timer was paused */
  totalPausedMs: number;
  /** When paused, timestamp of pause start */
  pausedAt: number | null;
  /** Keys like "programExerciseId-setIndex" */
  completedSets: string[];
};

type WorkoutState = {
  programs: ClientProgramWithDetails[];
  progressMap: Record<string, ProgramProgress>;
  loading: boolean;
  refreshing: boolean;
  loadedOnce: boolean;
  /** In-progress workout; cleared on finish or when user leaves without finishing */
  activeWorkout: ActiveWorkout | null;
  loadPrograms: () => Promise<void>;
  updateProgressForProgram: (programId: string) => Promise<void>;
  setActiveWorkout: (data: ActiveWorkout | null) => void;
  toggleCompletedSet: (key: string) => void;
  pauseActiveWorkout: () => void;
  resumeActiveWorkout: () => void;
  clearActiveWorkout: () => void;
  getActiveWorkoutForDay: (programId: string, programDayId: string) => ActiveWorkout | null;
  /** Load persisted active workout (call on app start so timer continues after close) */
  rehydrateActiveWorkout: () => Promise<void>;
  /** When true, the workout day drawer is open (bottom sheet instead of full page) */
  workoutDrawerOpen: boolean;
  setWorkoutDrawerOpen: (open: boolean) => void;
  reset: () => void;
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  programs: [],
  progressMap: {},
  loading: true,
  refreshing: false,
  loadedOnce: false,
  activeWorkout: null,
  workoutDrawerOpen: false,

  setWorkoutDrawerOpen: (open) => set({ workoutDrawerOpen: open }),

  setActiveWorkout: (data) => {
    set({ activeWorkout: data });
    AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, data ? JSON.stringify(data) : "").catch(() => {});
  },

  toggleCompletedSet: (key) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    const next = activeWorkout.completedSets.includes(key)
      ? activeWorkout.completedSets.filter((k) => k !== key)
      : [...activeWorkout.completedSets, key];
    const nextWorkout = { ...activeWorkout, completedSets: next };
    set({ activeWorkout: nextWorkout });
    AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(nextWorkout)).catch(() => {});
  },

  pauseActiveWorkout: () => {
    const { activeWorkout } = get();
    if (!activeWorkout || activeWorkout.pausedAt !== null) return;
    const next = { ...activeWorkout, pausedAt: Date.now() };
    set({ activeWorkout: next });
    AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(next)).catch(() => {});
  },

  resumeActiveWorkout: () => {
    const { activeWorkout } = get();
    if (!activeWorkout || activeWorkout.pausedAt === null) return;
    const pausedDuration = Date.now() - activeWorkout.pausedAt;
    const next = {
      ...activeWorkout,
      pausedAt: null,
      totalPausedMs: activeWorkout.totalPausedMs + pausedDuration,
    };
    set({ activeWorkout: next });
    AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(next)).catch(() => {});
  },

  clearActiveWorkout: () => {
    set({ activeWorkout: null });
    AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, "").catch(() => {});
  },

  rehydrateActiveWorkout: async () => {
    try {
      const raw = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
      if (!raw?.trim()) return;
      const data = JSON.parse(raw) as Partial<ActiveWorkout> & { sessionId?: string; startTime?: number };
      if (!data?.sessionId || !data?.startTime) return;
      set({
        activeWorkout: {
          sessionId: data.sessionId,
          programId: data.programId ?? "",
          programDayId: data.programDayId ?? "",
          dayIndex: data.dayIndex ?? 0,
          dayTitle: data.dayTitle ?? `Dita ${(data.dayIndex ?? 0) + 1}`,
          clientId: data.clientId ?? "",
          startTime: data.startTime,
          totalPausedMs: data.totalPausedMs ?? 0,
          pausedAt: data.pausedAt ?? null,
          completedSets: Array.isArray(data.completedSets) ? data.completedSets : [],
        },
      });
    } catch {
      // ignore
    }
  },

  getActiveWorkoutForDay: (programId, programDayId) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return null;
    if (activeWorkout.programId !== programId || activeWorkout.programDayId !== programDayId)
      return null;
    return activeWorkout;
  },

  loadPrograms: async () => {
    const { loadedOnce } = get();
    set(loadedOnce ? { refreshing: true } : { loading: true });
    try {
      const data = await fetchMyPrograms();
      const clientId = await getClientId();
      const map: Record<string, ProgramProgress> = {};

      if (clientId) {
        for (const cp of data) {
          const prog = cp.programs;
          if (!prog?.program_days?.length) continue;
          const days = [...prog.program_days].sort(
            (a, b) => (a.day_index ?? 0) - (b.day_index ?? 0)
          );
          const progress = await getProgramProgress(
            clientId,
            prog.id,
            days.map((d) => ({ id: d.id, is_rest_day: d.is_rest_day }))
          );
          map[prog.id] = progress;
        }
      }

      set({
        programs: data,
        progressMap: map,
        loading: false,
        refreshing: false,
        loadedOnce: true,
      });
    } catch (e) {
      console.error(e);
      set({ loading: false, refreshing: false });
    }
  },

  updateProgressForProgram: async (programId: string) => {
    const { programs } = get();
    const cp = programs.find((p) => p.program_id === programId);
    const prog = cp?.programs;
    if (!prog?.program_days?.length) return;

    const clientId = await getClientId();
    if (!clientId) return;

    const days = [...prog.program_days].sort(
      (a, b) => (a.day_index ?? 0) - (b.day_index ?? 0)
    );
    const progress = await getProgramProgress(
      clientId,
      prog.id,
      days.map((d) => ({ id: d.id, is_rest_day: d.is_rest_day }))
    );

    set((s) => ({
      progressMap: { ...s.progressMap, [prog.id]: progress },
    }));
  },

  reset: () => {
    set({
      programs: [],
      progressMap: {},
      loading: true,
      refreshing: false,
      loadedOnce: false,
      activeWorkout: null,
      workoutDrawerOpen: false,
    });
  },
}));
