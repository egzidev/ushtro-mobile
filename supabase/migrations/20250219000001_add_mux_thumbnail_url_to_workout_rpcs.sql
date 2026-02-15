-- Add mux_thumbnail_url to RPC responses so getContentThumbnailUrl can resolve thumbnails

CREATE OR REPLACE FUNCTION get_workout_history(
  p_user_id uuid,
  p_from_date timestamptz DEFAULT NULL,
  p_to_date timestamptz DEFAULT NULL
)
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
      AND (p_from_date IS NULL OR ws.completed_at >= p_from_date)
      AND (p_to_date IS NULL OR ws.completed_at <= p_to_date)
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
        'mux_playback_id', c.mux_playback_id,
        'mux_thumbnail_url', c.mux_thumbnail_url
      ) AS content
    FROM program_exercises pe
    JOIN content c ON c.id = pe.content_id
    WHERE pe.program_day_id IN (SELECT program_day_id FROM ws)
    ORDER BY pe.program_day_id, pe.exercise_order ASC
  ),
  prog_agg AS (
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
      ) AS sessions
    FROM ws ws_row
    LEFT JOIN set_counts sc ON sc.workout_session_id = ws_row.id
    LEFT JOIN first_ex_content fec ON fec.program_day_id = ws_row.program_day_id
    GROUP BY ws_row.program_id, ws_row.program_name
  )
  SELECT jsonb_agg(pa ORDER BY COALESCE(cp.assigned_at, '1970-01-01'::timestamptz) DESC)
  INTO v_result
  FROM prog_agg pa
  LEFT JOIN client_programs cp ON cp.program_id = pa."programId" AND cp.client_id = v_client_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Update get_workout_session_detail to include mux_thumbnail_url in thumbnailContent
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
    SELECT es.id AS exercise_session_id, es.program_exercise_id
    FROM exercise_sessions es
    WHERE es.workout_session_id = p_session_id
  ),
  completed_set_indices AS (
    SELECT sl.exercise_session_id, sl.set_index
    FROM set_logs sl
    WHERE sl.exercise_session_id IN (SELECT exercise_session_id FROM ex_sessions)
      AND sl.is_completed = true
  ),
  ex_with_meta AS (
    SELECT
      es.exercise_session_id,
      es.program_exercise_id,
      COALESCE((c.title)::text, 'Ushtrim') AS title,
      COALESCE(
        (SELECT COUNT(*) FROM program_exercise_sets pes WHERE pes.program_exercise_id = es.program_exercise_id),
        0
      )::int AS total_sets,
      (SELECT COUNT(*) FROM completed_set_indices csi WHERE csi.exercise_session_id = es.exercise_session_id)::int AS completed_sets,
      pe.exercise_order,
      jsonb_build_object(
        'video_url', c.video_url,
        'content_type', c.content_type,
        'mux_playback_id', c.mux_playback_id,
        'mux_thumbnail_url', c.mux_thumbnail_url
      ) AS thumbnail_content
    FROM ex_sessions es
    JOIN program_exercises pe ON pe.id = es.program_exercise_id
    LEFT JOIN content c ON c.id = pe.content_id
  ),
  ex_sets AS (
    SELECT
      e.exercise_session_id,
      e.program_exercise_id,
      e.title,
      e.total_sets,
      e.completed_sets,
      e.exercise_order,
      e.thumbnail_content,
      COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'setIndex', pes.set_index,
            'reps', pes.reps,
            'rest', pes.rest,
            'isCompleted', EXISTS (
              SELECT 1 FROM completed_set_indices csi
              WHERE csi.exercise_session_id = e.exercise_session_id
                AND csi.set_index = pes.set_index
            )
          )
          ORDER BY pes.set_index
        )
        FROM program_exercise_sets pes
        WHERE pes.program_exercise_id = e.program_exercise_id),
        '[]'::jsonb
      ) AS sets
    FROM ex_with_meta e
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
          'id', e.exercise_session_id,
          'programExerciseId', e.program_exercise_id,
          'title', e.title,
          'completedSetsCount', e.completed_sets,
          'totalSets', GREATEST(e.total_sets, e.completed_sets),
          'thumbnailContent', e.thumbnail_content,
          'sets', e.sets
        )
        ORDER BY e.exercise_order
      )
      FROM ex_sets e),
      '[]'::jsonb
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;
