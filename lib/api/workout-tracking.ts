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
};

export async function getProgramProgress(
  clientId: string,
  programId: string,
  programDays: ProgramDayForCycle[]
): Promise<ProgramProgress> {
  const nonRestDays = programDays
    .filter((d) => !d.is_rest_day)
    .sort((a, b) => a.id.localeCompare(b.id));
  const totalDays = nonRestDays.length;
  if (totalDays === 0) {
    return { completedDays: 0, totalDays: 0, cycleIndex: 0, allComplete: false, nextDayIndex: 0 };
  }

  const cycle = await getCurrentCycle(clientId, programId, programDays);
  const allComplete = await areAllDaysComplete(clientId, programId, programDays);
  const prevCycle = allComplete ? cycle - 1 : cycle;
  const cycleForSquares = allComplete ? cycle : prevCycle;
  let query = supabase
    .from("workout_sessions")
    .select("program_day_id")
    .eq("client_id", clientId)
    .eq("program_id", programId)
    .not("completed_at", "is", null);
  if (cycleForSquares === 0) {
    query = query.or("cycle_index.eq.0,cycle_index.is.null");
  } else {
    query = query.eq("cycle_index", cycleForSquares);
  }
  const { data: sessions } = await query;

  const completedDayIds = new Set(
    (sessions ?? []).map((s) => s.program_day_id)
  );
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
  };
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
