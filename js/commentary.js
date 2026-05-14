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

export function initCommentary() {
  const reloadBtn = document.getElementById("commentaryReloadBtn");
  const week = getWeekNumber();

  reloadBtn?.addEventListener("click", () => {
    loadCommentary(getWeekNumber());
  });

  loadCommentary(week);
}
