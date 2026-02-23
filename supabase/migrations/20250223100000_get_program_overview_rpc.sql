-- Single RPC to load program overview: client_id, full program (days/exercises/sets/content), and cycle_index.
-- Replaces multiple frontend calls (clients, client_programs, programs+nest, workout_sessions for cycle).

CREATE OR REPLACE FUNCTION get_program_overview(p_program_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_client_id uuid;
  v_result jsonb;
  v_program jsonb;
  v_cycle int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT c.id INTO v_client_id
  FROM clients c
  WHERE c.user_id = v_user_id;

  IF v_client_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM client_programs cp
    WHERE cp.client_id = v_client_id AND cp.program_id = p_program_id
  ) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'program_days', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pd.id,
            'day_index', pd.day_index,
            'title', pd.title,
            'is_rest_day', pd.is_rest_day,
            'program_exercises', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', pe.id,
                    'content_id', pe.content_id,
                    'sets', pe.sets,
                    'reps', pe.reps,
                    'rest', pe.rest,
                    'tempo', pe.tempo,
                    'notes', pe.notes,
                    'exercise_order', pe.exercise_order,
                    'program_exercise_sets', COALESCE(
                      (
                        SELECT jsonb_agg(
                          jsonb_build_object(
                            'set_index', pes.set_index,
                            'reps', pes.reps,
                            'rest', pes.rest
                          )
                          ORDER BY pes.set_index
                        )
                        FROM program_exercise_sets pes
                        WHERE pes.program_exercise_id = pe.id
                      ),
                      '[]'::jsonb
                    ),
                    'content', (
                      SELECT jsonb_build_object(
                        'id', c.id,
                        'title', c.title,
                        'video_url', c.video_url,
                        'content_type', c.content_type,
                        'mux_playback_id', c.mux_playback_id
                      )
                      FROM content c
                      WHERE c.id = pe.content_id
                      LIMIT 1
                    )
                  )
                  ORDER BY pe.exercise_order NULLS LAST
                )
                FROM program_exercises pe
                WHERE pe.program_day_id = pd.id
              ),
              '[]'::jsonb
            )
          )
          ORDER BY pd.day_index
        )
        FROM program_days pd
        WHERE pd.program_id = p.id
      ),
      '[]'::jsonb
    )
  )
  INTO v_program
  FROM programs p
  WHERE p.id = p_program_id;

  IF v_program IS NULL THEN
    RETURN NULL;
  END IF;

  WITH max_cycle AS (
    SELECT COALESCE(MAX(ws.cycle_index), 0) AS m
    FROM workout_sessions ws
    WHERE ws.client_id = v_client_id
      AND ws.program_id = p_program_id
      AND ws.completed_at IS NOT NULL
  ),
  non_rest AS (
    SELECT pd.id
    FROM program_days pd
    WHERE pd.program_id = p_program_id
      AND (pd.is_rest_day IS NULL OR pd.is_rest_day = false)
  ),
  completed_in_max AS (
    SELECT DISTINCT ws.program_day_id
    FROM workout_sessions ws
    JOIN max_cycle mc ON mc.m = ws.cycle_index
    WHERE ws.client_id = v_client_id
      AND ws.program_id = p_program_id
      AND ws.completed_at IS NOT NULL
  )
  SELECT CASE
    WHEN (SELECT COUNT(*)::int FROM non_rest) = 0 THEN (SELECT m + 1 FROM max_cycle)
    WHEN (SELECT COUNT(*)::int FROM non_rest) = (
      SELECT COUNT(*)::int FROM non_rest n
      WHERE EXISTS (SELECT 1 FROM completed_in_max c WHERE c.program_day_id = n.id)
    ) THEN (SELECT m + 1 FROM max_cycle)
    ELSE (SELECT m FROM max_cycle)
  END INTO v_cycle;

  v_result := jsonb_build_object(
    'client_id', v_client_id,
    'program', v_program,
    'cycle_index', v_cycle
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_program_overview(uuid) IS 'Returns client_id, full program with days/exercises/sets/content, and current cycle_index for the authenticated user.';

GRANT EXECUTE ON FUNCTION get_program_overview(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_program_overview(uuid) TO service_role;
