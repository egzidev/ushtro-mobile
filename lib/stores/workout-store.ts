import {
  fetchMyPrograms,
  type ClientProgramWithDetails,
} from "@/lib/api/my-programs";
import {
  getClientId,
  getProgramProgress,
  type ProgramProgress,
} from "@/lib/api/workout-tracking";
import { create } from "zustand";

export type ActiveWorkout = {
  sessionId: string;
  programId: string;
  programDayId: string;
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
  reset: () => void;
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  programs: [],
  progressMap: {},
  loading: true,
  refreshing: false,
  loadedOnce: false,
  activeWorkout: null,

  setActiveWorkout: (data) => set({ activeWorkout: data }),

  toggleCompletedSet: (key) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    const next = activeWorkout.completedSets.includes(key)
      ? activeWorkout.completedSets.filter((k) => k !== key)
      : [...activeWorkout.completedSets, key];
    set({ activeWorkout: { ...activeWorkout, completedSets: next } });
  },

  pauseActiveWorkout: () => {
    const { activeWorkout } = get();
    if (!activeWorkout || activeWorkout.pausedAt !== null) return;
    set({ activeWorkout: { ...activeWorkout, pausedAt: Date.now() } });
  },

  resumeActiveWorkout: () => {
    const { activeWorkout } = get();
    if (!activeWorkout || activeWorkout.pausedAt === null) return;
    const pausedDuration = Date.now() - activeWorkout.pausedAt;
    set({
      activeWorkout: {
        ...activeWorkout,
        pausedAt: null,
        totalPausedMs: activeWorkout.totalPausedMs + pausedDuration,
      },
    });
  },

  clearActiveWorkout: () => set({ activeWorkout: null }),

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
    });
  },
}));
