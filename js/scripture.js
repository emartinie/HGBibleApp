(function () {
  function getWeek() {
    return typeof getSelectedWeekNumber === "function"
      ? getSelectedWeekNumber()
      : 1;
  }

  async function loadScripture() {
    const week = getWeek();

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
      content.innerHTML = `
        <div class="text-red-400">
          Failed to load scripture for week ${week}
        </div>
      `;
    }
  }

  function init() {
    document
      .getElementById("scriptureReloadBtn")
      ?.addEventListener("click", loadScripture);

    document
      .getElementById("scriptureNextBtn")
      ?.addEventListener("click", loadScripture);

    loadScripture();
  }

  init();
})();
