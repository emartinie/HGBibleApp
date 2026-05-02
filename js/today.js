import { getWeekNumber } from "./weekEngine.js";

document.addEventListener("DOMContentLoaded", initToday);

function initToday() {
  const todayData = getTodayData();
  renderToday(todayData);
}

function getTodayData() {
  const now = new Date();

  return {
    datePretty: now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }),

    week: getWeekNumber(),
    day: getDayOfWeek(),

    sabbath: isSabbath(),

    meditation: {
      title: "Thinking Through Scripture",
      question:
        "If the Torah is written on our hearts, why would obedience become obsolete?",
      oldRef: "Jeremiah 31:33",
      newRef: "Hebrews 8:10"
    }
  };
}

function getDayOfWeek() {
  const day = new Date().getDay();
  return day === 0 ? 7 : day; // Sunday=7, Monday=1 etc if desired
}

function isSabbath() {
  return new Date().getDay() === 6;
}

function renderToday(data) {
  setText("todayDatePretty", data.datePretty);
  setText("todayWeekInfo", `Week ${data.week} • Day ${data.day}`);

  setText(
    "todaySpecialDay",
    data.sabbath ? "🕯 Sabbath" : "Ordinary Day"
  );

  setText("todayMeditationTitle", data.meditation.title);
  setText("todayMeditationQuestion", data.meditation.question);
  setText(
    "todayMeditationRefs",
    `${data.meditation.oldRef} | ${data.meditation.newRef}`
  );
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
