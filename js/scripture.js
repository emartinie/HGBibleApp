(function () {
  function getWeek() {
    return typeof getSelectedWeekNumber === "function"
      ? getSelectedWeekNumber()
      : 1;
  }

  async function loadScripture(week = getWeek()) {
    const meta = document.getElementById("scriptureMeta");
    const content = document.getElementById("scriptureContent");
    if (!content) return;

    meta.textContent = `Week ${week}`;
    content.innerHTML = "Loading...";

    try {
      const res = await fetch(`scripture/english/week${week}.html`);
      if (!res.ok) throw new Error("Missing scripture file");

      const html = await res.text();
      content.innerHTML = html;
    } catch (err) {
      content.innerHTML = `<div class="text-red-400">Failed to load scripture for week ${week}</div>`;
    }
  }

  function init() {
    let currentWeek = getWeek();

    document.getElementById("scriptureReloadBtn")?.addEventListener("click", () => {
      loadScripture(currentWeek);
    });

    document.getElementById("scriptureNextBtn")?.addEventListener("click", () => {
      currentWeek += 1;
      loadScripture(currentWeek);
    });

    document.getElementById("scripturePrevBtn")?.addEventListener("click", () => {
      currentWeek = Math.max(1, currentWeek - 1);
      loadScripture(currentWeek);
    });

    loadScripture(currentWeek);
  }

window.addEventListener("weekChanged", (e) => {
  const week = e.detail?.week || getWeek();
  loadScripture(week);
});

  window.addEventListener("load", () => {
  setTimeout(() => {
    loadScripture(getWeek());
  }, 100); // small delay lets mainstage finish
});

})();
