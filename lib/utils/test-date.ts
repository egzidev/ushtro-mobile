/**
 * Override "today" for testing the calendar/week view.
 * Set to a YYYY-MM-DD string to simulate being on that date.
 * Set to null/undefined to use real today.
 *
 * Examples:
 *   TEST_TODAY = "2025-02-24"  → see next week's view
 *   TEST_TODAY = "2025-02-17"  → see this week
 *   TEST_TODAY = null          → use real date (production)
 */
export const TEST_TODAY: string | null = null;
