-- Single RPC to fetch workout session detail (replaces 4+ frontend calls with 1)
-- Call with session_id; returns full detail with exercises and set counts

CREATE OR REPLACE FUNCTION get_workout_session_detail(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_ws RECORD;
BEGIN
  SELECT
    ws.id,
    ws.program_id,
    ws.program_day_id,
    ws.completed_at,
    ws.total_seconds,
    ws.cycle_index,
    p.name AS program_name,
    pd.title AS day_title,
    pd.day_index
  INTO v_ws
  FROM workout_sessions ws
  JOIN programs p ON p.id = ws.program_id
  JOIN program_days pd ON pd.id = ws.program_day_id
  WHERE ws.id = p_session_id
    AND ws.completed_at IS NOT NULL;

  IF v_ws.id IS NULL THEN
    RETURN NULL;
  END IF;

  WITH ex_sessions AS (
    SELECT es.id, es.program_exercise_id
    FROM exercise_sessions es
    WHERE es.workout_session_id = p_session_id
  ),
  set_counts AS (
    SELECT sl.exercise_session_id, COUNT(*)::int AS cnt
    FROM set_logs sl
    WHERE sl.exercise_session_id IN (SELECT id FROM ex_sessions)
      AND sl.is_completed = true
    GROUP BY sl.exercise_session_id
  ),
  ex_with_meta AS (
    SELECT
      es.id,
      es.program_exercise_id,
      COALESCE((c.title)::text, 'Ushtrim') AS title,
      COALESCE(
        (SELECT COUNT(*) FROM program_exercise_sets pes WHERE pes.program_exercise_id = es.program_exercise_id),
        0
      )::int AS total_sets,
      COALESCE(sc.cnt, 0)::int AS completed_sets,
      pe.exercise_order
    FROM ex_sessions es
    JOIN program_exercises pe ON pe.id = es.program_exercise_id
    LEFT JOIN content c ON c.id = pe.content_id
    LEFT JOIN set_counts sc ON sc.exercise_session_id = es.id
  )
  SELECT jsonb_build_object(
    'id', v_ws.id,
    'programId', v_ws.program_id,
    'programName', COALESCE(v_ws.program_name, 'Program'),
    'dayTitle', COALESCE(NULLIF(TRIM(v_ws.day_title), ''), 'Dita ' || (COALESCE(v_ws.day_index, 0) + 1)),
    'completedAt', v_ws.completed_at,
    'totalSeconds', v_ws.total_seconds,
    'cycleIndex', COALESCE(v_ws.cycle_index, 0),
    'exercises', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'programExerciseId', e.program_exercise_id,
          'title', e.title,
          'completedSetsCount', e.completed_sets,
          'totalSets', GREATEST(e.total_sets, e.completed_sets)
        )
        ORDER BY e.exercise_order
      )
      FROM ex_with_meta e),
      '[]'::jsonb
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_workout_session_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workout_session_detail(uuid) TO service_role;
