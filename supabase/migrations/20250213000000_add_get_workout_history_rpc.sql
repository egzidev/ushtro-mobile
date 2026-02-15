-- Single RPC to fetch workout history (replaces 4 frontend calls with 1)
-- Call with user_id; returns full history with set counts and thumbnail content

CREATE OR REPLACE FUNCTION get_workout_history(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_result jsonb;
BEGIN
  SELECT id INTO v_client_id FROM clients WHERE user_id = p_user_id LIMIT 1;
  IF v_client_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  WITH ws AS (
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
    FROM workout_sessions ws
    JOIN programs p ON p.id = ws.program_id
    JOIN program_days pd ON pd.id = ws.program_day_id
    WHERE ws.client_id = v_client_id
      AND ws.completed_at IS NOT NULL
    ORDER BY ws.completed_at DESC
  ),
  set_counts AS (
    SELECT es.workout_session_id, COUNT(*)::int AS cnt
    FROM exercise_sessions es
    JOIN set_logs sl ON sl.exercise_session_id = es.id AND sl.is_completed = true
    WHERE es.workout_session_id IN (SELECT id FROM ws)
    GROUP BY es.workout_session_id
  ),
  first_ex_content AS (
    SELECT DISTINCT ON (pe.program_day_id)
      pe.program_day_id,
      jsonb_build_object(
        'video_url', c.video_url,
        'content_type', c.content_type,
        'mux_playback_id', c.mux_playback_id
      ) AS content
    FROM program_exercises pe
    JOIN content c ON c.id = pe.content_id
    WHERE pe.program_day_id IN (SELECT program_day_id FROM ws)
    ORDER BY pe.program_day_id, pe.exercise_order ASC
  )
  SELECT jsonb_agg(prog ORDER BY first_ts DESC NULLS LAST)
  INTO v_result
  FROM (
    SELECT
      ws_row.program_id AS "programId",
      ws_row.program_name AS "programName",
      jsonb_agg(
        jsonb_build_object(
          'id', ws_row.id,
          'programId', ws_row.program_id,
          'programName', ws_row.program_name,
          'dayTitle', COALESCE(NULLIF(TRIM(ws_row.day_title), ''), 'Dita ' || (ws_row.day_index + 1)),
          'dayIndex', ws_row.day_index,
          'completedAt', ws_row.completed_at,
          'totalSeconds', ws_row.total_seconds,
          'cycleIndex', COALESCE(ws_row.cycle_index, 0),
          'completedSetsCount', COALESCE(sc.cnt, 0),
          'thumbnailContent', fec.content
        )
        ORDER BY ws_row.completed_at DESC
      ) AS sessions,
      MIN(ws_row.completed_at) AS first_ts
    FROM ws ws_row
    LEFT JOIN set_counts sc ON sc.workout_session_id = ws_row.id
    LEFT JOIN first_ex_content fec ON fec.program_day_id = ws_row.program_day_id
    GROUP BY ws_row.program_id, ws_row.program_name
  ) prog;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Allow authenticated users to call
GRANT EXECUTE ON FUNCTION get_workout_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workout_history(uuid) TO service_role;
