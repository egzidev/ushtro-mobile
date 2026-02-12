-- Add cycle_index to workout_sessions for program restart/round tracking
-- Cycle 0 = first run, 1 = after first Rifillo, etc.
ALTER TABLE workout_sessions
ADD COLUMN IF NOT EXISTS cycle_index integer NOT NULL DEFAULT 0;
