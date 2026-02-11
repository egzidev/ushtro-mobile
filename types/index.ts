// Core type definitions (aligned with ushtro web app)

export type UserRole = 'trainer' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Trainer {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Client {
  id: string;
  trainer_id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Program {
  id: string;
  trainer_id: string;
  name: string;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramDay {
  id: string;
  program_id: string;
  day_index: number;
  title: string | null;
  is_rest_day?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramExercise {
  id: string;
  program_day_id: string;
  content_id: string;
  sets: number | null;
  reps: string | null;
  rest: string | null;
  tempo: string | null;
  notes: string | null;
  exercise_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramExerciseSet {
  id: string;
  set_index: number;
  reps: string | null;
  rest: string | null;
}

export interface ClientProgram {
  id: string;
  client_id: string;
  program_id: string;
  assigned_at: string;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export type ContentType = 'youtube' | 'upload';

export interface Content {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  video_url: string;
  content_type: ContentType;
  mux_asset_id?: string | null;
  mux_playback_id?: string | null;
  mux_thumbnail_url?: string | null;
  created_at: string;
}
