// cardRenderer.js

import { TimeStore } from "./timeStore.js";

export function initializeCardRenderer() {
  TimeStore.subscribe((state) => {
    if (!state.initialized || !state.slice) return;

    renderTodayCard(state.slice);
    renderWeekCard(state.slice);
  });
}


// -------------------
// TODAY CARD
// -------------------

function renderTodayCard(slice) {
  const weekEl = document.getElementById("todayWeek");
  const dayEl = document.getElementById("todayDay");
  const cycleEl = document.getElementById("todayCycle");

  if (weekEl) {
    weekEl.textContent = `Week ${slice.cycleWeek}`;
  }

  if (dayEl) {
    dayEl.textContent = `Day ${slice.dayOfWeek}`;
  }

  if (cycleEl) {
    cycleEl.textContent = `Cycle Day ${slice.cycleDay}`;
  }
}


// -------------------
// WEEK CARD
// -------------------

function renderWeekCard(slice) {
  const boundsEl = document.getElementById("weekBounds");

  if (!boundsEl) return;

  boundsEl.textContent =
    `${slice.weekBounds.startDay}–${slice.weekBounds.endDay}`;
}
