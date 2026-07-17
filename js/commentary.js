import { getWeekNumber } from "./weekEngine.js";

let selectedWeek = null;

function getSelectedWeek() {
  return selectedWeek || getWeekNumber();
}

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
      <div class="text-amber-200">
        Commentary not yet authored.
      </div>
    `;
  }
}

function handleWeekChanged(event) {
  selectedWeek = event.detail?.week || event.detail?.weekNumber || getWeekNumber();
  loadCommentary(selectedWeek);
}

function initCommentary() {
  const reloadBtn = document.getElementById("commentaryReloadBtn");

  reloadBtn?.addEventListener("click", () => {
    loadCommentary(getSelectedWeek());
  });

  document.addEventListener("weekChanged", handleWeekChanged);

  loadCommentary(getSelectedWeek());
}

initCommentary();
