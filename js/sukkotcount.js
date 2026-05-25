(function () {

  const DATA_PATH = "data/sukkot/sukkot.json";

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

  async function loadSukkot() {
    try {
      const res = await fetch(DATA_PATH);

      if (!res.ok) throw new Error("Missing Sukkot data file");

      const data = await res.json();

      render(data);

    } catch (err) {
      console.warn("Sukkot load failed:", err);
      renderFallback();
    }
  }

  function render(data = {}) {

    // safe fallbacks
    const day = data.day || "--";
    const title = data.title || "Sukkot";
    const hebrew = data.hebrew || "חג סוכות";

    const phase = data.phase || "--";
    const theme = data.theme || "--";
    const detail = data.detail || "No details loaded yet.";

    const meditation = data.meditation || {};

    if (els.dayNumber) els.dayNumber.textContent = day;
    if (els.title) els.title.textContent = title;
    if (els.hebrew) els.hebrew.textContent = hebrew;

    if (els.phase) els.phase.innerHTML = `<strong>Day / Phase:</strong> ${phase}`;
    if (els.theme) els.theme.innerHTML = `<strong>Theme:</strong> ${theme}`;
    if (els.detail) els.detail.innerHTML = `<strong>Details:</strong> ${detail}`;

    if (els.medTitle) els.medTitle.textContent = meditation.title || "Meditation";
    if (els.medText) els.medText.textContent = meditation.text || "";
    if (els.medPrayer) els.medPrayer.textContent = meditation.prayer || "";
    if (els.medScripture) els.medScripture.textContent = meditation.scripture || "";

    // simple progress (safe fallback)
    if (els.progress) {
      const pct = data.progress ?? 0;
      els.progress.style.width = `${pct}%`;
    }
  }

  function renderFallback() {
    if (els.title) els.title.textContent = "Sukkot (Offline / No Data)";
    if (els.detail) els.detail.innerHTML = "Data file not loaded yet.";
    if (els.medText) els.medText.textContent = "";
    if (els.medPrayer) els.medPrayer.textContent = "";
    if (els.medScripture) els.medScripture.textContent = "";
  }

  document.addEventListener("DOMContentLoaded", loadSukkot);

})();
