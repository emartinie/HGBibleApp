(function () {

  const DATA_PATH = "data/sukkotcount.json";

  const els = {
    dayNumber: document.getElementById("sukkotDayNumber"),
    title: document.getElementById("sukkotTitle"),
    hebrew: document.getElementById("sukkotHebrew"),
    progress: document.getElementById("sukkotProgressBar"),

    phase: document.getElementById("sukkotPhase"),
    theme: document.getElementById("sukkotTheme"),
    detail: document.getElementById("sukkotDetail"),

    medTitle: document.getElementById("sukkotMeditationTitle"),
    medText: document.getElementById("sukkotMeditationText"),
    medPrayer: document.getElementById("sukkotMeditationPrayer"),
    medScripture: document.getElementById("sukkotMeditationScripture")
  };

  let sukkotData = null;

  // ---------- LOAD ----------
  async function initSukkot() {
    try {
      const res = await fetch(DATA_PATH);
      sukkotData = await res.json();

      if (!sukkotData) {
        renderError("No Sukkot data found");
        return;
      }

      renderToday();
    } catch (err) {
      console.error(err);
      renderError("Failed to load Sukkot data");
    }
  }

  // ---------- RENDER ----------
  function renderToday() {

    const today = sukkotData.current || sukkotData.days?.[0];

    if (!today) {
      renderError("No active Sukkot day");
      return;
    }

    // HEADER
    els.dayNumber.textContent = today.day ?? "--";
    els.title.textContent = today.title ?? "Sukkot";
    els.hebrew.textContent = today.hebrew ?? "";

    // PROGRESS
    const percent = sukkotData.totalDays
      ? (today.day / sukkotData.totalDays) * 100
      : 0;

    els.progress.style.width = `${percent}%`;

    // META
    els.phase.textContent = `Day ${today.day}`;
    els.theme.textContent = today.theme ?? "—";
    els.detail.textContent = today.detail ?? "—";

    // MEDITATION
    els.medTitle.textContent = today.meditation?.title ?? "";
    els.medText.textContent = today.meditation?.text ?? "";
    els.medPrayer.textContent = today.meditation?.prayer ?? "";
    els.medScripture.textContent = today.meditation?.scripture ?? "";
  }

  // ---------- ERROR ----------
  function renderError(msg) {
    if (!els.title) return;
    els.title.textContent = msg;
    els.dayNumber.textContent = "--";
    els.hebrew.textContent = "—";
  }

  // ---------- NAV HOOKS ----------
  function bindNav() {
    const home = document.getElementById("sukkotHome");
    const prev = document.getElementById("sukkotPrev");
    const next = document.getElementById("sukkotNext");

    if (home) {
      home.onclick = () => window.loadCard?.("home");
    }

    if (prev) {
      prev.onclick = () => console.log("Sukkot prev (future state engine hook)");
    }

    if (next) {
      next.onclick = () => console.log("Sukkot next (future state engine hook)");
    }
  }

  // ---------- BOOT ----------
  document.addEventListener("DOMContentLoaded", () => {
    initSukkot();
    bindNav();
  });

})();
