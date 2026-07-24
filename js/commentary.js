import { getWeekNumber } from "./weekEngine.js";

let selectedWeek = null;
let sefariaLinkerPromise = null;

const NT_BOOK_CODES = {
  Matthew: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT",
  Romans: "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO",
  Galatians: "GAL", Ephesians: "EPH", Philippians: "PHP", Colossians: "COL",
  "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI",
  "2 Timothy": "2TI", Titus: "TIT", Philemon: "PHM", Hebrews: "HEB",
  James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN",
  "2 John": "2JN", "3 John": "3JN", Jude: "JUD", Revelation: "REV"
};
const NT_REFERENCE_PATTERN = /\b(?:Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d{1,3}(?::\d{1,3}(?:\s*[-–]\s*\d{1,3})?)?\b/g;

function ensureNtExcursionStyles() {
  if (document.getElementById("commentaryNtExcursionStyles")) return;
  const style = document.createElement("style");
  style.id = "commentaryNtExcursionStyles";
  style.textContent = [
    "#commentaryContent .nt-excursion-link{color:#fbbf24;background:rgba(120,53,15,.28);border:1px solid rgba(251,191,36,.55);border-radius:.4rem;padding:.05rem .35rem;font:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer}",
    "#commentaryContent .nt-excursion-link::after{content:' NT ↗';font-size:.7em;margin-left:.25em;color:#fde68a;white-space:nowrap}",
    "#ntExcursionDialog{width:min(760px,calc(100vw - 2rem));max-height:85vh;padding:0;border:1px solid rgba(251,191,36,.45);border-radius:1rem;background:#0f172a;color:#f8fafc;box-shadow:0 24px 80px rgba(0,0,0,.65)}",
    "#ntExcursionDialog::backdrop{background:rgba(2,6,23,.78)}",
    "#ntExcursionBody{max-height:62vh;overflow:auto;padding:1rem;line-height:1.7}",
    "#ntExcursionBody .v{color:#fbbf24;font-weight:700}"
  ].join("");
  document.head.appendChild(style);
}

function getNtExcursionDialog() {
  let dialog = document.getElementById("ntExcursionDialog");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "ntExcursionDialog";
  dialog.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem;border-bottom:1px solid rgba(148,163,184,.25)"><div><div style="font-size:.72rem;color:#fbbf24;font-weight:800;letter-spacing:.08em;text-transform:uppercase">New Testament Excursion</div><h3 id="ntExcursionTitle" style="margin:.2rem 0 0;font-size:1.15rem"></h3></div><button type="button" id="ntExcursionClose" class="ui-btn" aria-label="Close excursion">Close</button></div><div id="ntExcursionBody">Loading passage…</div><div style="display:flex;justify-content:flex-end;gap:.75rem;padding:1rem;border-top:1px solid rgba(148,163,184,.25)"><button type="button" id="ntExcursionReader" class="ui-btn">Open in Scripture Reader</button></div>';
  document.body.appendChild(dialog);
  dialog.querySelector("#ntExcursionClose").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  return dialog;
}

function parseNtReference(reference) {
  const match = reference.match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?$/);
  if (!match || !NT_BOOK_CODES[match[1]]) return null;
  return { reference, code: NT_BOOK_CODES[match[1]], chapter: match[2], start: match[3] || null, end: match[4] || match[3] || null };
}

async function openNtExcursion(reference) {
  const parsed = parseNtReference(reference);
  if (!parsed) return;
  const dialog = getNtExcursionDialog();
  const title = dialog.querySelector("#ntExcursionTitle");
  const body = dialog.querySelector("#ntExcursionBody");
  const reader = dialog.querySelector("#ntExcursionReader");
  title.textContent = reference;
  body.textContent = "Loading passage…";
  reader.onclick = () => {
    localStorage.setItem("scriptureSearch", reference);
    dialog.close();
    window.loadCard?.("scriptureapi");
  };
  dialog.showModal();
  const passageId = parsed.start
    ? parsed.code + "." + parsed.chapter + "." + parsed.start + "-" + parsed.code + "." + parsed.chapter + "." + parsed.end
    : parsed.code + "." + parsed.chapter;
  try {
    const response = await fetch("https://rest.api.bible/v1/bibles/a6aee10bb058511c-01/passages/" + encodeURIComponent(passageId) + "?content-type=html&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true", {
      headers: { "api-key": "5sFfxuspfEX8TD9YAODX8", accept: "application/json" }
    });
    const data = await response.json();
    if (!response.ok || !data?.data?.content) throw new Error(data?.message || "Passage unavailable");
    title.textContent = data.data.reference + " (KJV)";
    body.innerHTML = data.data.content;
  } catch (error) {
    body.innerHTML = '<p style="color:#fca5a5">The passage could not be loaded here.</p><p>Use “Open in Scripture Reader” to continue.</p>';
    console.warn("NT excursion unavailable:", error);
  }
}

function linkNewTestamentReferences(week) {
  const root = document.getElementById("commentaryContent");
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement?.closest("a,button,script,style,textarea")) {
      NT_REFERENCE_PATTERN.lastIndex = 0;
      if (NT_REFERENCE_PATTERN.test(node.nodeValue || "")) nodes.push(node);
    }
  }
  nodes.forEach(node => {
    const text = node.nodeValue || "";
    NT_REFERENCE_PATTERN.lastIndex = 0;
    let match;
    let last = 0;
    const fragment = document.createDocumentFragment();
    while ((match = NT_REFERENCE_PATTERN.exec(text))) {
      fragment.append(document.createTextNode(text.slice(last, match.index)));
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nt-excursion-link";
      button.dataset.ntReference = match[0];
      button.textContent = match[0];
      button.setAttribute("aria-label", "Open " + match[0] + " in a New Testament excursion");
      fragment.append(button);
      last = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(last)));
    node.replaceWith(fragment);
  });
}


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
    linkNewTestamentReferences(week);
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
  ensureNtExcursionStyles();

  reloadBtn?.addEventListener("click", () => {
    loadCommentary(getSelectedWeek());
  });

  document.addEventListener("weekChanged", handleWeekChanged);

  document.getElementById("commentaryContent")?.addEventListener("click", event => {
    const trigger = event.target.closest?.("[data-nt-reference]");
    if (trigger) openNtExcursion(trigger.dataset.ntReference);
  });

  loadCommentary(getSelectedWeek());
}

initCommentary();
