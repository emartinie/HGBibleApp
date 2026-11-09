// Keep these IDs fixed when moving studies to different weeks.
const weeks = new Map([['bereshit', 1], ['noach', 2], ['lech-lecha', 3]]);
export const weekForStudy = id => weeks.get(id);
export const studyForWeek = week => [...weeks].find(([, number]) => number === week)?.[0];

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
