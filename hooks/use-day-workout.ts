import {
  startWorkout as apiStartWorkout,
  finishWorkout,
  getCurrentCycle,
  getSetLogsForDay,
  startExercise,
  upsertSetLog,
} from "@/lib/api/workout-tracking";
import { useWorkoutStore } from "@/lib/stores/workout-store";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

export type Day = {
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

export type ProgramDetail = {
  id: string;
  name: string;
  program_days?: Day[];
};

export function useDayWorkout(
  programId: string | undefined,
  dayIndex: number,
  options?: { onFinish?: (sessionId: string) => void; onLoadError?: () => void }
) {
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!programId);
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [viewingCycle, setViewingCycle] = useState<number | null>(null);

  const updateProgressForProgram = useWorkoutStore((s) => s.updateProgressForProgram);
  const setActiveWorkout = useWorkoutStore((s) => s.setActiveWorkout);
  const toggleCompletedSet = useWorkoutStore((s) => s.toggleCompletedSet);
  const pauseActiveWorkout = useWorkoutStore((s) => s.pauseActiveWorkout);
  const resumeActiveWorkout = useWorkoutStore((s) => s.resumeActiveWorkout);
  const clearActiveWorkout = useWorkoutStore((s) => s.clearActiveWorkout);

  const selDayId = program?.program_days?.[dayIndex]?.id;
  const activeWorkout = useWorkoutStore((s) => {
    if (!program?.id || !selDayId) return null;
    return s.getActiveWorkoutForDay(program.id, selDayId);
  });

  const [timerTick, setTimerTick] = useState(0);
  useEffect(() => {
    if (!activeWorkout || activeWorkout.pausedAt !== null) return;
    const interval = setInterval(() => setTimerTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.sessionId, activeWorkout?.pausedAt]);

  const elapsedSeconds = activeWorkout
    ? Math.floor(
        (activeWorkout.pausedAt !== null
          ? activeWorkout.pausedAt - activeWorkout.startTime - activeWorkout.totalPausedMs
          : Date.now() - activeWorkout.startTime - activeWorkout.totalPausedMs
      ) / 1000
    )
    : 0;

  useEffect(() => {
    const days = program?.program_days ?? [];
    const selDay = days[dayIndex];
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
        viewingCycle,
      );
      const keys = new Set(logs.map((l) => `${l.program_exercise_id}-${l.set_index}`));
      setCompletedSets(keys);
    })();
  }, [clientId, program?.id, program?.program_days, dayIndex, viewingCycle, workoutSessionId]);

  const load = async () => {
    if (!programId) return;
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
        .eq("program_id", programId)
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
        .eq("id", programId)
        .single();

      if (error || !prog) throw new Error("Program not found");

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
      setClientId(client.id);
      const cycle = await getCurrentCycle(client.id, prog.id, days);
      setViewingCycle(cycle);
    } catch (e) {
      console.error(e);
      options?.onLoadError?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [programId]);

  useEffect(() => {
    if (activeWorkout && !workoutSessionId) {
      setWorkoutSessionId(activeWorkout.sessionId);
      setWorkoutStarted(true);
    }
  }, [activeWorkout?.sessionId, workoutSessionId]);

  const startWorkout = async () => {
    const days = program?.program_days ?? [];
    const selDay = days[dayIndex];
    if (!program || !selDay || selDay.is_rest_day || !clientId) return;
    setWorkoutLoading(true);
    try {
      const cycle = viewingCycle ?? (await getCurrentCycle(clientId, program.id, days));
      const sessionId = await apiStartWorkout(clientId, program.id, selDay.id, cycle);
      if (sessionId) {
        setWorkoutSessionId(sessionId);
        setWorkoutStarted(true);
        const dayTitle =
          selDay.title ||
          (selDay.is_rest_day ? "Dita e pushimit" : `Dita ${dayIndex + 1}`);
        setActiveWorkout({
          sessionId,
          programId: program.id,
          programDayId: selDay.id,
          dayIndex,
          dayTitle,
          clientId,
          startTime: Date.now(),
          totalPausedMs: 0,
          pausedAt: null,
          completedSets: [],
        });
      }
    } finally {
      setWorkoutLoading(false);
    }
  };

  const onFinishWorkout = async () => {
    if (!workoutSessionId || !clientId || !program || !activeWorkout) return;
    setWorkoutLoading(true);
    try {
      const completedKeys = activeWorkout.completedSets;
      const exSessionMap: Record<string, string> = {};
      const resolveProgramExerciseId = new Map<string, string>();
      for (const day of program.program_days ?? []) {
        for (const ex of day.program_exercises ?? []) {
          resolveProgramExerciseId.set(ex.id, ex.id);
          if (ex.id.length > 8 && ex.id.includes("-")) {
            resolveProgramExerciseId.set(ex.id.slice(0, 8), ex.id);
          }
        }
      }

      for (const key of completedKeys) {
        const lastHyphen = key.lastIndexOf("-");
        const programExerciseIdRaw = lastHyphen >= 0 ? key.slice(0, lastHyphen) : "";
        const setIndexStr = lastHyphen >= 0 ? key.slice(lastHyphen + 1) : "";
        const setIndex = parseInt(setIndexStr, 10);
        if (!programExerciseIdRaw || Number.isNaN(setIndex)) continue;

        const programExerciseId =
          resolveProgramExerciseId.get(programExerciseIdRaw) ?? programExerciseIdRaw;

        let exerciseSessionId = exSessionMap[programExerciseId];
        if (!exerciseSessionId) {
          exerciseSessionId =
            (await startExercise(workoutSessionId, programExerciseId)) ?? "";
          if (exerciseSessionId) exSessionMap[programExerciseId] = exerciseSessionId;
        }
        if (exerciseSessionId) {
          await upsertSetLog(exerciseSessionId, setIndex, true);
        }
      }

      await finishWorkout(workoutSessionId);
      await updateProgressForProgram(program.id);
      const sessionIdToShow = workoutSessionId;
      clearActiveWorkout();
      setWorkoutSessionId(null);
      setWorkoutStarted(false);
      const days = program.program_days ?? [];
      const cycle = await getCurrentCycle(clientId, program.id, days);
      setViewingCycle(cycle);
      options?.onFinish?.(sessionIdToShow);
    } finally {
      setWorkoutLoading(false);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const effectiveCompletedSets = activeWorkout
    ? new Set(activeWorkout.completedSets)
    : completedSets;

  const toggleSetComplete = (key: string) => {
    if (!workoutStarted) return;
    if (activeWorkout) {
      toggleCompletedSet(key);
    } else {
      const willBeChecked = !completedSets.has(key);
      setCompletedSets((prev) => {
        const next = new Set(prev);
        if (willBeChecked) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  };

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

  const days = program?.program_days ?? [];
  const selectedDay = days[dayIndex];

  return {
    program,
    loading,
    selectedDay,
    clientId,
    workoutStarted,
    workoutLoading,
    activeWorkout,
    elapsedSeconds,
    effectiveCompletedSets,
    startWorkout,
    onFinishWorkout,
    toggleSetComplete,
    pauseActiveWorkout,
    resumeActiveWorkout,
    formatDuration,
    openVideo,
    refetch: load,
  };
}
