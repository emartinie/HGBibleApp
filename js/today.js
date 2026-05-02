import { getWeekNumber } from "./weekEngine.js";

export function initTodayCard() {
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
    sabbath: isSabbath()
  };
}

function getDayOfWeek() {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

function isSabbath() {
  return new Date().getDay() === 6;
}

function renderToday(data) {
  setText("todayDatePretty", data.datePretty);
  setText("todayWeekInfo", `Week ${data.week} • Day ${data.day}`);
  setText(
    "todaySpecialDay",
    data.sabbath ? "🕯 Sabbath" : ""
  );
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
window.initTodayCard = initTodayCard;
