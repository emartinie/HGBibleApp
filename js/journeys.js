console.log("🔥 journeys.js loaded");

// =====================
// JOURNEY INDEX (registry) 
// =====================
window.JOURNEY_INDEX = window.JOURNEY_INDEX || [
  {
    id: "learn-to-pray",
    title: "Learn to Pray",
    file: "data/journeys/learn-to-pray.json"
  },
  {
    id: "27-things-seminary",
    title: "27 Things Seminary Missed",
    file: "data/journeys/27-things.json"
  },
    {
    id: "27-things-seminary",
    title: "Who was Paul?",
    file: "who-was-paul.json"
  }
];

// =====================
// SIMPLE STATE (replace later with stateManager.js)
// =====================
const state = {
  journeys: {
    progress: {}
  }
};

// =====================
// LOAD JOURNEY JSON
// =====================
async function loadJourney(id) {
  const meta = window.JOURNEY_INDEX.find(j => j.id === id);
  if (!meta) throw new Error("Journey not found: " + id);

  const res = await fetch(meta.file);
  if (!res.ok) throw new Error("Failed to load journey JSON");

  return await res.json();
}

// =====================
// RENDER JOURNEY
// =====================
function renderJourney(journey) {
  const progress = state.journeys.progress[journey.id] || {
    completedSteps: [],
    currentStep: journey.steps?.[0]?.id || null
  };

  const completed = progress.completedSteps.length;
  const total = journey.steps.length;

  document.getElementById("journeyTitle").textContent = journey.title;
  document.getElementById("journeyDescription").textContent = journey.description;

  document.getElementById("progressText").textContent =
    `${completed} / ${total} completed`;

  const step = journey.steps.find(s => s.id === progress.currentStep);

  document.getElementById("currentStepTitle").textContent =
    step?.title || "Start journey";
}

// =====================
// LOAD SELECTED JOURNEY
// =====================
async function startJourney(id) {
  if (!id) return;

  const journey = await loadJourney(id);

  // ensure state bucket exists
  if (!state.journeys.progress[id]) {
    state.journeys.progress[id] = {
      completedSteps: [],
      currentStep: journey.steps?.[0]?.id || null
    };
  }

  // show UI
  document.getElementById("journeyCard").style.display = "block";

  renderJourney(journey);

  // wire buttons (simple behavior for now)
  document.getElementById("markCompleteBtn").onclick = () => {
    const progress = state.journeys.progress[id];

    const stepId = progress.currentStep;
    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
    }

    const currentIndex = journey.steps.findIndex(s => s.id === stepId);
    const nextStep = journey.steps[currentIndex + 1];

    progress.currentStep = nextStep?.id || stepId;

    renderJourney(journey);
  };

  document.getElementById("resetJourneyBtn").onclick = () => {
    state.journeys.progress[id] = {
      completedSteps: [],
      currentStep: journey.steps?.[0]?.id || null
    };

    renderJourney(journey);
  };
}

// =====================
// INIT DROPDOWN
// =====================
function initSelector() {
  const select = document.getElementById("journeySelect");

  JOURNEY_INDEX.forEach(j => {
    const opt = document.createElement("option");
    opt.value = j.id;
    opt.textContent = j.title;
    select.appendChild(opt);
  });

  document.getElementById("startJourneyBtn").onclick = () => {
    startJourney(select.value);
  };
}

// =====================
// BOOT
// =====================
function bootJourneyCard() {
  const select = document.getElementById("journeySelect");

  if (!select) {
    console.warn("journeySelect not ready");
    return;
  }

  initSelector();
}

requestAnimationFrame(bootJourneyCard);
