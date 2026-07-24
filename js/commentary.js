import { getWeekNumber } from "./weekEngine.js";

let selectedWeek = null;
let sefariaLinkerPromise = null;

function ensureSefariaLinkStyles() {
  if (document.getElementById("commentarySefariaLinkStyles")) return;

  const style = document.createElement("style");
  style.id = "commentarySefariaLinkStyles";
  style.textContent = `
    #commentaryContent a[href*="sefaria.org"] {
      color: #67e8f9 !important;
      font-weight: 600;
      text-decoration: underline !important;
      text-decoration-color: rgba(103, 232, 249, 0.8) !important;
      text-underline-offset: 3px;
    }

    #commentaryContent a[href*="sefaria.org"]::after {
      content: " Sefaria ↗";
      display: inline-block;
      margin-left: 0.3em;
      padding: 0.05em 0.4em;
      border: 1px solid rgba(103, 232, 249, 0.55);
      border-radius: 999px;
      color: #a5f3fc;
      font-size: 0.72em;
      font-style: normal;
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1.35;
      text-decoration: none;
      vertical-align: 0.08em;
      white-space: nowrap;
    }

    #commentaryContent a[href*="sefaria.org"]:hover {
      color: #a5f3fc !important;
    }

    #commentaryContent a[href*="sefaria.org"]:focus-visible {
      outline: 2px solid #fbbf24;
      outline-offset: 3px;
      border-radius: 2px;
    }
  `;
  document.head.appendChild(style);
}

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

  ensureSefariaLinkStyles();

  reloadBtn?.addEventListener("click", () => {
    loadCommentary(getSelectedWeek());
  });

  document.addEventListener("weekChanged", handleWeekChanged);

  loadCommentary(getSelectedWeek());
}

initCommentary();
