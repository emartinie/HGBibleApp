// Keep these IDs fixed when moving studies to different weeks.
const studyIds = [
  'bereshit', 'noach', 'lech-lecha', 'vayera', 'chayei-sarah', 'toledot',
  'vayetzei', 'vayishlach', 'vayeshev', 'miketz', 'vayigash', 'vayechi',
  'shemot', 'vaera', 'bo', 'beshalach', 'yitro', 'mishpatim',
  'terumah', 'tetzaveh', 'ki-tisa', 'vayakhel', 'pekudei', 'vayikra',
  'tzav', 'shemini', 'tazria', 'metzora', 'acharei-mot', 'kedoshim',
  'emor', 'behar', 'bechukotai', 'bamidbar', 'nasso', 'behaalotcha',
  'shlach', 'korach', 'chukat', 'balak', 'pinchas', 'matot',
  'masei', 'devarim', 'vaetchanan', 'eikev', 'reeh', 'shoftim',
  'ki-teitzei', 'ki-tavo', 'nitzavim', 'vayelech', 'haazinu', 'vezot-haberakhah',
];
const weeks = new Map(studyIds.map((id, index) => [id, index + 1]));
export const STUDY_COUNT = studyIds.length;
export const weekForStudy = id => weeks.get(id);
export const studyForWeek = week => Number.isInteger(week) ? studyIds[week - 1] : undefined;

export function studyReadingUrl(root, week) {
  const id = studyForWeek(week);
  if (!id) return null;
  const url = new URL(root);
  url.searchParams.set('card', 'mainstage');
  url.searchParams.set('study', id);
  return url;
}

export function discussionReading(body, root) {
  const match = String(body ?? '').match(/(?:^|\n)Reading: (https?:\/\/[^\s]+)\s*$/);
  if (!match) return null;
  let url;
  try { url = new URL(match[1]); } catch { return null; }
  if (url.origin !== root.origin || url.pathname !== root.pathname ||
      url.username || url.password || url.searchParams.get('card') !== 'mainstage') return null;
  const id = url.searchParams.get('study');
  // Legacy companion links used the original pilot's week numbering.
  const legacy = ['bereshit', 'noach', 'lech-lecha'][Number(url.searchParams.get('week')) - 1];
  return studyReadingUrl(root, weekForStudy(id ?? legacy));
}
