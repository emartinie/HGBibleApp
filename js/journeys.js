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
  const meta = JOURNEY_INDEX.find(j => j.id === id);
  if (!meta) throw new Error("Journey not found");

  const res = await fetch(meta.file);
  return await res.json();
}

async function initJourney() {
  const state = window.state || {
    progress: {
      "learn-to-pray": {
        completedSteps: [],
        currentStep: null
      }
    }
  };

  const journey = await loadJourney("learn-to-pray");

  renderJourney(journey, state);
}

document.addEventListener("DOMContentLoaded", initJourney);

function renderJourney(journey, state) {
  const progress = state.progress?.[journey.id] || {
    completedSteps: [],
    currentStep: journey.steps[0]?.id
  };

  const completed = progress.completedSteps.length;
  const total = journey.steps.length;

  document.getElementById("journeyTitle").textContent = journey.title;
  document.getElementById("journeyDescription").textContent = journey.description;

  document.getElementById("progressText").textContent = `${completed} / ${total} completed`;

  const step = journey.steps.find(s => s.id === progress.currentStep);
  document.getElementById("currentStepTitle").textContent = step?.title || "Start journey";
}
