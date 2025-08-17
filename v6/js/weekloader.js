const sections = [
  "introContent",
  "studyIntroContent",
  "audioContent",
  "scripturesContent",
  "commentaryContent",
  "deeperLearningContent",
  "alephTavsContent",
  "printoutsContent",
  "kidsCornerContent",
  "wordsOfTheWeekContent"
];

// Set your start date for week 1 here:
  const START_DATE = new Date("2025-01-05T00:00:00Z");

  // Calculate current week number based on today's date
  function getCurrentWeekNumber() {
    const today = new Date();
    const diffMs = today - START_DATE;
    if(diffMs < 0) return 1; // before start date, default to week 1
    const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1;
    return diffWeeks;
  }

  // Global current week state
  let currentWeek = getCurrentWeekNumber();

  // UI Elements
  const weekInfoEl = document.getElementById("weekInfo");
  const prevWeekBtn = document.getElementById("prevWeekBtn");
  const nextWeekBtn = document.getElementById("nextWeekBtn");

  // Disable Prev if week 1; disable Next if week 52 (or max)
  function updateButtons() {
    prevWeekBtn.disabled = currentWeek <= 1;
    nextWeekBtn.disabled = currentWeek >= 52;
  }


async function loadWeek(week) {
  currentWeek = week;
  const response = await fetch(`json/week${week}.json`);
  const data = await response.json();

  sections.forEach(sectionId => {
    const el = document.getElementById(sectionId);
    if(el && data[sectionId]) {
      el.innerHTML = data[sectionId];
    } else if(el) {
      el.innerHTML = "No content available.";
    }
  });
}

// Dropdown & nav
document.getElementById("weekSelect").addEventListener("change", e => {
  loadWeek(parseInt(e.target.value));
});

document.getElementById("prevWeek").addEventListener("click", () => {
  if(currentWeek > 1) loadWeek(currentWeek - 1);
});

document.getElementById("nextWeek").addEventListener("click", () => {
  loadWeek(currentWeek + 1);
});

  // Load JSON for current week and render
  async function loadWeek(weekNum) {
    try {
      const response = await fetch(`./weeks/week${weekNum}.json`);
      if(!response.ok) throw new Error(`Week data not found: week${weekNum}.json`);
      const data = await response.json();
      data.week = weekNum; // fallback if missing
      renderWeek(data);
    } catch (err) {
      weekInfoEl.textContent = `Error loading week ${weekNum}: ${err.message}`;
      console.error(err);
    }
  }

  // Button handlers
  prevWeekBtn.addEventListener("click", () => {
    if(currentWeek > 1) {
      currentWeek--;
      updateButtons();
      loadWeek(currentWeek);
    }
  });

  nextWeekBtn.addEventListener("click", () => {
    if(currentWeek < 52) {
      currentWeek++;
      updateButtons();
      loadWeek(currentWeek);
    }
  });

  // Initial load
  updateButtons();
  loadWeek(currentWeek);