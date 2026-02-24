import { supabase } from "@/lib/supabase";

export interface ClientProgramWithDetails {
  id: string;
  program_id: string;
  assigned_at: string;
  start_date: string | null;
  locked: boolean;
  programs: {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    day_count?: number;
    exercise_count?: number;
    video_count?: number;
    program_days?: Array<{
      id: string;
      day_index: number;
      title: string | null;
      is_rest_day?: boolean;
      program_exercises?: Array<{
        id: string;
        content_id: string;
        sets: number | null;
        reps: string | null;
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
          mux_thumbnail_url?: string | null;
          videoPreviewUrl?: string;
        } | null;
      }>;
    }>;
  } | null;
}

export async function fetchMyPrograms(): Promise<ClientProgramWithDetails[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) throw new Error("Client not found");

  const { data: clientPrograms, error: programsError } = await supabase
    .from("client_programs")
    .select(
      `
      id,
      program_id,
      assigned_at,
      locked,
      programs:program_id (
        id,
        name,
        created_at,
        updated_at,
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
            program_exercise_sets (set_index, reps, rest),
            content:content_id (
              id,
              title,
              video_url,
              content_type,
              mux_playback_id,
              mux_thumbnail_url
            )
          )
        )
      )
    `,
    )
    .eq("client_id", client.id)
    .order("assigned_at", { ascending: false });

  if (programsError) throw new Error("Failed to fetch programs");

  const result: ClientProgramWithDetails[] = (clientPrograms || []).map(
    (cp: any) => {
      const program = cp.programs;
      let dayCount = 0;
      let exerciseCount = 0;
      let videoCount = 0;

      if (program?.program_days) {
        dayCount = program.program_days.length;
        for (const day of program.program_days) {
          if (day.program_exercises) {
            exerciseCount += day.program_exercises.length;
            for (const ex of day.program_exercises) {
              if (ex.content?.video_url || ex.content?.mux_playback_id)
                videoCount++;
              if (
                ex.content?.content_type === "youtube" &&
                ex.content?.video_url
              ) {
                ex.content.videoPreviewUrl = ex.content.video_url;
              } else if (ex.content?.mux_playback_id) {
                ex.content.videoPreviewUrl = ex.content.mux_playback_id;
              }
            }
          }
        }
      }

      return {
        ...cp,
        programs: program
          ? {
              ...program,
              day_count: dayCount,
              exercise_count: exerciseCount,
              video_count: videoCount,
            }
          : null,
      };
    },
  );

  return result;
}
