(function () {
  const dayEl = document.getElementById("omerDayNumber");
  const textEl = document.getElementById("omerDayText");
  const hebrewEl = document.getElementById("omerHebrewText");
  const dateEl = document.getElementById("omerDateRange");
  const meditationEl = document.getElementById("omerMeditation");

  const prevBtn = document.getElementById("omerPrevBtn");
  const todayBtn = document.getElementById("omerTodayBtn");
  const nextBtn = document.getElementById("omerNextBtn");

  if (!dayEl || !textEl || !hebrewEl || !dateEl || !meditationEl) return;

  let currentDay = 1;

  function renderOmerDay(day) {
    dayEl.textContent = day;
    textEl.textContent = `Today is day ${day} of the Omer.`;
    hebrewEl.textContent = `Hebrew count for day ${day} goes here.`;
    dateEl.textContent = `Calendar date info for day ${day} goes here.`;
    meditationEl.textContent = `Meditation or reflection for day ${day} goes here.`;
  }

  prevBtn?.addEventListener("click", () => {
    currentDay = Math.max(1, currentDay - 1);
    renderOmerDay(currentDay);
  });

  todayBtn?.addEventListener("click", () => {
    renderOmerDay(currentDay);
  });

  nextBtn?.addEventListener("click", () => {
    currentDay = Math.min(49, currentDay + 1);
    renderOmerDay(currentDay);
  });

  renderOmerDay(currentDay);
})();
