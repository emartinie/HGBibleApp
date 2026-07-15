const DAILY_SCHEDULE_URL = "homegroups_daily_reading_schedule.csv";
const WEEKLY_THEME_URL = "homegroups_weekly_theme_titles.json";

let schedulePromise;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = (rows.shift() || []).map(header => header.replace(/^\uFEFF/, ""));
  return rows.map(values => Object.fromEntries(
    headers.map((header, index) => [header, values[index] || ""])
  ));
}

function buildSchedule(rows) {
  const byWeekAndDay = new Map();

  rows.forEach(row => {
    const week = Number(row.week);
    const day = Number(row.day_number);
    if (!Number.isInteger(week) || !Number.isInteger(day)) return;
    byWeekAndDay.set(`${week}:${day}`, { ...row, week, day_number: day });
  });

  return {
    rows,
    get(week, day) {
      return byWeekAndDay.get(`${Number(week)}:${Number(day)}`) || null;
    }
  };
}

async function loadWeeklyThemes() {
  try {
    const response = await fetch(WEEKLY_THEME_URL);
    if (!response.ok) throw new Error(`Theme schedule request failed (${response.status})`);
    const payload = await response.json();
    return new Map(
      (payload.weeks || []).map(item => [Number(item.week), item.theme_title || ""])
    );
  } catch (error) {
    console.warn("Weekly theme JSON unavailable; using CSV theme titles.", error);
    return new Map();
  }
}

export function loadDailyReadingSchedule() {
  if (!schedulePromise) {
    schedulePromise = Promise.all([
      fetch(DAILY_SCHEDULE_URL).then(response => {
        if (!response.ok) throw new Error(`Daily schedule request failed (${response.status})`);
        return response.text();
      }),
      loadWeeklyThemes()
    ])
      .then(([csvText, themes]) => parseCsv(csvText).map(row => ({
        ...row,
        theme_title: themes.get(Number(row.week)) || row.theme_title || ""
      })))
      .then(buildSchedule)
      .catch(error => {
        schedulePromise = null;
        throw error;
      });
  }

  return schedulePromise;
}

