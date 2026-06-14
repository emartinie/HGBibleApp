import { getWeekNumber } from "./weekEngine.js";

async function loadCommentary(week) {
  const meta = document.getElementById("commentaryMeta");
  const content = document.getElementById("commentaryContent");

  if (!content) return;

  if (meta) meta.textContent = `Week ${week}`;
  content.innerHTML = "Loading...";

  try {
    const res = await fetch(`commentary/week${week}.html`);

    if (!res.ok) throw new Error(`Missing commentary/week${week}.html`);

    const html = await res.text();
    content.innerHTML = html;
  } catch (err) {
    console.error("Commentary load error:", err);

    content.innerHTML = `
      <div class="text-red-400">
        Failed to load commentary for week ${week}
      </div>
    `;
  }
}

function initCommentary() {
  const reloadBtn = document.getElementById("commentaryReloadBtn");

  reloadBtn?.addEventListener("click", () => {
    loadCommentary(getWeekNumber());
  });

  window.addEventListener("weekChanged", (event) => {
    const week = event.detail?.week || event.detail?.weekNumber || getWeekNumber();
    loadCommentary(week);
  });

  loadCommentary(getWeekNumber());
}

initCommentary();
