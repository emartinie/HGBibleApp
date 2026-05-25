(function () {

  const els = {};

  const DATA_PATH = "data/quizzes/sukkot.json"; 
  let data = null;

  function bind() {
    els.day = document.getElementById("sukkotDayNumber");
    els.title = document.getElementById("sukkotTitle");
    els.hebrew = document.getElementById("sukkotHebrew");

    els.progress = document.getElementById("sukkotProgressBar");

    els.phase = document.getElementById("sukkotPhase");
    els.theme = document.getElementById("sukkotTheme");
    els.detail = document.getElementById("sukkotDetail");

    els.mTitle = document.getElementById("sukkotMeditationTitle");
    els.mText = document.getElementById("sukkotMeditationText");
    els.mPrayer = document.getElementById("sukkotMeditationPrayer");
    els.mScripture = document.getElementById("sukkotMeditationScripture");
  }

  async function load() {
    try {
      const res = await fetch(DATA_PATH);
      data = await res.json();
      render();
    } catch (e) {
      console.error("Sukkot load failed", e);
      if (els.title) els.title.innerText = "Failed to load Sukkot data";
    }
  }

  function render() {
    if (!data) return;

    // basic mapping (adjust to your real JSON later)
    const today = data.current || {};

    if (els.day) els.day.innerText = today.day || "--";
    if (els.title) els.title.innerText = today.title || "Sukkot";
    if (els.hebrew) els.hebrew.innerText = today.hebrew || "";

    if (els.phase) els.phase.innerHTML = `<strong>Day / Phase:</strong> ${today.phase || "--"}`;
    if (els.theme) els.theme.innerHTML = `<strong>Theme:</strong> ${today.theme || "--"}`;
    if (els.detail) els.detail.innerHTML = `<strong>Details:</strong> ${today.detail || "--"}`;

    if (els.progress) {
      els.progress.style.width = (today.progress || 0) + "%";
    }

    if (els.mTitle) els.mTitle.innerText = today.meditation?.title || "";
    if (els.mText) els.mText.innerText = today.meditation?.text || "";
    if (els.mPrayer) els.mPrayer.innerText = today.meditation?.prayer || "";
    if (els.mScripture) els.mScripture.innerText = today.meditation?.scripture || "";
  }

  function init() {
    bind();
    load();
  }

  document.addEventListener("DOMContentLoaded", init);

})();
