(function () {
  let currentWeek = 1;
  let currentLang = "english";

  function getWeek() {
    return typeof getSelectedWeekNumber === "function"
      ? getSelectedWeekNumber()
      : 1;
  }

  async function loadWeeklyScripture() {
    const meta = document.getElementById("weeklyScriptureMeta");
    const container = document.getElementById("weeklyScriptureContainer");

    if (!container) return;

    meta.textContent = `Week ${currentWeek} • ${currentLang}`;
    container.innerHTML = "Loading...";

    try {
      const res = await fetch(
        `scripture/${currentLang}/week${currentWeek}.html`
      );

      if (!res.ok) throw new Error("Missing scripture file");

      const html = await res.text();
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML =
        `<div class="text-red-400">Failed loading week ${currentWeek}</div>`;
    }
  }

  function setLanguage(lang) {
    currentLang = lang;
    loadWeeklyScripture();
  }

  function setWeek(week) {
    currentWeek = Math.max(1, week);
    loadWeeklyScripture();
  }

  function bindWeeklyScripture() {
    currentWeek = getWeek();

    document.getElementById("langEnglishBtn")
      ?.addEventListener("click", () => setLanguage("english"));

    document.getElementById("langHebrewBtn")
      ?.addEventListener("click", () => setLanguage("hebrew"));

    document.getElementById("langGreekBtn")
      ?.addEventListener("click", () => setLanguage("greek"));

    document.getElementById("scripturePrevBtn")
      ?.addEventListener("click", () => setWeek(currentWeek - 1));

    document.getElementById("scriptureNextBtn")
      ?.addEventListener("click", () => setWeek(currentWeek + 1));

    document.getElementById("scriptureReloadBtn")
      ?.addEventListener("click", loadWeeklyScripture);

    loadWeeklyScripture();
  }

  if (document.readyState !== "loading") {
    bindWeeklyScripture();
  } else {
    document.addEventListener("DOMContentLoaded", bindWeeklyScripture);
  }
})();
