/**
 * Format rest duration: detect seconds vs minutes and return a readable string.
 * Input is assumed to be total seconds (number or string).
 * - < 60: "45s"
 * - >= 60: "1m 30s" or "2m"
 */

export function formatRest(value: string | number | null | undefined): string {
  if (value == null || value === "") return "-";

  const totalSeconds = typeof value === "number" ? value : parseInt(String(value), 10);
  if (Number.isNaN(totalSeconds) || totalSeconds < 0) return "-";

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}
