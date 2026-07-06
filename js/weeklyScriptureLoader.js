const LANGUAGE_LABELS = { english: "English", hebrew: "Hebrew", greek: "Greek" };

function selectedWeek() {
  return Number(document.getElementById("weekSelect")?.value || window.currentWeek || 1);
}

function weekCandidates(language, week) {
  const padded = String(week).padStart(2, "0");
  return [...new Set([`scripture/${language}/week${week}.html`, `scripture/${language}/week${padded}.html`])];
}

async function fetchFirstAvailable(paths) {
  for (const path of paths) {
    const response = await fetch(path);
    if (response.ok) return { html: await response.text(), path };
  }
  throw new Error(`No weekly Scripture file found: ${paths.join(", ")}`);
}

function extractStudy(html) {
  const copy = new DOMParser().parseFromString(html, "text/html");
  copy.querySelectorAll("script, style, meta, link, title").forEach(node => node.remove());
  const study = copy.querySelector("main, .week-wrapper") || copy.body;

  // "This Week in View" has already established the week, portion, and references.
  // Keep this room focused on the text rather than repeating the orientation.
  study.querySelector(".week-label")?.remove();
  study.querySelector("h1")?.remove();
  study.querySelector("h2")?.remove();
  study.querySelector(".reading-list")?.remove();

  return study.innerHTML;
}

export function initWeeklyScriptureLoader() {
  const container = document.getElementById("weeklyScriptureContainer");
  const meta = document.getElementById("weeklyScriptureMeta");
  if (!container || !meta || container.dataset.loaderReady === "true") return;

  container.dataset.loaderReady = "true";
  let language = "english";
  let week = selectedWeek();
  let requestId = 0;
  const buttons = {
    english: document.getElementById("langEnglishBtn"),
    hebrew: document.getElementById("langHebrewBtn"),
    greek: document.getElementById("langGreekBtn")
  };

  function updateControls() {
    Object.entries(buttons).forEach(([key, button]) => {
      if (!button) return;
      const active = key === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  async function load(nextWeek = week, nextLanguage = language) {
    week = Math.max(1, Math.min(54, Number(nextWeek) || 1));
    language = nextLanguage;
    const thisRequest = ++requestId;
    updateControls();
    meta.textContent = `Week ${week} · ${LANGUAGE_LABELS[language]}`;
    container.setAttribute("aria-busy", "true");
    container.innerHTML = '<p class="mainstage-loading">Opening this week’s Scripture…</p>';
    try {
      const result = await fetchFirstAvailable(weekCandidates(language, week));
      if (thisRequest !== requestId) return;
      container.innerHTML = extractStudy(result.html);
      container.dataset.source = result.path;
    } catch (error) {
      if (thisRequest !== requestId) return;
      container.innerHTML = `<div class="mainstage-scripture-error"><strong>${LANGUAGE_LABELS[language]} text is not available for Week ${week}.</strong><span>Choose another language or week to continue.</span></div>`;
      console.warn("Weekly Scripture load failed", error);
    } finally {
      if (thisRequest === requestId) container.setAttribute("aria-busy", "false");
    }
  }

  Object.entries(buttons).forEach(([key, button]) => button?.addEventListener("click", () => load(week, key)));
  document.getElementById("weeklyScriptureReloadBtn")?.addEventListener("click", () => load());
  document.addEventListener("weekChanged", event => load(event.detail?.week || selectedWeek()));
  load();
}
