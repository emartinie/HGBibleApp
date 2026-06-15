// Compatibility stub: restore the real production week engine when available.
// Sandbox currently includes data/week49.json only, so boot to that week.
export const TOTAL_WEEKS = 52;

export function getWeekNumber() {
  return 49;
}
