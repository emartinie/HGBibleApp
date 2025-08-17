// --- CONFIG ---
const START_DATE = new Date("2025-01-05T00:00:00Z"); // Week 1 starts here
const TOTAL_WEEKS = 52; // Adjust if needed
let currentWeek = calculateCurrentWeek();

// --- HELPERS ---
function calculateCurrentWeek() {
  const now = new Date();
  const diff = now - START_DATE;
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(Math.max(week, 1), TOTAL_WEEKS);
}

function getWeekFileName(weekNum) {
  return `weeks/week${weekNum}.json`;
}

// --- UI UPDATERS ---
function updateWeekInfo() {
  const weekInfo = document.getElementById("weekInfo");
  if (weekInfo) {
    weekInfo.textContent = `Week ${currentWeek}`;
  }
}

function populateWeekMenu() {
  const select = document.getElementById("weekSelect");
  if (!select) return;

  select.innerHTML = ""; // Clear old options
  for (let i = 1; i <= TOTAL_WEEKS; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Week ${i}`;
    if (i === currentWeek) opt.selected = true;
    select.appendChild(opt);
  }
}

// --- MAIN LOADER ---
async function loadWeekData(weekNum) {
  currentWeek = weekNum;
  updateWeekInfo();

  try {
    const response = await fetch(getWeekFileName(weekNum));
    if (!response.ok) throw new Error(`Week ${weekNum} not found`);
    const data = await response.json();

    // TODO: replace this with your renderWeekSections()
    console.log("Loaded week", weekNum, data);
  } catch (err) {
    console.error("Error loading week:", err);
    document.getElementById("weekInfo").textContent = `Error loading Week ${weekNum}`;
  }
}

// --- NAVIGATION ---
function setupNavigation() {
  const prevBtn = document.getElementById("prevWeek");
  const nextBtn = document.getElementById("nextWeek");
  const select = document.getElementById("weekSelect");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentWeek > 1) loadWeekData(currentWeek - 1);
      if (select) select.value = currentWeek;
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentWeek < TOTAL_WEEKS) loadWeekData(currentWeek + 1);
      if (select) select.value = currentWeek;
    });
  }

  if (select) {
    select.addEventListener("change", (e) => {
      loadWeekData(parseInt(e.target.value, 10));
    });
  }
}

// --- DARK MODE ---
function setupDarkMode() {
  const toggleDark = document.getElementById("toggleDark");
  if (!toggleDark) return;

  toggleDark.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
  });
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  populateWeekMenu();
  setupNavigation();
  setupDarkMode();
  loadWeekData(currentWeek);
});
