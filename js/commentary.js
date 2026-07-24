import { getWeekNumber } from "./weekEngine.js";

let selectedWeek = null;
let sefariaLinkerPromise = null;

function ensureSefariaLinker() {
  if (window.sefaria?.link) return Promise.resolve();

  if (sefariaLinkerPromise) return sefariaLinkerPromise;

  sefariaLinkerPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sefaria-linker="v3"]');

    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.sefaria.org/linker.v3.js";
    script.charset = "utf-8";
    script.dataset.sefariaLinker = "v3";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.appendChild(script);
  });

  return sefariaLinkerPromise;
}

async function linkCommentaryReferences() {
  try {
    await ensureSefariaLinker();

    if (!window.sefaria?.link) {
      throw new Error("Sefaria Linker did not initialize");
    }

    window.sefaria.link({
      mode: "link",
      dynamic: true,
      whitelistSelector: "#commentaryContent"
    });
  } catch (error) {
    console.warn("Sefaria citation linking unavailable:", error);
  }
}

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
    await linkCommentaryReferences();
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
