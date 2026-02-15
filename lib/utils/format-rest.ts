const ALBANIAN_MONTHS = [
  "Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor",
  "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor",
];

const SHORT_MONTHS_AL = [
  "Jan", "Shk", "Mar", "Pri", "Maj", "Qer",
  "Kor", "Gus", "Sht", "Tet", "Nën", "Dhj",
];

/**
 * Format date as DD MMM (Albanian abbreviations, e.g. "05 Shk")
 */
export function formatDateDDMMM(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDate().toString().padStart(2, "0");
  const month = SHORT_MONTHS_AL[d.getMonth()];
  return `${day} ${month}`;
}

/**
 * Format duration as mm:ss (zero-padded)
 */
export function formatDurationMMSS(seconds: number | null | undefined): string {
  if (seconds == null) return "00:00";
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Format date for display (e.g. "Dje", "Sot", "12 Shkurt 2026")
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Sot";
  if (d.toDateString() === yesterday.toDateString()) return "Dje";
  const day = d.getDate();
  const month = ALBANIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format workout duration for display after completion.
 * - < 60 sec: "45 sek"
 * - 1–59 min: "12 min"
 * - >= 1 h: "1 orë 23 min"
 */
export function formatWorkoutDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "-";
  const total = Math.floor(seconds);
  if (total < 60) return `${total} sek`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours} orë ${minutes} min` : `${hours} orë`;
  }
  return `${minutes} min`;
}

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
