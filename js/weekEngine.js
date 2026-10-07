export const START_DATE = new Date("2024-10-19T00:00:00Z");
export const TOTAL_WEEKS = 52;
// Align October 6, 2026 with Week 1, preserving the existing UTC rollover.
const WEEK_OFFSET = 2;
const WEEK_MS = 1000 * 60 * 60 * 24 * 7;

export function getWeekNumber(date = new Date()) {
  const diffMs = date - START_DATE;

  if (diffMs < 0) return 1;

  return (Math.floor(diffMs / WEEK_MS) + WEEK_OFFSET) % TOTAL_WEEKS + 1;
}

export function getCycleDay(date = new Date()) {
  const diffMs = date - START_DATE;

  if (diffMs < 0) return 1;

  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) % 7 + 1;
}

export function getCycleInfo(date = new Date()) {
  return {
    week: getWeekNumber(date),
    day: getCycleDay(date)
  };
}
