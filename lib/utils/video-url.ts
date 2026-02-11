/**
 * YouTube URL and thumbnail helpers (no Mux server dependency)
 */

export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  const shortsPattern = /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const shortsMatch = cleanUrl.match(shortsPattern);
  if (shortsMatch?.[1]) return shortsMatch[1];
  const watchPattern = /(?:youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/;
  const watchMatch = cleanUrl.match(watchPattern);
  if (watchMatch?.[1]) return watchMatch[1];
  const shortPattern = /youtu\.be\/([a-zA-Z0-9_-]{11})/;
  const shortMatch = cleanUrl.match(shortPattern);
  if (shortMatch?.[1]) return shortMatch[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
  return null;
}

export function getYouTubeThumbnailUrl(
  url: string,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'
): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  const map: Record<string, string> = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    maxres: 'maxresdefault.jpg',
  };
  return `https://img.youtube.com/vi/${videoId}/${map[quality]}`;
}

/** Mux thumbnail from playback ID (public URL, no API key needed) */
export function getMuxThumbnailUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
}

/** Thumbnail URL for a single content item (YouTube or Mux) */
export function getContentThumbnailUrl(content: {
  content_type?: string;
  video_url?: string;
  mux_playback_id?: string | null;
} | null | undefined): string | null {
  if (!content) return null;
  if (content.content_type === 'upload' && content.mux_playback_id) {
    return getMuxThumbnailUrl(content.mux_playback_id);
  }
  if (content.video_url) {
    return getYouTubeThumbnailUrl(content.video_url, 'high');
  }
  if (content.mux_playback_id) {
    return getMuxThumbnailUrl(content.mux_playback_id);
  }
  return null;
}
