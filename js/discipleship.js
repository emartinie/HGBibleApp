console.log("[Discipleship] loaded");

// =====================
// JOURNEY INDEX
// =====================
window.JOURNEY_INDEX = [
  {
    id: "learn-to-pray",
    title: "Learn to Pray",
    file: "data/journeys/learn-to-pray.json",
    available: false
  },
  {
    id: "27-things-seminary",
    title: "27 Things",
    file: "data/journeys/27-things.json",
    available: false
  },
  {
    id: "who-was-paul",
    title: "Who Was Paul?",
    file: "data/journeys/who-was-paul.json",
    available: true
  },
  {
    id: "ladder-of-jacob",
    title: "Ladder of Jacob",
    file: "data/journeys/ladder-of-jacob.json",
    available: false
  },
  {
    id: "yeshua-red-letter-patterns",
    title: "Yeshua Red Letter Patterns",
    file: "data/journeys/yeshua-red-letter-patterns.json",
    available: false
  }
];

// =====================
// SIMPLE STATE
// =====================
const state = {
  activeJourney: null,
  currentStepIndex: 0,
  completedSteps: []
};

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setHtml(id, html) {
  const target = el(id);
  if (target) target.innerHTML = html;
}

function setText(id, text) {
  const target = el(id);
  if (target) target.textContent = text || "";
}

// =====================
// LOAD JOURNEY JSON
// =====================
async function loadJourney(id) {
  const meta = window.JOURNEY_INDEX.find(journey => journey.id === id);
  if (!meta) throw new Error("Journey not found: " + id);

  const res = await fetch(meta.file);
  if (!res.ok) throw new Error(`Failed to load journey JSON: ${meta.file}`);

  const text = await res.text();
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

function renderOverview(journey) {
  setText("discipleshipTitle", journey.title || "Discipleship Journey");
  setText("orientationTitle", journey.title || "Selected journey");

  setHtml("moduleOverview", `
    <div class="space-y-2">
      <div class="text-base font-semibold text-cyan-200">
        ${escapeHtml(journey.title || "Untitled Journey")}
      </div>
      <p class="text-slate-300">
        ${escapeHtml(journey.description || "No journey description available.")}
      </p>
      <div class="flex flex-wrap gap-2 text-xs text-slate-400">
        ${journey.category ? `<span class="reader-chip">${escapeHtml(journey.category)}</span>` : ""}
        ${journey.difficulty ? `<span class="reader-chip">${escapeHtml(journey.difficulty)}</span>` : ""}
        ${journey.estimatedTime ? `<span class="reader-chip">${escapeHtml(journey.estimatedTime)}</span>` : ""}
      </div>
    </div>
  `);
}

function renderStep(journey) {
  const steps = Array.isArray(journey.steps) ? journey.steps : [];
  const total = steps.length;
  const currentIndex = Math.min(state.currentStepIndex, Math.max(total - 1, 0));
  const step = steps[currentIndex];

  if (!step) {
    setHtml("moduleContent", `<div class="empty-state">This journey has no steps yet.</div>`);
    setHtml("reflectionContainer", `<div class="empty-state">Reflection prompts will appear here.</div>`);
    setText("moduleMeta", "");
    setText("progressText", "0 / 0 completed");
    const fill = el("progressFill");
    if (fill) fill.style.width = "0%";
    return;
  }

  const completed = state.completedSteps.length;
  const percent = total ? ((currentIndex + 1) / total) * 100 : 0;
  const articleHref = step.article
    ? `?card=articles&file=${encodeURIComponent(step.article)}`
    : "";

  setText("moduleMeta", `Step ${currentIndex + 1} of ${total}`);
  setText("progressText", `Step ${currentIndex + 1} of ${total} - ${completed} completed`);

  const fill = el("progressFill");
  if (fill) fill.style.width = `${percent}%`;

  setHtml("moduleContent", `
    <div class="space-y-4">
      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400">
          Step ${currentIndex + 1} of ${total}
        </div>
        <h3 class="mt-1 text-lg font-semibold text-cyan-200">
          ${escapeHtml(step.title || "Untitled Step")}
        </h3>
      </div>

      <p class="text-slate-300">
        ${escapeHtml(step.summary || "No summary available.")}
      </p>

      ${articleHref ? `
        <a class="reader-chip inline-flex" href="${articleHref}">
          Open Teaching ->
        </a>
      ` : ""}

      ${step.content ? `
        <div class="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
          ${step.content}
        </div>
      ` : ""}

      <div class="flex flex-wrap gap-2 border-t border-slate-700 pt-3">
        <button type="button" class="reader-chip" data-journey-prev>Previous</button>
        <button type="button" class="reader-chip" data-journey-complete>Mark Complete</button>
        <button type="button" class="reader-chip" data-journey-next>Next</button>
        <button type="button" class="reader-chip opacity-80" data-journey-reset>Reset</button>
      </div>
    </div>
  `);

  const reflections = Array.isArray(step.reflection) ? step.reflection : [];
  setHtml("reflectionContainer", reflections.length
    ? reflections.map(prompt => `
        <div class="rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300">
          ${escapeHtml(prompt)}
        </div>
      `).join("")
    : `<div class="empty-state">No reflection prompts for this step.</div>`
  );

  setHtml("notesContainer", `<div class="empty-state">Personal notes are not wired yet.</div>`);
  setHtml("mediaContainer", `<div class="empty-state">Related media is not attached to this journey yet.</div>`);

  el("moduleContent")?.querySelector("[data-journey-prev]")?.addEventListener("click", () => {
    state.currentStepIndex = Math.max(0, state.currentStepIndex - 1);
    renderStep(journey);
  });

  el("moduleContent")?.querySelector("[data-journey-next]")?.addEventListener("click", () => {
    state.currentStepIndex = Math.min(total - 1, state.currentStepIndex + 1);
    renderStep(journey);
  });

  el("moduleContent")?.querySelector("[data-journey-complete]")?.addEventListener("click", () => {
    if (!state.completedSteps.includes(step.id)) {
      state.completedSteps.push(step.id);
    }
    state.currentStepIndex = Math.min(total - 1, state.currentStepIndex + 1);
    renderStep(journey);
  });

  el("moduleContent")?.querySelector("[data-journey-reset]")?.addEventListener("click", () => {
    state.currentStepIndex = 0;
    state.completedSteps = [];
    renderStep(journey);
  });
}

function renderJourney(journey) {
  state.activeJourney = journey;
  state.currentStepIndex = 0;
  state.completedSteps = [];

  renderOverview(journey);
  renderStep(journey);
}

async function startJourney(id) {
  try {
    const journey = await loadJourney(id);
    renderJourney(journey);
  } catch (err) {
    console.error("[Discipleship] journey load failed", err);
    setHtml("moduleOverview", `<p class="text-red-300">Unable to load this journey.</p>`);
  }
}

function initSelector() {
  const list = el("journeyList");
  if (!list) {
    console.warn("[Discipleship] journeyList missing");
    return;
  }

  list.innerHTML = "";

  window.JOURNEY_INDEX.forEach(journey => {
    const item = document.createElement("button");
    item.type = "button";
    item.disabled = !journey.available;
    item.className = journey.available
      ? "w-full rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-left hover:bg-slate-800/80 transition"
      : "w-full rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-left opacity-60 cursor-not-allowed";
    item.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="font-semibold ${journey.available ? "text-cyan-200" : "text-slate-400"}">
          ${escapeHtml(journey.title)}
        </div>
        ${journey.available
          ? `<span class="text-xs text-cyan-300">Available</span>`
          : `<span class="text-xs text-slate-500">Coming soon</span>`}
      </div>
      <div class="mt-1 text-xs text-slate-500">${escapeHtml(journey.file)}</div>
    `;
    if (journey.available) {
      item.addEventListener("click", () => startJourney(journey.id));
    }
    list.appendChild(item);
  });
}

function bootJourneyCard() {
  console.log("[Discipleship] boot");
  initSelector();
}

requestAnimationFrame(bootJourneyCard);
