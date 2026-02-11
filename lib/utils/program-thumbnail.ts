import { getMuxThumbnailUrl } from './video-url';
import { getYouTubeThumbnailUrl } from './video-url';

export interface ProgramWithDays {
  program_days?: Array<{
    program_exercises?: Array<{
      content?: {
        video_url?: string;
        videoPreviewUrl?: string;
        content_type?: string;
        mux_playback_id?: string;
      } | null;
    }>;
  }>;
}

export function getFirstVideoThumbnail(program: ProgramWithDays | null | undefined): {
  imageUrl: string | null;
  legacyVideoUrl: string | null;
} {
  let firstContent: {
    content_type?: string;
    mux_playback_id?: string;
    video_url?: string;
    videoPreviewUrl?: string;
  } | null = null;

  if (program?.program_days) {
    for (const day of program.program_days) {
      if (day.program_exercises?.length) {
        const c = day.program_exercises[0].content;
        if (c && (c.mux_playback_id || c.video_url)) {
          firstContent = c;
          break;
        }
      }
    }
  }

  if (!firstContent) return { imageUrl: null, legacyVideoUrl: null };
  if (firstContent.content_type === 'upload' && firstContent.mux_playback_id) {
    return { imageUrl: getMuxThumbnailUrl(firstContent.mux_playback_id), legacyVideoUrl: null };
  }
  const yt = firstContent.video_url ? getYouTubeThumbnailUrl(firstContent.video_url, 'medium') : null;
  if (yt) return { imageUrl: yt, legacyVideoUrl: null };
  const legacy = firstContent.videoPreviewUrl || firstContent.video_url || null;
  return { imageUrl: null, legacyVideoUrl: legacy };
}
