console.log("[Discipleship] loaded");

(function () {
  const STORAGE_KEY = "hg:discipleship:v1";

  const JOURNEY_INDEX = [
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

  window.JOURNEY_INDEX = JOURNEY_INDEX;

  const state = {
    activeJourney: null,
    currentStepIndex: 0,
    completedSteps: [],
    view: "chooser"
  };

  const journeyCache = new Map();

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setText(id, value) {
    const target = el(id);
    if (target) target.textContent = value || "";
  }

  function setHtml(id, value) {
    const target = el(id);
    if (target) target.innerHTML = value || "";
  }

  function setStatus(message) {
    setText("discipleshipStatus", message);
  }

  function showOnly(view) {
    state.view = view;
    const chooser = el("discipleshipChooser");
    const learning = el("discipleshipLearning");
    const completion = el("discipleshipCompletion");

    if (chooser) chooser.hidden = view !== "chooser";
    if (learning) learning.hidden = view !== "learning";
    if (completion) completion.hidden = view !== "completion";
  }

  function readSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || saved.version !== 1 || !saved.journeyId) return null;
      return saved;
    } catch (error) {
      console.warn("[Discipleship] saved progress was unreadable", error);
      return null;
    }
  }

  function saveState() {
    if (!state.activeJourney) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      journeyId: state.activeJourney.id,
      currentStepIndex: state.currentStepIndex,
      completedSteps: state.completedSteps
    }));
  }

  async function loadJourney(id) {
    if (journeyCache.has(id)) return journeyCache.get(id);

    const meta = JOURNEY_INDEX.find(journey => journey.id === id && journey.available);
    if (!meta) throw new Error("Journey is not available: " + id);

    const response = await fetch(meta.file);
    if (!response.ok) throw new Error(`Failed to load journey JSON: ${meta.file}`);

    const text = await response.text();
    if (!text.trim()) throw new Error("Journey has no content: " + id);

    const journey = JSON.parse(text);
    journeyCache.set(id, journey);
    return journey;
  }

  function normalizeProgress(journey, saved = null) {
    const steps = Array.isArray(journey.steps) ? journey.steps : [];
    const validStepIds = new Set(steps.map(step => step.id).filter(Boolean));
    const completed = Array.isArray(saved?.completedSteps)
      ? saved.completedSteps.filter((id, index, list) =>
          validStepIds.has(id) && list.indexOf(id) === index
        )
      : [];

    state.activeJourney = journey;
    state.completedSteps = completed;
    state.currentStepIndex = Math.max(
      0,
      Math.min(Number(saved?.currentStepIndex) || 0, Math.max(steps.length - 1, 0))
    );
  }

  function isJourneyComplete() {
    const steps = state.activeJourney?.steps || [];
    return steps.length > 0 && state.completedSteps.length === steps.length;
  }

  function journeyMetaHtml(journey) {
    return [
      journey.category,
      journey.difficulty,
      journey.estimatedTime
    ]
      .filter(Boolean)
      .map(value => `<span class="discipleship-chip">${escapeHtml(value)}</span>`)
      .join("");
  }

  function renderChooser() {
    showOnly("chooser");
    setText("discipleshipTitle", "Learning Paths");
    setText(
      "discipleshipSubtitle",
      "Turn study into steady practice without trying to master everything at once."
    );

    const resume = el("discipleshipResume");
    if (resume) {
      resume.hidden = !state.activeJourney;
      if (state.activeJourney) {
        const steps = state.activeJourney.steps || [];
        const completed = state.completedSteps.length;
        setText("discipleshipResumeTitle", state.activeJourney.title || "Current journey");
        setText(
          "discipleshipResumeMeta",
          isJourneyComplete()
            ? `${completed} of ${steps.length} completed · Ready to review`
            : `${completed} of ${steps.length} completed · Step ${state.currentStepIndex + 1}`
        );
        const resumeBtn = el("resumeJourneyBtn");
        if (resumeBtn) {
          resumeBtn.textContent = isJourneyComplete() ? "Review Journey" : "Continue Journey";
        }
      }
    }

    const available = JOURNEY_INDEX.filter(journey => journey.available);
    setHtml("journeyList", available.map(journey => {
      const isCurrent = state.activeJourney?.id === journey.id;
      const action = isCurrent
        ? (isJourneyComplete() ? "Review" : "Continue")
        : "Begin";
      return `
        <button type="button"
                class="discipleship-path"
                data-journey-id="${escapeHtml(journey.id)}"
                ${isCurrent ? 'aria-current="true"' : ""}>
          <span>
            <span class="discipleship-path-title">${escapeHtml(journey.title)}</span>
            <span class="discipleship-path-note">
              ${isCurrent ? "Your saved learning path" : "Ready to begin"}
            </span>
          </span>
          <span class="ui-btn discipleship-primary" aria-hidden="true">${action}</span>
        </button>
      `;
    }).join(""));

    el("journeyList")?.querySelectorAll("[data-journey-id]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.journeyId;
        if (state.activeJourney?.id === id) {
          if (isJourneyComplete()) {
            renderCompletion();
          } else {
            renderLearning();
          }
          return;
        }
        beginJourney(id);
      });
    });

    const upcoming = JOURNEY_INDEX.filter(journey => !journey.available);
    setText(
      "discipleshipUpcomingSummary",
      `Coming later (${upcoming.length})`
    );
    setHtml("discipleshipUpcomingList", upcoming.map(journey => `
      <div class="discipleship-upcoming-item">
        <strong>${escapeHtml(journey.title)}</strong>
        <div class="discipleship-path-note">Journey material is being reviewed.</div>
      </div>
    `).join(""));
  }

  function updateProgress(journey) {
    const steps = Array.isArray(journey.steps) ? journey.steps : [];
    const completed = state.completedSteps.length;
    const percent = steps.length ? Math.round((completed / steps.length) * 100) : 0;

    setText("progressText", `${completed} of ${steps.length} completed`);
    setText(
      "stepPositionText",
      steps.length ? `Step ${state.currentStepIndex + 1} of ${steps.length}` : "No steps"
    );

    const fill = el("progressFill");
    if (fill) fill.style.width = `${percent}%`;

    const progressBar = el("journeyProgressBar");
    if (progressBar) {
      progressBar.setAttribute("aria-valuenow", String(percent));
      progressBar.setAttribute(
        "aria-valuetext",
        `${completed} of ${steps.length} steps completed`
      );
    }
  }

  function renderLearning() {
    const journey = state.activeJourney;
    const steps = Array.isArray(journey?.steps) ? journey.steps : [];

    if (!journey || !steps.length) {
      renderChooser();
      return;
    }

    state.currentStepIndex = Math.max(
      0,
      Math.min(state.currentStepIndex, steps.length - 1)
    );

    const step = steps[state.currentStepIndex];
    const stepCompleted = state.completedSteps.includes(step.id);

    showOnly("learning");
    setText("discipleshipTitle", journey.title || "Discipleship Journey");
    setText("discipleshipSubtitle", journey.description || "");

    setText("activeJourneyTitle", journey.title || "Untitled Journey");
    setText("activeJourneyDescription", journey.description || "");
    setHtml("activeJourneyMeta", journeyMetaHtml(journey));
    updateProgress(journey);

    setText("currentStepEyebrow", `Step ${state.currentStepIndex + 1} of ${steps.length}`);
    setText("currentStepTitle", step.title || "Untitled Step");
    setText("currentStepSummary", step.summary || "No summary available.");

    const content = el("currentStepContent");
    if (content) {
      content.hidden = !step.content;
      content.innerHTML = step.content || "";
    }

    const openTeachingBtn = el("openTeachingBtn");
    if (openTeachingBtn) {
      openTeachingBtn.hidden = !step.article;
      openTeachingBtn.onclick = step.article
        ? () => openTeaching(step.article)
        : null;
    }

    const previousBtn = el("previousStepBtn");
    if (previousBtn) {
      previousBtn.disabled = state.currentStepIndex === 0;
      previousBtn.onclick = () => moveStep(-1);
    }

    const nextBtn = el("nextStepBtn");
    if (nextBtn) {
      nextBtn.disabled = state.currentStepIndex >= steps.length - 1;
      nextBtn.onclick = () => moveStep(1);
    }

    const completeBtn = el("completeStepBtn");
    if (completeBtn) {
      if (stepCompleted) {
        completeBtn.textContent = state.currentStepIndex === steps.length - 1
          ? "Finish Journey"
          : "Continue";
      } else {
        completeBtn.textContent = state.currentStepIndex === steps.length - 1
          ? "Complete Journey"
          : "Complete & Continue";
      }
      completeBtn.onclick = completeCurrentStep;
    }

    const reflections = Array.isArray(step.reflection) ? step.reflection : [];
    const reflectionPanel = el("reflectionPanel");
    if (reflectionPanel) reflectionPanel.hidden = !reflections.length;
    setHtml("reflectionContainer", reflections.map(prompt => `
      <div class="discipleship-reflection">${escapeHtml(prompt)}</div>
    `).join(""));

    saveState();
    setStatus(
      `${journey.title || "Journey"}, step ${state.currentStepIndex + 1} of ${steps.length}`
    );
  }

  function renderCompletion() {
    if (!state.activeJourney) {
      renderChooser();
      return;
    }

    showOnly("completion");
    setText("discipleshipTitle", state.activeJourney.title || "Journey Complete");
    setText("discipleshipSubtitle", "You have completed every step in this learning path.");
    setText(
      "completionTitle",
      `${state.activeJourney.title || "Journey"} completed`
    );
    setText(
      "completionMessage",
      "Your progress is saved. You can review any step or return to the learning-path chooser."
    );
    saveState();
    setStatus("Journey completed.");
  }

  async function beginJourney(id) {
    setStatus("Loading learning path.");

    try {
      const journey = await loadJourney(id);
      normalizeProgress(journey);
      saveState();
      renderLearning();
    } catch (error) {
      console.error("[Discipleship] journey load failed", error);
      setStatus("Unable to load this learning path.");
      setHtml("journeyList", `
        <div class="discipleship-panel text-red-300">
          Unable to load this learning path. Please try again.
        </div>
      `);
    }
  }

  function moveStep(direction) {
    const steps = state.activeJourney?.steps || [];
    if (!steps.length) return;

    state.currentStepIndex = Math.max(
      0,
      Math.min(state.currentStepIndex + direction, steps.length - 1)
    );
    saveState();
    renderLearning();
  }

  function completeCurrentStep() {
    const steps = state.activeJourney?.steps || [];
    const step = steps[state.currentStepIndex];
    if (!step) return;

    if (!state.completedSteps.includes(step.id)) {
      state.completedSteps.push(step.id);
    }

    if (isJourneyComplete()) {
      saveState();
      renderCompletion();
      return;
    }

    const nextIncompleteAfter = steps.findIndex(
      (candidate, index) =>
        index > state.currentStepIndex &&
        !state.completedSteps.includes(candidate.id)
    );
    const anyIncomplete = steps.findIndex(
      candidate => !state.completedSteps.includes(candidate.id)
    );

    state.currentStepIndex = nextIncompleteAfter >= 0
      ? nextIncompleteAfter
      : Math.max(anyIncomplete, 0);

    saveState();
    renderLearning();
  }

  function openTeaching(file) {
    if (!file) return;

    saveState();
    window.pendingArticleFile = file;

    if (typeof window.loadCard === "function") {
      window.loadCard("articles");
      return;
    }

    window.location.href = `?card=articles&file=${encodeURIComponent(file)}`;
  }

  function resetJourney() {
    if (!state.activeJourney) return;
    const confirmed = window.confirm(
      "Start this learning path over? Its saved completion progress will be cleared."
    );
    if (!confirmed) return;

    state.currentStepIndex = 0;
    state.completedSteps = [];
    saveState();
    renderLearning();
    setStatus("Journey progress reset.");
  }

  async function restoreSavedJourney() {
    const saved = readSavedState();
    if (!saved) return;

    const meta = JOURNEY_INDEX.find(
      journey => journey.id === saved.journeyId && journey.available
    );
    if (!meta) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    try {
      const journey = await loadJourney(saved.journeyId);
      normalizeProgress(journey, saved);
    } catch (error) {
      console.warn("[Discipleship] saved journey could not be restored", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function bindStaticControls() {
    const resumeBtn = el("resumeJourneyBtn");
    if (resumeBtn) {
      resumeBtn.onclick = () => {
        if (isJourneyComplete()) {
          renderCompletion();
        } else {
          renderLearning();
        }
      };
    }

    const changeBtn = el("changeJourneyBtn");
    if (changeBtn) changeBtn.onclick = renderChooser;

    const resetBtn = el("resetJourneyBtn");
    if (resetBtn) resetBtn.onclick = resetJourney;

    const reviewBtn = el("reviewJourneyBtn");
    if (reviewBtn) {
      reviewBtn.onclick = () => {
        state.currentStepIndex = 0;
        saveState();
        renderLearning();
      };
    }

    const completionPathsBtn = el("completionPathsBtn");
    if (completionPathsBtn) completionPathsBtn.onclick = renderChooser;
  }

  async function initDiscipleshipCard() {
    console.log("[Discipleship] boot");

    bindStaticControls();

    if (!state.activeJourney) {
      await restoreSavedJourney();
    }

    if (state.view === "learning" && state.activeJourney) {
      renderLearning();
    } else if (state.view === "completion" && state.activeJourney) {
      renderCompletion();
    } else {
      renderChooser();
    }
  }

  function destroyDiscipleshipCard() {
    // State remains in memory and localStorage so navigating away does not lose progress.
  }

  window.initDiscipleshipCard = initDiscipleshipCard;
  window.destroyDiscipleshipCard = destroyDiscipleshipCard;
})();
