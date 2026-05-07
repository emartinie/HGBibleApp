import { getWeekNumber } from "./weekEngine.js";

let currentWeek = null;

function getWeek() {
  return getWeekNumber();
}

function loadCommentary(week)
  const week = getWeek();

    const meta = document.getElementById("commentaryMeta");
    const content = document.getElementById("commentaryContent");

    if (!content) return;

    meta.textContent = `Week ${week}`;
    content.innerHTML = "Loading...";

    try {
      const res = await fetch(`commentary/week${week}.html`);
      if (!res.ok) throw new Error("Missing commentary file");

      const html = await res.text();
      content.innerHTML = html;

    } catch (err) {
      content.innerHTML = `
        <div class="text-red-400">
          Failed to load commentary for week ${week}
        </div>
      `;
    }
  }

  function init() {
    document
      .getElementById("commentaryReloadBtn")
      ?.addEventListener("click", loadCommentary);

    loadCommentary(currentWeek);  }

  init();
})();
