(function () {
  const DATA_PATH = "data/quizzes/sukkot.json";

  const els = {
    day: null,
    title: null,
    hebrew: null,
    progress: null,
    phase: null,
    theme: null,
    detail: null,
    mTitle: null,
    mText: null,
    mPrayer: null,
    mScripture: null
  };

  let data = null;

  function bind() {
    els.day = document.getElementById("omerDayNumber");
    els.title = document.getElementById("omerTitle");
    els.hebrew = document.getElementById("omerHebrew");

    els.progress = document.getElementById("omerProgressBar");

    els.phase = document.getElementById("omerWeekDay");
    els.theme = document.getElementById("omerSefirah");
    els.detail = document.getElementById("omerDetail");

    els.mTitle = document.getElementById("omerMeditationTitle");
    els.mText = document.getElementById("omerMeditationText");
    els.mPrayer = document.getElementById("omerMeditationPrayer");
    els.mScripture = document.getElementById("omerMeditationScripture");
  }

  async function load() {
    try {
      const res = await fetch(DATA_PATH);
      if (!res.ok) throw new Error("HTTP " + res.status);

      data = await res.json();
      render();
    } catch (e) {
      console.error("Sukkot load failed:", e);
      if (els.title) els.title.innerText = "Failed to load Sukkot data";
    }
  }

  function render() {
    if (!data) return;

    const today = data.current || {};

    // CORE HEADER
    if (els.day) els.day.innerText = today.day ?? "--";
    if (els.title) els.title.innerText = today.title ?? "Sukkot Countdown";
    if (els.hebrew) els.hebrew.innerText = today.hebrew ?? "(סֻכּוֹת)";

    // META
    if (els.phase)
      els.phase.innerHTML = `<strong>Day / Phase:</strong> ${today.phase ?? "--"}`;

    if (els.theme)
      els.theme.innerHTML = `<strong>Key Observation:</strong> ${today.theme ?? "--"}`;

    if (els.detail)
      els.detail.innerHTML = `<strong>Details:</strong> ${today.detail ?? "--"}`;

    // PROGRESS
    if (els.progress) {
      const pct = Math.max(0, Math.min(100, today.progress ?? 0));
      els.progress.style.width = pct + "%";
    }

    // MEDITATION
    if (els.mTitle) els.mTitle.innerText = today.meditation?.title ?? "";
    if (els.mText) els.mText.innerText = today.meditation?.text ?? "";
    if (els.mPrayer) els.mPrayer.innerText = today.meditation?.prayer ?? "";
    if (els.mScripture) els.mScripture.innerText = today.meditation?.scripture ?? "";
  }

  function init() {
    bind();
    load();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
