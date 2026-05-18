console.log("🔥 journeys.js loaded");

const JOURNEY_INDEX = [
  {
    id: "learn-to-pray",
    file: "data/journeys/learn-to-pray.json"
  },
  {
    id: "27-things-seminary",
    file: "data/journeys/27-things.json"
  }
];

async function loadJourney(id) {
  console.log("📦 loading journey:", id);

  const meta = JOURNEY_INDEX.find(j => j.id === id);
  if (!meta) throw new Error("Journey not found");

  const res = await fetch(meta.file);
  return await res.json();
}

function renderJourney(journey, state) {
  console.log("🔥 renderJourney CALLED", journey);

  const progress = state.journeys?.progress?.[journey.id] || {
    completedSteps: [],
    currentStep: journey.steps?.[0]?.id
  };

  const completed = progress.completedSteps.length;
  const total = journey.steps.length;

  const title = document.getElementById("journeyTitle");
  const desc = document.getElementById("journeyDescription");
  const progressText = document.getElementById("progressText");
  const stepTitle = document.getElementById("currentStepTitle");

  if (!title || !desc || !progressText || !stepTitle) {
    console.warn("Journey DOM not ready yet");
    return;
  }

  title.textContent = journey.title;
  desc.textContent = journey.description;
  progressText.textContent = `${completed} / ${total} completed`;

  const step = journey.steps.find(s => s.id === progress.currentStep);
  stepTitle.textContent = step?.title || "Start journey";
}

async function initJourney() {
  const state = window.state || {
    journeys: { progress: {} }
  };

  const journey = await loadJourney("learn-to-pray");

  renderJourney(journey, state);
}

/**
 * IMPORTANT:
 * Do NOT use DOMContentLoaded inside dynamic loaders
 */
requestAnimationFrame(() => {
  initJourney();
});
