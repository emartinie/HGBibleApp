// Week 1–3 content context adapter. Read-only; no corpus or Firebase writes.
const ROOT = new URL('../../../../../', import.meta.url);
export const WEEK_IDS = [1,2,3];
export function contextForWeek(data, week) {
  if (!WEEK_IDS.includes(week) || Number(data?.week)!==week) throw new Error('Unexpected weekly study data');
  const title=String(data.english||data.title||('Week '+week));
  const summary=String(data.intro?.summary||'');
  const passages=week===1?['Genesis 1:1–6:8','Isaiah 42:5–43:11','John 1:1–14']:week===2?['Genesis 6:9–11:32','Isaiah 54:1–55:5']:['Genesis 12:1–17:27','2 Kings 4:1–37','Romans 4'];
  return Object.freeze({id:'study:week-'+String(week).padStart(2,'0'),type:'study',week,title,summary,passages,source:'data/week'+week+'.json',commentary:'commentary/week'+week+'.html',terms:week===1?['genesis','creation','beginning','bereshit','isaiah','john']:week===2?['noah','noach','flood','babel','covenant','genesis']:['abram','abraham','lech lecha','covenant','faith','promise','elisha','romans']});
}
export async function loadWeekContext(week) {
  if(!WEEK_IDS.includes(week))throw new Error('Unsupported pilot week');
  const response=await fetch(new URL('data/week'+week+'.json',ROOT),{cache:'no-cache'});
  if(!response.ok)throw new Error('Week '+week+' study data unavailable ('+response.status+')');
  return contextForWeek(await response.json(),week);
}
