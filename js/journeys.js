 
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
    id: "who-was-paul",
    title: "Who Was Paul?",
    file: "data/journeys/who-was-paul.json"
  },
  {
    id: "ladder-of-jacob",
    title: "Jacob’s Ladder",
    file: "data/journeys/ladder-of-jacob.json"
  }
];

// =====================
// SIMPLE STATE
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

  if (!meta) {
    throw new Error("Journey not found: " + id);
  }

  const res = await fetch(meta.file);

  if (!res.ok) {
    throw new Error(`Failed to load journey JSON: ${meta.file}`);
  }

  const text = await res.text();

  // empty file fallback
  if (!text.trim()) {
    return {
      id,
      title: "Missing Journey",
      description: "This journey has no content yet.",
      steps: []
    };
  }

  return JSON.parse(text);
}

// =====================
// RENDER CURRENT STEP
// =====================
function renderStep(step, currentIndex, total) {

  console.log("Rendering step:", step?.id);

  // step count
  const stepNumber = document.getElementById("currentStepNumber");

  if (stepNumber) {
    stepNumber.textContent =
      `Step ${currentIndex + 1} of ${total}`;
  }

  // title
  document.getElementById("currentStepTitle").textContent =
    step?.title || "Start Journey";

  // summary
  document.getElementById("currentStepSummary").textContent =
    step?.summary || "";

  // article link
  document.getElementById("currentStepArticle").innerHTML =
    step?.article
      ? `
        <a href="?card=articles&file=${step.article}">
          Open Teaching →
        </a>
      `
      : "";

  // reflections
  document.getElementById("currentStepReflection").innerHTML =
    step?.reflection?.length
      ? step.reflection.map(r => `<li>${r}</li>`).join("")
      : "";

  // optional inline content
  document.getElementById("currentStepContent").innerHTML =
    step?.content || "";
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

  // header
  document.getElementById("journeyTitle").textContent =
    journey.title;

  document.getElementById("journeyDescription").textContent =
    journey.description;

  // progress text
  document.getElementById("progressText").textContent =
    `${completed} / ${total} completed`;

  // progress bar
  const percent =
    total ? (completed / total) * 100 : 0;

  document.getElementById("progressFill").style.width =
    `${percent}%`;

  // current step
  const currentIndex =
    journey.steps.findIndex(
      s => s.id === progress.currentStep
    );

  const step =
    journey.steps[currentIndex] ||
    journey.steps[0];

  console.log("Step object:", step);

  renderStep(step, currentIndex, total);
}

// =====================
// LOAD SELECTED JOURNEY
// =====================
async function startJourney(id) {

  if (!id) return;

  const journey = await loadJourney(id);

  // create progress bucket
  if (!state.journeys.progress[id]) {

    state.journeys.progress[id] = {
      completedSteps: [],
      currentStep: journey.steps?.[0]?.id || null
    };
  }

  // show card
  document.getElementById("journeyCard").style.display =
    "block";

  renderJourney(journey);

  // =====================
  // COMPLETE STEP
  // =====================
  document.getElementById("markCompleteBtn").onclick = () => {

    const progress =
      state.journeys.progress[id];

    const stepId =
      progress.currentStep;

    // mark complete
    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
    }

    // next step
    const currentIndex =
      journey.steps.findIndex(
        s => s.id === stepId
      );

    const nextStep =
      journey.steps[currentIndex + 1];

    progress.currentStep =
      nextStep?.id || stepId;

    renderJourney(journey);
  };

  // =====================
  // RESET JOURNEY
  // =====================
  document.getElementById("resetJourneyBtn").onclick = () => {

    state.journeys.progress[id] = {
      completedSteps: [],
      currentStep: journey.steps?.[0]?.id || null
    };

    renderJourney(journey);
  };
}

// =====================
// INIT SELECTOR
// =====================
function initSelector() {

  const select =
    document.getElementById("journeySelect");

  if (!select) {
    console.warn("journeySelect missing");
    return;
  }

  JOURNEY_INDEX.forEach(j => {

    const opt =
      document.createElement("option");

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

  console.log("🪜 bootJourneyCard");

  initSelector();
}

requestAnimationFrame(bootJourneyCard);

