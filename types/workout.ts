/**
 * Execution tracking types (Supabase: workout_sessions, exercise_sessions, set_logs)
 */

export type WorkoutSession = {
  id: string;
  client_id: string;
  program_id: string;
  program_day_id: string;
  started_at: string;
  completed_at: string | null;
  total_seconds: number | null;
  created_at: string;
};

export type ExerciseSession = {
  id: string;
  workout_session_id: string;
  program_exercise_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
};

export type SetLog = {
  id: string;
  exercise_session_id: string;
  set_index: number;
  is_completed: boolean;
  completed_at: string | null;
};
