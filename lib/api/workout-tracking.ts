import { getContentThumbnailUrl } from "@/lib/utils/video-url";
import { supabase } from "@/lib/supabase";

type ProgramDayForCycle = { id: string; is_rest_day?: boolean };

export async function getClientId(): Promise<string | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: client, error } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (error || !client) return null;
  return client.id;
}

export async function getCurrentCycle(
  clientId: string,
  programId: string,
  programDays: ProgramDayForCycle[]
): Promise<number> {
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("cycle_index, program_day_id, completed_at")
    .eq("client_id", clientId)
    .eq("program_id", programId)
    .not("completed_at", "is", null);

  if (!sessions || sessions.length === 0) return 0;

  const maxCycle = Math.max(...sessions.map((s) => s.cycle_index ?? 0));
  const nonRestDays = programDays.filter((d) => !d.is_rest_day);
  if (nonRestDays.length === 0) return maxCycle + 1;

  const completedDaysInMaxCycle = new Set(
    sessions
      .filter((s) => (s.cycle_index ?? 0) === maxCycle)
      .map((s) => s.program_day_id)
  );
  const allComplete = nonRestDays.every((d) => completedDaysInMaxCycle.has(d.id));
  return allComplete ? maxCycle + 1 : maxCycle;
}

export async function getSetLogsForDay(
  clientId: string,
  programId: string,
  programDayId: string,
  cycleIndex: number
): Promise<Array<{ program_exercise_id: string; set_index: number }>> {
  let wsQuery = supabase
    .from("workout_sessions")
    .select("id")
    .eq("client_id", clientId)
    .eq("program_id", programId)
    .eq("program_day_id", programDayId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1);
  if (cycleIndex === 0) {
    wsQuery = wsQuery.or("cycle_index.eq.0,cycle_index.is.null");
  } else {
    wsQuery = wsQuery.eq("cycle_index", cycleIndex);
  }
  const { data: ws } = await wsQuery.maybeSingle();

  if (!ws) return [];

  const { data: exSessions } = await supabase
    .from("exercise_sessions")
    .select("id, program_exercise_id")
    .eq("workout_session_id", ws.id);

  if (!exSessions?.length) return [];

  const ids = exSessions.map((e) => e.id);
  const exById = Object.fromEntries(exSessions.map((e) => [e.id, e.program_exercise_id]));

  const { data: logs } = await supabase
    .from("set_logs")
    .select("exercise_session_id, set_index")
    .in("exercise_session_id", ids)
    .eq("is_completed", true);

  if (!logs) return [];
  return logs.map((l) => ({
    program_exercise_id: exById[l.exercise_session_id] ?? "",
    set_index: l.set_index,
  }));
}

export type ProgramProgress = {
  completedDays: number;
  totalDays: number;
  cycleIndex: number;
  allComplete: boolean;
  nextDayIndex: number; // 0-based index of next incomplete day
  completedDayIds: string[];
  /** Duration in seconds for each completed day (program_day_id -> total_seconds) */
  completedDayDurations: Record<string, number | null>;
};

export async function getProgramProgress(
  clientId: string,
  programId: string,
  programDays: ProgramDayForCycle[]
): Promise<ProgramProgress> {
  const nonRestDays = programDays.filter((d) => !d.is_rest_day);
  const totalDays = nonRestDays.length;
  if (totalDays === 0) {
    return { completedDays: 0, totalDays: 0, cycleIndex: 0, allComplete: false, nextDayIndex: 0, completedDayIds: [], completedDayDurations: {} };
  }

  const cycle = await getCurrentCycle(clientId, programId, programDays);
  const allComplete = await areAllDaysComplete(clientId, programId, programDays);
  const prevCycle = allComplete ? cycle - 1 : cycle;
  const cycleForSquares = allComplete ? cycle : prevCycle;
  let query = supabase
    .from("workout_sessions")
    .select("program_day_id, total_seconds")
    .eq("client_id", clientId)
    .eq("program_id", programId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });
  if (cycleForSquares === 0) {
    query = query.or("cycle_index.eq.0,cycle_index.is.null");
  } else {
    query = query.eq("cycle_index", cycleForSquares);
  }
  const { data: sessions } = await query;

  const completedDayIds = new Set<string>();
  const completedDayDurations: Record<string, number | null> = {};
  for (const s of sessions ?? []) {
    if (!completedDayIds.has(s.program_day_id)) {
      completedDayIds.add(s.program_day_id);
      completedDayDurations[s.program_day_id] = s.total_seconds ?? null;
    }
  }
  const completedDays = nonRestDays.filter((d) => completedDayIds.has(d.id)).length;

  let nextDayId: string | null = null;
  for (const d of nonRestDays) {
    if (!completedDayIds.has(d.id)) {
      nextDayId = d.id;
      break;
    }
  }
  const nextDayIndex =
    nextDayId != null
      ? programDays.findIndex((d) => d.id === nextDayId)
      : 0;
  const safeNextIndex = nextDayIndex >= 0 ? nextDayIndex : 0;

  return {
    completedDays,
    totalDays,
    cycleIndex: prevCycle,
    allComplete,
    nextDayIndex: safeNextIndex,
    completedDayIds: Array.from(completedDayIds),
    completedDayDurations,
  };
}

/** Returns YYYY-MM-DD dates when user completed workouts for this program (current cycle only) */
export async function getTrainedDatesForProgram(
  clientId: string,
  programId: string,
  cycleIndex: number = 0
): Promise<string[]> {
  const info = await getWorkoutScheduleForProgram(clientId, programId, cycleIndex);
  return info.trainedDates;
}

/**
 * Returns trained dates + last completion date per cycle.
 * - trainedDates: only dates in the current cycle (for green checks - resets each cycle)
 * - lastCompletionDate: most recent completion in this cycle, or null if new cycle
 * - globalLastCompletion: most recent across all cycles (for nextWorkoutDate)
 */
export async function getWorkoutScheduleForProgram(
  clientId: string,
  programId: string,
  cycleIndex: number
): Promise<{
  trainedDates: string[];
  lastCompletionDate: string | null;
  globalLastCompletion: string | null;
}> {
  const { data: allSessions, error: allError } = await supabase
    .from("workout_sessions")
    .select("completed_at, cycle_index")
    .eq("client_id", clientId)
    .eq("program_id", programId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (allError || !allSessions?.length) {
    return {
      trainedDates: [],
      lastCompletionDate: null,
      globalLastCompletion: null,
    };
  }

  const cycleSessions = allSessions.filter((s) => {
    const c = s.cycle_index ?? 0;
    return cycleIndex === 0 ? c === 0 : c === cycleIndex;
  });

  const cycleDates = new Set<string>();
  let lastInCycle: string | null = null;
  for (const s of cycleSessions) {
    const at = s.completed_at;
    if (typeof at === "string") {
      const d = new Date(at);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      cycleDates.add(dateStr);
      if (!lastInCycle) lastInCycle = dateStr;
    }
  }

  const first = allSessions[0];
  let globalLast: string | null = null;
  if (first?.completed_at && typeof first.completed_at === "string") {
    const d = new Date(first.completed_at);
    globalLast = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return {
    trainedDates: Array.from(cycleDates),
    lastCompletionDate: lastInCycle,
    globalLastCompletion: globalLast,
  };
}

/**
 * Golden Rule: Next Workout Date = Last Completion Date + 1 Day
 * Returns the most recent completion date (YYYY-MM-DD) for this program, or null if none.
 */
export async function getLastCompletionDate(
  clientId: string,
  programId: string
): Promise<string | null> {
  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select("completed_at")
    .eq("client_id", clientId)
    .eq("program_id", programId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1);

  if (error || !sessions?.length) return null;
  const at = sessions[0].completed_at;
  if (typeof at !== "string") return null;
  const d = new Date(at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns next workout date (YYYY-MM-DD) per Golden Rule:
 * nextWorkoutDate = lastCompletionDate + 1 day, or programStartDate if no completions.
 */
export function getNextWorkoutDate(
  lastCompletionDate: string | null,
  programStartDate: string | null
): string {
  if (lastCompletionDate) {
    const d = new Date(lastCompletionDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  if (programStartDate) return programStartDate.slice(0, 10);
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function areAllDaysComplete(
  clientId: string,
  programId: string,
  programDays: ProgramDayForCycle[]
): Promise<boolean> {
  const cycle = await getCurrentCycle(clientId, programId, programDays);
  if (cycle === 0) return false;

  const prevCycle = cycle - 1;
  const nonRestDays = programDays.filter((d) => !d.is_rest_day);
  if (nonRestDays.length === 0) return true;

  let q = supabase
    .from("workout_sessions")
    .select("program_day_id")
    .eq("client_id", clientId)
    .eq("program_id", programId)
    .not("completed_at", "is", null);
  if (prevCycle === 0) {
    q = q.or("cycle_index.eq.0,cycle_index.is.null");
  } else {
    q = q.eq("cycle_index", prevCycle);
  }
  const { data: sessions } = await q;

  if (!sessions?.length) return false;
  const completed = new Set(sessions.map((s) => s.program_day_id));
  return nonRestDays.every((d) => completed.has(d.id));
}

export async function startWorkout(
  clientId: string,
  programId: string,
  programDayId: string,
  cycleIndex: number = 0
): Promise<string | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      client_id: clientId,
      program_id: programId,
      program_day_id: programDayId,
      cycle_index: cycleIndex,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function startExercise(
  workoutSessionId: string,
  programExerciseId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("exercise_sessions")
    .insert({
      workout_session_id: workoutSessionId,
      program_exercise_id: programExerciseId,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function upsertSetLog(
  exerciseSessionId: string,
  setIndex: number,
  isCompleted: boolean
): Promise<boolean> {
  const row = {
    exercise_session_id: exerciseSessionId,
    set_index: setIndex,
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("set_logs").upsert(row, {
    onConflict: "exercise_session_id,set_index",
  });

  return !error;
}

export async function finishExercise(
  exerciseSessionId: string
): Promise<boolean> {
  const { data: session, error: fetchErr } = await supabase
    .from("exercise_sessions")
    .select("started_at")
    .eq("id", exerciseSessionId)
    .single();

  if (fetchErr || !session) return false;

  const started = new Date(session.started_at).getTime();
  const durationSeconds = Math.floor((Date.now() - started) / 1000);

  const { error } = await supabase
    .from("exercise_sessions")
    .update({
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq("id", exerciseSessionId);

  return !error;
}

export type WorkoutHistorySession = {
  id: string;
  programId: string;
  programName: string;
  dayTitle: string;
  dayIndex: number;
  completedAt: string;
  totalSeconds: number | null;
  cycleIndex: number;
  completedSetsCount: number;
  thumbnailUrl: string | null;
};

export type WorkoutSessionDetailExercise = {
  id: string;
  programExerciseId: string;
  title: string;
  completedSetsCount: number;
  totalSets: number;
};

export type WorkoutSessionDetail = {
  id: string;
  programId: string;
  programName: string;
  dayTitle: string;
  completedAt: string;
  totalSeconds: number | null;
  cycleIndex: number;
  exercises: WorkoutSessionDetailExercise[];
};

export type WorkoutHistoryProgram = {
  programId: string;
  programName: string;
  sessions: WorkoutHistorySession[];
};

/**
 * Fetch workout history via RPC (1 call instead of 4).
 * Uses get_workout_history(user_id) which resolves client, sessions, set counts in one DB round-trip.
 */
export async function getWorkoutHistory(): Promise<WorkoutHistoryProgram[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return [];

  const { data: raw, error } = await supabase.rpc("get_workout_history", {
    p_user_id: user.id,
  });

  if (error) {
    console.warn("get_workout_history RPC failed, ensure migration is applied:", error.message);
    return [];
  }
  if (!Array.isArray(raw)) return [];

  return (raw as Array<{
    programId: string;
    programName: string;
    sessions: Array<{
      id: string;
      programId: string;
      programName: string;
      dayTitle: string;
      dayIndex: number;
      completedAt: string;
      totalSeconds: number | null;
      cycleIndex: number;
      completedSetsCount: number;
      thumbnailContent?: { video_url?: string; content_type?: string; mux_playback_id?: string | null } | null;
    }>;
  }>).map((p) => ({
    programId: p.programId,
    programName: p.programName,
    sessions: p.sessions.map((s) => ({
      id: s.id,
      programId: s.programId,
      programName: s.programName,
      dayTitle: s.dayTitle,
      dayIndex: s.dayIndex,
      completedAt: s.completedAt,
      totalSeconds: s.totalSeconds,
      cycleIndex: s.cycleIndex,
      completedSetsCount: s.completedSetsCount,
      thumbnailUrl: s.thumbnailContent
        ? getContentThumbnailUrl(s.thumbnailContent)
        : null,
    })),
  }));
}

const sessionDetailCache = new Map<string, WorkoutSessionDetail>();

/** Return cached session detail if available (no fetch) */
export function getCachedSessionDetail(sessionId: string): WorkoutSessionDetail | null {
  return sessionDetailCache.get(sessionId) ?? null;
}

/**
 * Fetch workout session detail via RPC (1 call instead of 4+).
 * Uses in-memory cache: returns cached data immediately if available.
 * Pass skipCache: true (e.g. on pull-to-refresh) to force a fresh fetch.
 */
export async function getWorkoutSessionDetail(
  sessionId: string,
  options?: { skipCache?: boolean }
): Promise<WorkoutSessionDetail | null> {
  if (!sessionId) return null;

  if (!options?.skipCache) {
    const cached = sessionDetailCache.get(sessionId);
    if (cached) return cached;
  }

  const { data: raw, error } = await supabase.rpc("get_workout_session_detail", {
    p_session_id: sessionId,
  });

  if (error) {
    console.warn("get_workout_session_detail RPC failed:", error.message);
    return null;
  }
  if (!raw || typeof raw !== "object") return null;

  const d = raw as {
    id: string;
    programId: string;
    programName: string;
    dayTitle: string;
    completedAt: string;
    totalSeconds: number | null;
    cycleIndex: number;
    exercises: Array<{
      id: string;
      programExerciseId: string;
      title: string;
      completedSetsCount: number;
      totalSets: number;
    }>;
  };

  const result: WorkoutSessionDetail = {
    id: d.id,
    programId: d.programId,
    programName: d.programName,
    dayTitle: d.dayTitle,
    completedAt: d.completedAt,
    totalSeconds: d.totalSeconds,
    cycleIndex: d.cycleIndex ?? 0,
    exercises: d.exercises ?? [],
  };

  sessionDetailCache.set(sessionId, result);
  return result;
}

export async function finishWorkout(workoutSessionId: string): Promise<boolean> {
  const { data: session, error: fetchErr } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("id", workoutSessionId)
    .single();

  if (fetchErr || !session) return false;

  const started = new Date(session.started_at).getTime();
  const totalSeconds = Math.floor((Date.now() - started) / 1000);

  const { error } = await supabase
    .from("workout_sessions")
    .update({
      completed_at: new Date().toISOString(),
      total_seconds: totalSeconds,
    })
    .eq("id", workoutSessionId);

  return !error;
}
