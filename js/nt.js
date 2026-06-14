function ntLog(label, data = null) {
  console.log(`[NT] ${label}`, data ?? "");
}

// =========================================================
// CORE DOM / CONFIG
// =========================================================

var root = document.getElementById("nt-root");

var headerZone = document.getElementById("nt-header");
var navZone = document.getElementById("nt-nav");
var contentZone = document.getElementById("nt-content");
var panelZone = document.getElementById("nt-panel");

ntLog("ROOT", root);
ntLog("HEADER", headerZone);
ntLog("NAV", navZone);
ntLog("CONTENT", contentZone);
ntLog("PANEL", panelZone);
ntLog("DOM READY", {
  root: !!root,
  content: !!contentZone
});
ntLog("BOOT SNAPSHOT", {
  readyState: document.readyState,
  url: window.location.href,
  rootNow: !!document.getElementById("nt-root"),
  contentNow: !!document.getElementById("nt-content"),
  cachedRoot: !!root,
  cachedContent: !!contentZone,
  card: new URLSearchParams(window.location.search).get("card")
});

(function () {

  const NT_BASE = "cards/nt.html";
  const intertextEdges = [
    {
      "from": "Matthew 1:23",
      "to": "Isaiah 7:14",
      "type": "prophecy",
      "context": "Matthew 1:23 cites Isaiah 7:14 (Immanuel prophecy)",
      "meta": null
    },
    {
      "from": "Matthew 2:6",
      "to": "Micah 5:2",
      "type": "citation",
      "context": "Matthew 2:6 references Micah 5:2 Bethlehem prophecy",
      "meta": null
    },
    {
      "from": "Matthew 2:15",
      "to": "Hosea 11:1",
      "type": "citation",
      "context": "Matthew 2:15 references Hosea 11:1 (Out of Egypt)",
      "meta": null
    }
  ];
  

function getParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    book: params.get("book"),
    chapter: params.get("chapter"),
    view: params.get("view"),
    section: params.get("section")
  };
}

  // =========================================================
  // UTILITIES
  // =========================================================

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function copyToClipboard(text) {
    if (!text) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      ta.remove();
    }
  }

  function renderReviewQuestions(text) {
    const lines = String(text || "")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const looksNumbered = lines.some(l => /^\d+\s*[)\.]/.test(l));
    if (!looksNumbered) return null;

    const items = [];
    let current = "";

    for (const l of lines) {
      if (/^\d+\s*[)\.]/.test(l)) {
        if (current) items.push(current.trim());
        current = l.replace(/^\d+\s*[)\.]\s*/, "");
      } else {
        current += " " + l;
      }
    }

    if (current) items.push(current.trim());

    return `<ol>${items.map(q => `<li>${escapeHtml(q)}</li>`).join("")}</ol>`;
  }

  function getIntertextDataEdges() {
    const data = window.intertextData;
    if (!data) return [];

    return Object.values(data)
      .map(entry => {
        const ntText = entry?.nt?.text;
        if (!ntText) return null;

        const ntString = String(ntText);
        const dashIndexes = [
          ntString.indexOf("\u2014"),
          ntString.indexOf("\u00e2\u20ac\u201d")
        ].filter(index => index >= 0);
        const firstDash = dashIndexes.length ? Math.min(...dashIndexes) : -1;
        const from = (firstDash >= 0 ? ntString.slice(0, firstDash) : ntString).trim();
        const refs = [
          entry?.ot?.masoretic?.ref || deriveReferenceFromText(entry?.ot?.masoretic?.text),
          entry?.ot?.lxx?.ref || deriveReferenceFromText(entry?.ot?.lxx?.text)
        ].filter(Boolean);

        return {
          from: from || ntText,
          to: refs.length ? refs.join(" / ") : "Hebrew Scripture witness",
          type: "citation",
          context: ntText,
          meta: entry
        };
      })
      .filter(Boolean);
  }

  function deriveReferenceFromText(text) {
    const match = String(text || "").match(/^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:-\d+)?)/);
    return match ? match[1].trim() : "";
  }

  function getIntertextEdges() {
    return intertextEdges.concat(getIntertextDataEdges());
  }

  function renderIntertextConnectionsForText(text) {
    const sourceText = String(text || "");
    const edges = getIntertextEdges();
    const matches = edges
      .map((edge, index) => ({ edge, index }))
      .filter(item => sourceText.includes(item.edge.from));
    if (!matches.length) return "";

    return `
      <div class="mt-2 rounded-lg border border-cyan-700/40 bg-cyan-950/20 p-3 text-sm">
        <div class="font-semibold text-cyan-200 mb-1">Intertext Connections</div>
        <ul class="list-disc pl-5 text-slate-300">
          ${matches.map(({ edge, index }) => `
            <li>
              <button type="button" class="reader-chip" data-intertext-index="${index}">
                ${escapeHtml(edge.to)} (${escapeHtml(edge.type)})
              </button>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  function buildNTUrl(nextParams = {}) {
    const params = new URLSearchParams();
    const current = getParams();

    ["book", "chapter", "view", "section"].forEach(key => {
      let val = current[key];
      if (Object.prototype.hasOwnProperty.call(nextParams, key)) {
        val = nextParams[key];
      }
      if (val) params.set(key, val);
    });

    const query = params.toString();
    return query ? `${NT_BASE}?${query}` : NT_BASE;
  }

  function buildPanelNav(context = {}) {
    const bookName = context.book || book;
    const chapterNum = context.chapter || chapter;
    const sectionId = context.section || section;
    const viewName = context.view || view;

    if (!bookName && !chapterNum && !sectionId && !viewName) return "";

    const chNum = Number(chapterNum);
    const prevChapter = chapterNum && chNum > 1
      ? `<a class="reader-chip" href="${buildNTUrl({ book: bookName, chapter: chNum - 1, view: viewName, section: sectionId })}">Previous</a>`
      : `<span class="reader-chip opacity-40">Previous</span>`;

    const nextChapter = chapterNum && (!context.maxChapter || chNum < Number(context.maxChapter))
      ? `<a class="reader-chip" href="${buildNTUrl({ book: bookName, chapter: chNum + 1, view: viewName, section: sectionId })}">Next</a>`
      : chapterNum ? `<span class="reader-chip opacity-40">Next</span>` : "";

    return `
      <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" class="reader-chip" data-nt-back="true">Back</button>
          <a class="reader-chip" href="${buildNTUrl({ book: null, chapter: null, view: null, section: null })}">Start Over</a>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          ${chapterNum ? prevChapter : ""}
          ${nextChapter}
        </div>
      </div>
    `;
  }

  function buildContextFooter(context = {}) {
    const parts = [
      context.book || book,
      context.chapter ? `Chapter ${context.chapter}` : (chapter ? `Chapter ${chapter}` : ""),
      context.sectionLabel || context.section || section || ""
    ].filter(Boolean);

    if (!parts.length) return "";

    return `
      <div class="border-t border-slate-700 pt-2 text-xs text-slate-400">
        ${parts.map(escapeHtml).join(" / ")}
      </div>
    `;
  }

  function getSectionLabel(sectionId) {
    return ({
      objectives: "Objectives",
      summary: "Summary",
      outline: "Outline",
      wordsToPonder: "Words to Ponder",
      reviewQuestions: "Review Questions"
    })[sectionId] || sectionId || "";
  }

  function renderContextStrip(bundle) {
    if (!bundle) return "";

    const items = [
      "NT",
      bundle.intertext ? "Intertext available" : "Intertext pending",
      bundle.sefaria ? "Sefaria witness available" : "Sefaria witness pending"
    ];

    return `
      <div class="nt-context-strip flex flex-wrap gap-2 text-xs text-slate-300 mb-3">
        ${items.map(item => `
          <div class="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1">
            ${escapeHtml(item)}
          </div>
        `).join("")}
      </div>
    `;
  }

  function returnToNTView() {
    const url = new URL(window.location.href);
    url.searchParams.set("card", "nt");
    url.searchParams.delete("view");
    window.history.replaceState({}, "", url);
    window.loadCard?.("nt");
  }

  function hasPorchPanel() {
    return typeof window.openPorchPanel === "function";
  }

  function hasNTMount(source) {
    const ok = !!root && !!contentZone;
    if (!ok) {
      ntLog("ABORT RENDER: missing NT mount", {
        source,
        rootNow: !!document.getElementById("nt-root"),
        contentNow: !!document.getElementById("nt-content"),
        cachedRoot: !!root,
        cachedContent: !!contentZone
      });

      if (root) {
        root.innerHTML = `
          <div class="p-6 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200">
            NT mount incomplete.
          </div>
        `;
      }
    }
    return ok;
  }

  function openSefariaFromNT(bookName, chapterNum) {
    window.dispatchEvent(new CustomEvent("sefaria:open", {
      detail: {
        book: bookName,
        chapter: Number(chapterNum),
        verse: null
      }
    }));
  }

  function openIntertextPanel(edge, context = {}) {
    if (!edge) return;

    openPanel(
      `${edge.from} → ${edge.to}`,
      `
        ${buildPanelNav(context)}
        <div class="space-y-3 text-sm">
          <div><span class="text-slate-400">From:</span> ${escapeHtml(edge.from)}</div>
          <div><span class="text-slate-400">To:</span> ${escapeHtml(edge.to)}</div>
          <div><span class="text-slate-400">Type:</span> ${escapeHtml(edge.type)}</div>
          ${edge.context ? `<div><span class="text-slate-400">Context:</span> ${escapeHtml(edge.context)}</div>` : ""}
        </div>
        ${buildContextFooter({
          book: context.book,
          chapter: context.chapter,
          section: context.section,
          sectionLabel: context.sectionLabel
        })}
      `
    );
  }

  function bindPanelInteractions(scope = document, context = {}) {
    scope.querySelectorAll("[data-panel-copy]").forEach(btn => {
      btn.onclick = () => copyToClipboard(btn.getAttribute("data-panel-copy"));
    });

    scope.querySelectorAll("[data-sefaria-panel]").forEach(btn => {
      btn.onclick = () => openSefariaFromNT(
        btn.getAttribute("data-sefaria-book") || context.book || book,
        btn.getAttribute("data-sefaria-chapter") || context.chapter || chapter || 1
      );
    });

    scope.querySelectorAll("[data-intertext-index]").forEach(btn => {
      btn.onclick = () => {
        const edge = getIntertextEdges()[Number(btn.getAttribute("data-intertext-index"))];
        openIntertextPanel(edge, {
          book: context.book || book,
          chapter: context.chapter || chapter,
          section: context.section || section,
          sectionLabel: context.sectionLabel || getSectionLabel(context.section || section)
        });
      };
    });
  }

  // =========================================================
  // PANEL SYSTEM
  // =========================================================

  function openPanel(title, html, context = {}) {
    if (hasPorchPanel()) {
      window.openPorchPanel(title, html);
      requestAnimationFrame(() => bindPanelInteractions(document, context));
      return;
    }

    // Fallback: render INSIDE nt-root, not a new window
    if (!hasNTMount("openPanel")) return;

    contentZone.innerHTML = `
      <section class="space-y-4">
        <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <h2 class="text-xl font-semibold">${escapeHtml(title)}</h2>
          <button id="ntBackBtn" class="reader-chip">Back</button>
        </div>
        ${html}
      </section>
    `;
    ntLog("CONTENT AFTER RENDER", {
      source: "openPanel",
      length: contentZone?.innerHTML?.length ?? 0
    });

    const backBtn = document.getElementById("ntBackBtn");
    if (backBtn) {
      backBtn.onclick = returnToNTView;
    }

    bindPanelInteractions(contentZone, context);
  }

  function buildPanelSection(title, rawText, linkHref, context = {}) {
    const safeLink = escapeHtml(linkHref || "");
    const panelParagraphs = String(rawText || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .split(/\n\s*\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p class="mb-3">${escapeHtml(p)}</p>`)
      .join("");

 return `
  <div class="space-y-3 text-left">

    ${buildPanelNav(context)}

    <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
      
      <a href="${safeLink}" 
         class="text-cyan-300 underline text-sm hover:text-cyan-200 transition">
        ↗ Open full page
      </a>

      <button
        class="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs hover:bg-slate-700 transition"
        onclick="navigator.clipboard?.writeText('${safeLink}')">
        Copy link
      </button>

    </div>

    <div class="rounded-xl bg-gradient-to-b from-slate-950/60 to-slate-900/40 border border-slate-700 p-4 max-h-[60vh] overflow-auto shadow-inner" style="max-height:min(60vh, calc(100vh - 14rem)); overflow-y:auto; -webkit-overflow-scrolling:touch;">

      <div class="prose prose-invert max-w-none text-sm leading-relaxed">

        ${panelParagraphs || `<p class="mb-3 text-slate-400">No panel content available.</p>`}

      </div>

    </div>

    ${buildContextFooter(context)}

  </div>
`;
  }

  // =========================================================
  // LINK INTERCEPT SYSTEM
  // =========================================================

  function interceptNTLinks() {
    if (window.__ntLinksIntercepted) return;
    window.__ntLinksIntercepted = true;

    document.addEventListener("click", (e) => {
      const back = e.target.closest("[data-nt-back]");
      if (back) {
        e.preventDefault();
        returnToNTView();
        return;
      }

      const a = e.target.closest("a");
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href) return;
      if (!href.startsWith(NT_BASE)) return;

      e.preventDefault();

      const url = new URL(href, window.location.origin);
      const linkParams = url.searchParams;
      const newUrl = new URL(window.location.href);

      newUrl.searchParams.set("card", "nt");

      ["book", "chapter", "view", "section"].forEach((key) => {
        const val = linkParams.get(key);
        if (val) newUrl.searchParams.set(key, val);
        else newUrl.searchParams.delete(key);
      });

      window.history.replaceState({}, "", newUrl);
      window.loadCard?.("nt");
    });
  }

  // =========================================================
  // HEADER STATE
  // =========================================================

  function setContextHeader(text) {
    const el = document.getElementById("nt-context");
    if (el) el.textContent = text;
  }

  function setSubContext(text) {
    const el = document.getElementById("nt-subcontext");
    if (el) el.textContent = text || "";
  }

// =========================================================
// LANDING PAGE
// =========================================================

function renderNTLanding() {
  ntLog("RENDER DECISION", "landing");
  setContextHeader("My New Testament Notes");
  setSubContext("Choose a book and jump straight to the part you want.");

  if (!hasNTMount("renderNTLanding")) return;

contentZone.innerHTML = `
  <section class="space-y-6">

    <div class="text-center space-y-2 border-b border-slate-700 pb-4">
      <h1 class="text-2xl font-bold text-cyan-200">
        📖 My New Testament Notes
      </h1>

      <p class="text-slate-400 text-sm">
        Choose a book and jump straight to the part you want.
      </p>
    </div>

    <div id="nt-book-wheel"
         class="rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900/80 to-slate-950/60 p-4 shadow-lg"
         tabindex="0"
         aria-label="New Testament book selector">
      <button type="button"
              class="reader-chip w-full justify-center"
              data-nt-wheel-prev="true"
              aria-label="Previous book">
        Up
      </button>

      <div class="nt-wheel-window my-3" data-nt-wheel-window></div>

      <button type="button"
              class="reader-chip w-full justify-center"
              data-nt-wheel-next="true"
              aria-label="Next book">
        Down
      </button>
    </div>

    <div id="nt-book-actions"
         class="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 shadow-lg">
    </div>

    <div class="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400 leading-relaxed">
      Start with the introduction, jump into chapter 1, go straight to summary and review questions,
      or leave yourself a reminder for future Jewish context tie-ins.
    </div>

  </section>
`;
  ntLog("CONTENT AFTER RENDER", {
    source: "renderNTLanding",
    length: contentZone?.innerHTML?.length ?? 0
  });

  loadBookTiles();
}

// =========================================================
// BOOK GRID
// =========================================================

function loadBookTiles() {
  const books = [
    "Matthew","Mark","Luke","John","Acts","Romans",
    "1 Corinthians","2 Corinthians","Galatians","Ephesians",
    "Philippians","Colossians","1 Thessalonians","2 Thessalonians",
    "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James",
    "1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
  ];

  const wheel = document.getElementById("nt-book-wheel");
  const wheelWindow = wheel?.querySelector("[data-nt-wheel-window]");
  const actions = document.getElementById("nt-book-actions");
  if (!wheel || !wheelWindow || !actions) return;

  let activeIndex = 0;
  let touchStartY = null;

  function clampIndex(index) {
    return (index + books.length) % books.length;
  }

  function buildBookLinks(bookName) {
    return {
      introLink: `${NT_BASE}?book=${encodeURIComponent(bookName)}&view=introduction`,
      ch1Link: `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1`,
      summaryLink: `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=summary`,
      reviewLink: `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=reviewQuestions`
    };
  }

  function getBookJsonPath(bookName) {
    const bookKey = bookName.toLowerCase().replace(/\s+/g, "");
    return `data/nt/${bookKey}.json`;
  }

  function getChapterOneSection(chapter, preferredSection = null) {
    const sectionList = [
      ["objectives", "Objectives", chapter?.objectives],
      ["summary", "Summary", chapter?.summary],
      ["outline", "Outline", chapter?.outline],
      ["wordsToPonder", "Words to Ponder", chapter?.wordsToPonder],
      ["reviewQuestions", "Review Questions", chapter?.reviewQuestions]
    ];

    return (
      sectionList.find(([id, , text]) => id === preferredSection && text) ||
      sectionList.find(([, , text]) => text)
    );
  }

  async function openLandingActionPanel(action) {
    const bookName = books[activeIndex];
    const { introLink, ch1Link, summaryLink, reviewLink } = buildBookLinks(bookName);
    const res = await fetch(getBookJsonPath(bookName));

    if (!res.ok) throw new Error("Failed to load book data");

    const data = await res.json();

    if (action === "introduction") {
      openPanel(
        `${bookName} - Introduction`,
        buildPanelSection(`${bookName} - Introduction`, data.introduction?.rawText, introLink, {
          book: bookName,
          sectionLabel: "Introduction",
          view: "introduction"
        })
      );
      return;
    }

    const chapterOne = data.chapters?.["1"];
    const preferredSection = action === "summary"
      ? "summary"
      : action === "review"
        ? "reviewQuestions"
        : null;
    const selectedSection = getChapterOneSection(chapterOne, preferredSection);
    const sectionId = selectedSection?.[0] || preferredSection || "chapter1";
    const sectionTitle = selectedSection?.[1] || "Chapter 1";
    const sectionText = selectedSection?.[2] || "";
    const linkHref = action === "summary"
      ? summaryLink
      : action === "review"
        ? reviewLink
        : ch1Link;

    openPanel(
      `${bookName} - Ch 1 - ${sectionTitle}`,
      buildPanelSection(`${bookName} - Ch 1 - ${sectionTitle}`, sectionText, linkHref, {
        book: bookName,
        chapter: 1,
        section: sectionId,
        sectionLabel: sectionTitle
      })
    );
  }

  function setActiveBook(index) {
    const nextIndex = clampIndex(index);
    if (nextIndex === activeIndex) return;

    activeIndex = nextIndex;
    renderWheel();
    renderActions();
  }

  function renderWheel() {
    const visibleIndexes = [];

    for (let offset = -2; offset <= 2; offset += 1) {
      visibleIndexes.push(clampIndex(activeIndex + offset));
    }

    wheelWindow.innerHTML = visibleIndexes
      .map((bookIndex, slotIndex) => {
        const bookName = books[bookIndex];
        const distance = Math.abs(slotIndex - 2);
        const activeClass = bookIndex === activeIndex
          ? " is-active border-cyan-500/60 bg-cyan-900/35 text-cyan-100 shadow-lg shadow-cyan-950/30"
          : distance === 1
            ? " is-near border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80"
            : " border-slate-700 bg-slate-950/40 text-slate-400 hover:bg-slate-900/70";

        return `
          <button type="button"
                  class="nt-wheel-item w-full rounded-xl border px-4 py-3 text-center text-sm font-semibold${activeClass}"
                  data-nt-wheel-index="${bookIndex}"
                  aria-current="${bookIndex === activeIndex ? "true" : "false"}">
            ${escapeHtml(bookName)}
          </button>
        `;
      })
      .join("");

    wheelWindow.querySelectorAll("[data-nt-wheel-index]").forEach(btn => {
      btn.addEventListener("click", () => {
        setActiveBook(Number(btn.getAttribute("data-nt-wheel-index")));
      });
    });
  }

  function renderActions() {
    const bookName = books[activeIndex];

    actions.innerHTML = `
      <div class="mb-4 border-b border-slate-700 pb-3">
        <div class="text-lg font-semibold text-cyan-200">
          ${escapeHtml(bookName)}
        </div>

        <div class="text-xs text-slate-400">
          NT Sections/ Sources:
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button type="button"
           class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center transition"
           data-nt-panel-action="introduction">
          Intro
        </button>

        <button type="button"
           class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center transition"
           data-nt-panel-action="chapter1">
          Chapter 1
        </button>

        <button type="button"
           class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center transition"
           data-nt-panel-action="summary">
          Summary
        </button>

        <button type="button"
           class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center transition"
           data-nt-panel-action="review">
          Review
        </button>

        <button
          type="button"
          class="col-span-2 px-3 py-2 rounded-lg border border-cyan-700/40 bg-cyan-900/20 hover:bg-cyan-800/30 text-sm text-center text-cyan-200 hover:text-white transition"
          data-nt-hint="${escapeHtml(bookName)}">
          Related Jewish Context
        </button>
      </div>
    `;

    actions.querySelectorAll("[data-nt-panel-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        openLandingActionPanel(btn.getAttribute("data-nt-panel-action"))
          .catch(err => {
            console.error(err);
            openPanel(
              "NT Panel",
              `<p class="text-red-300 text-sm">Unable to load this NT content.</p>`
            );
          });
      });
    });

    actions.querySelector("[data-nt-hint]")?.addEventListener("click", () => {
      const activeBook = books[activeIndex];
      openSefariaFromNT(activeBook, 1);
      openPanel(
        `${activeBook} â€” Related Jewish Context`,
        buildPanelSection(
          `${activeBook} â€” Related Jewish Context`,
          `This is a placeholder for future cross-links, hints, thematic alignment, and other connections between ${activeBook} and Jewish texts or traditions rarely studied by christians or theologians.\n\nNot wired yet â€” just making room for the future on purpose.`,
          `${NT_BASE}?book=${encodeURIComponent(activeBook)}`,
          {
            book: activeBook,
            sectionLabel: "Related Jewish Context"
          }
        )
      );
    });
  }

  wheel.querySelector("[data-nt-wheel-prev]")?.addEventListener("click", () => {
    setActiveBook(activeIndex - 1);
  });

  wheel.querySelector("[data-nt-wheel-next]")?.addEventListener("click", () => {
    setActiveBook(activeIndex + 1);
  });

  wheel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveBook(activeIndex - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveBook(activeIndex + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveBook(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveBook(books.length - 1);
    }
  });

  wheel.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) < 12) return;
    event.preventDefault();
    setActiveBook(activeIndex + (event.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  wheel.addEventListener("touchstart", (event) => {
    touchStartY = event.touches?.[0]?.clientY ?? null;
  }, { passive: true });

  wheel.addEventListener("touchend", (event) => {
    if (touchStartY === null) return;

    const touchEndY = event.changedTouches?.[0]?.clientY ?? touchStartY;
    const deltaY = touchStartY - touchEndY;
    touchStartY = null;

    if (Math.abs(deltaY) < 30) return;
    setActiveBook(activeIndex + (deltaY > 0 ? 1 : -1));
  }, { passive: true });

  renderWheel();
  renderActions();
}
  /*

        `${bookName} — Related Jewish Context`,
        buildPanelSection(
          `${bookName} — Related Jewish Context`,
          `This is a placeholder for future cross-links, hints, thematic alignment, and other connections between ${bookName} and Jewish texts or traditions rarely studied by christians or theologians.\n\nNot wired yet — just making room for the future on purpose.`,
          `${NT_BASE}?book=${encodeURIComponent(bookName)}`,
          {
            book: bookName,
            sectionLabel: "Related Jewish Context"
          }
        )
      );
      return;
    });
  });
}
  
  */

  // =========================================================
  // CHAPTER RENDERING
  // =========================================================

  function renderChapter(bookName, chapterNum, ch, activeSection, chapterKeys = [], contextBundle = null) {
      ntLog("RENDER DECISION", "chapter");
      ntLog("RENDER CHAPTER", {
    bookName,
    chapterNum,
    activeSection,
    ch
  });
    setContextHeader(`${bookName} — Chapter ${chapterNum}`);
    setSubContext("Objectives, summary, outline, words to ponder, and review questions.");

    if (!hasNTMount("renderChapter")) return;

    contentZone.innerHTML = `
      <section id="chapter-nav" style="margin-bottom:1.5rem;"></section>

      <div id="objectives"></div>
      <div id="summary"></div>
      <div id="outline"></div>
      <div id="wordsToPonder"></div>
      <div id="reviewQuestions"></div>
    `;
    ntLog("CONTENT AFTER RENDER", {
      source: "renderChapterShell",
      length: contentZone?.innerHTML?.length ?? 0
    });


    const sectionList = [
      ["objectives", "Objectives", ch.objectives],
      ["summary", "Summary", ch.summary],
      ["outline", "Outline", ch.outline],
      ["wordsToPonder", "Words to Ponder", ch.wordsToPonder],
      ["reviewQuestions", "Review Questions", ch.reviewQuestions]
    ];
    const visibleSection =
      sectionList.find(([id, , text]) => id === activeSection && text) ||
      sectionList.find(([, , text]) => text);
    const availableSections = sectionList.filter(([, , text]) => text);

    renderChapterNav(bookName, chapterNum, chapterKeys, visibleSection?.[0] || activeSection, availableSections);

    if (visibleSection) {
      renderSection(visibleSection[0], visibleSection[1], visibleSection[2], contextBundle);
    }
  }

  // =========================================================
  // INTRODUCTION
  // =========================================================

  function renderIntroduction(bookName, intro, contextBundle = null) {
  ntLog("RENDER DECISION", "introduction");
  ntLog("RENDER INTRO", {
    bookName,
    intro
  });
  setContextHeader(`${bookName} — Introduction`);
  setSubContext("Book overview and study entry points.");

  if (!hasNTMount("renderIntroduction")) return;

  if (!intro?.rawText) {
    contentZone.innerHTML = "<p>No introduction available.</p>";
    return;
  }

  const linkIntro = `${NT_BASE}?book=${encodeURIComponent(bookName)}&view=introduction`;
  const linkCh1 = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1`;
  const linkSum = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=summary`;
  const linkRQ = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=reviewQuestions`;

  contentZone.innerHTML = `
    <section class="mb-6">
      <h2 class="text-xl font-semibold">Begin Study</h2>

      <div class="flex gap-2 flex-wrap mt-3">
        <a href="${linkCh1}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60">
          Read Chapter 1
        </a>

        <a href="${linkSum}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60">
          Summary First
        </a>

        <a href="${linkRQ}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60">
          Review Questions
        </a>

        <button id="introPanelBtn"
          class="px-3 py-2 rounded-lg bg-cyan-700/90 hover:bg-cyan-600 text-white">
          Open Intro in Panel
        </button>
      </div>
    </section>

    <section class="reader-block reader-skin">
      ${renderContextStrip(contextBundle)}
      <pre>${escapeHtml(intro.rawText)}</pre>
    </section>
  `;
  ntLog("CONTENT AFTER RENDER", {
    source: "renderIntroduction",
    length: contentZone?.innerHTML?.length ?? 0
  });

  const btn = document.getElementById("introPanelBtn");
  if (btn) {
    btn.onclick = () => {
      openPanel(
        `${bookName} — Introduction`,
        buildPanelSection(
          `${bookName} — Introduction`,
          intro.rawText,
          linkIntro,
          {
            book: bookName,
            sectionLabel: "Introduction",
            view: "introduction"
          }
        )
      );
    };
  }
}

  // =========================================================
  // NAVIGATION
  // =========================================================

  function renderChapterNav(bookName, chapterNum, chapterKeys = [], activeSection = null, availableSections = []) {
    const nav = document.getElementById("chapter-nav");
    if (!nav) return;

    const chNum = Number(chapterNum);
    const maxChapter = chapterKeys.length
      ? Math.max(...chapterKeys.map(Number).filter(Number.isFinite))
      : null;

    const prev = chNum > 1
      ? `<a class="reader-chip" href="${buildNTUrl({ book: bookName, chapter: chNum - 1, section: activeSection || null, view: null })}">← Previous</a>`
      : `<span class="reader-chip opacity-40">← Previous</span>`;

    const next = !maxChapter || chNum < maxChapter
      ? `<a class="reader-chip" href="${buildNTUrl({ book: bookName, chapter: chNum + 1, section: activeSection || null, view: null })}">Next →</a>`
      : `<span class="reader-chip opacity-40">Next →</span>`;

    const sectionChips = availableSections
      .map(([sectionId, label]) => {
        const href = buildNTUrl({ book: bookName, chapter: chNum, section: sectionId, view: null });
        const activeClass = sectionId === activeSection
          ? " bg-cyan-700/80 border-cyan-500/30"
          : "";

        return `<a class="reader-chip${activeClass}" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
      })
      .join("");

    nav.innerHTML = `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:stretch;
        gap:0.75rem;
        border-bottom:1px solid #334155;
        padding-bottom:0.75rem;
      ">
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:0.75rem;
      ">
        <div class="flex items-center gap-2">${prev}</div>
        <div style="font-weight:600;">${escapeHtml(bookName)} Chapter ${chNum}</div>
        <div class="flex items-center gap-2">
          <button type="button" class="reader-chip" data-sefaria-open="true">Open in Sefaria</button>
          ${next}
        </div>
      </div>
      ${sectionChips ? `
        <div class="flex items-center gap-2 flex-wrap">
          ${sectionChips}
        </div>
      ` : ""}
      </div>
    `;

    nav.querySelector("[data-sefaria-open]")?.addEventListener("click", () => {
      openSefariaFromNT(bookName, chNum);
    });
  }

  // =========================================================
  // SECTION RENDERER
  // =========================================================

  function renderSection(id, title, text, contextBundle = null) {
    ntLog("RENDER SECTION", id);
    if (!text) return;

    const el = document.getElementById(id);
    if (!el) return;

    const href = `${NT_BASE}?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(chapter)}&section=${encodeURIComponent(id)}`;

    const paragraphs = String(text)
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .split(/\n\s*\n+/)
      .map(p => {
        const paragraphText = p.trim();
        return `<p>${escapeHtml(paragraphText)}</p>${renderIntertextConnectionsForText(paragraphText)}`;
      })
      .join("");

    let bodyHTML = paragraphs;

    if (id === "reviewQuestions") {
      const listHTML = renderReviewQuestions(text);
      bodyHTML = listHTML || paragraphs;
    }

    el.innerHTML = `
      ${renderContextStrip(contextBundle)}

      <div class="flex items-center justify-between gap-2 mb-3">
        <h2 class="text-xl font-semibold text-cyan-200">${title}</h2>
        <div class="flex items-center gap-2">
          <a href="${href}" class="reader-chip">Link</a>
          <button class="reader-chip" data-copy="${escapeHtml(href)}">Copy</button>
          <button class="reader-chip" data-sefaria-section="true">Open in Sefaria</button>
          <button class="reader-chip bg-cyan-700/80 border-cyan-500/30" data-panel="${escapeHtml(id)}">Panel</button>
        </div>
      </div>

      <div class="reader-block reader-skin">
        ${bodyHTML}
      </div>
    `;
    ntLog("SECTION TARGET", {
      id,
      offsetHeight: el.offsetHeight,
      scrollHeight: el.scrollHeight,
      innerHTML: el.innerHTML.length
    });
    ntLog("CONTENT AFTER RENDER", {
      source: `renderSection:${id}`,
      length: el?.innerHTML?.length ?? 0
    });

    el.querySelectorAll("[data-copy]").forEach(b => {
      b.onclick = () => copyToClipboard(b.getAttribute("data-copy"));
    });

    el.querySelectorAll("[data-sefaria-section]").forEach(b => {
      b.onclick = () => openSefariaFromNT(book, chapter);
    });

    el.querySelectorAll("[data-intertext-index]").forEach(b => {
      b.onclick = () => {
        const edge = getIntertextEdges()[Number(b.getAttribute("data-intertext-index"))];
        if (!edge) return;

        openPanel(
          `${edge.from} → ${edge.to}`,
          `
            ${buildPanelNav({ book, chapter, section: id })}
            <div class="space-y-3 text-sm">
              <div><span class="text-slate-400">From:</span> ${escapeHtml(edge.from)}</div>
              <div><span class="text-slate-400">To:</span> ${escapeHtml(edge.to)}</div>
              <div><span class="text-slate-400">Type:</span> ${escapeHtml(edge.type)}</div>
              ${edge.context ? `<div><span class="text-slate-400">Context:</span> ${escapeHtml(edge.context)}</div>` : ""}
            </div>
            ${buildContextFooter({ book, chapter, section: id, sectionLabel: getSectionLabel(id) })}
          `
        );
      };
    });

    el.querySelectorAll("[data-panel]").forEach(b => {
      b.onclick = () => openPanel(
        `${book} — Ch ${chapter} — ${title}`,
        buildPanelSection(`${book} — Ch ${chapter} — ${title}`, text, href, {
          book,
          chapter,
          section: id,
          sectionLabel: title
        })
      );
    });
  }

  // =========================================================
  // INIT
  // =========================================================

interceptNTLinks();

const { book, chapter, view, section } = getParams();
  ntLog("PARAMS", {
  book,
  chapter,
  view,
  section
});
  ntLog("ROUTE RESOLUTION", {
  book,
  chapter,
  view,
  section
});

if (!book) {
  renderNTLanding();
  return;
}

const bookKey = book.toLowerCase().replace(/\s+/g, "");
const jsonPath = `data/nt/${bookKey}.json`;
  ntLog("FETCHING JSON", jsonPath);

fetch(jsonPath)
  .then(res => {
    if (!res.ok) throw new Error("Failed to load book data");
    ntLog("FETCH SUCCESS", jsonPath);
    return res.json();
  })
  .then(data => {
    ntLog("JSON LOADED", data);
    if (!hasNTMount("fetchThen")) return;

  const contextBundle = {
    nt: data,
    intertext: window.intertextData || null,
    sefaria: window.sefariaData || null
  };

  window.getIntertextContext = () => contextBundle.intertext;
  window.getSefariaContext = () => contextBundle.sefaria;

  const body = contentZone;

  if (view === "introduction") {
    renderIntroduction(book, data.introduction, contextBundle);
    return;
  }

  if (!chapter) {
    ntLog("RENDER DECISION", "fallback:no-chapter");
    body.innerHTML = "<p class='text-slate-400'>Select a chapter.</p>";
    ntLog("CONTENT AFTER RENDER", {
      source: "fallback:no-chapter",
      length: body?.innerHTML?.length ?? 0
    });
    return;
  }

  ntLog("AVAILABLE CHAPTERS", Object.keys(data.chapters || {}));
  ntLog("REQUESTED CHAPTER", chapter);  
  const ch = data.chapters[String(chapter)];
  if (!ch) {
    ntLog("RENDER DECISION", "fallback:chapter-not-found");
    body.innerHTML = "<p class='text-red-400'>Chapter not found.</p>";
    ntLog("CONTENT AFTER RENDER", {
      source: "fallback:chapter-not-found",
      length: body?.innerHTML?.length ?? 0
    });
    return;
  }

  const chapterKeys = Object.keys(data.chapters || {});
  renderChapter(book, chapter, ch, section, chapterKeys, contextBundle);

  if (view === "panel" && section && ch[section]) {
    const href =
      `${NT_BASE}?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(chapter)}&section=${encodeURIComponent(section)}`;
    const sectionTitle = getSectionLabel(section);

    openPanel(
      `${book} — Ch ${chapter} — ${sectionTitle}`,
      buildPanelSection(`${book} — Ch ${chapter} — ${sectionTitle}`, ch[section], href, {
        book,
        chapter,
        section,
        sectionLabel: sectionTitle,
        maxChapter: chapterKeys.length
          ? Math.max(...chapterKeys.map(Number).filter(Number.isFinite))
          : null
      })
    );
  }
})
    .catch(err => {
  console.error(err);
  ntLog("FETCH FAILURE", {
    path: jsonPath,
    message: err?.message
  });

  if (hasNTMount("fetchCatch")) {
contentZone.innerHTML = `
  <section class="space-y-4 animate-pulse">
    <div class="rounded-2xl border border-red-400/60 bg-gradient-to-br from-red-950/40 to-slate-900 p-6 shadow-xl">
      
      <h2 class="text-lg font-semibold text-red-200 flex items-center gap-2">
        ⚠️ Something went wrong
      </h2>

      <p class="text-slate-300 text-sm mt-3 leading-relaxed">
        We couldn’t load this content. It may be missing or temporarily unavailable.
      </p>

      <div class="mt-5 flex gap-3 flex-wrap">
        <button id="ntRetryBtn"
          class="px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-800/60 text-sm transition">
          Try Again
        </button>

        <button id="ntHomeBtn"
          class="px-4 py-2 rounded-lg bg-cyan-700/90 hover:bg-cyan-600 text-white text-sm shadow">
          Start Over
        </button>
      </div>

    </div>
  </section>
`;
    ntLog("CONTENT AFTER RENDER", {
      source: "fetchCatch",
      length: contentZone?.innerHTML?.length ?? 0
    });

    document.getElementById("ntRetryBtn")?.addEventListener("click", () => {
      window.loadCard?.("nt");
    });

    window.addEventListener("error", (e) => {
  console.error("[NT GLOBAL ERROR]", e.error);

  if (contentZone) {
    contentZone.innerHTML = `
      <div class="p-6 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200">
        JavaScript crashed.<br/>
        Open console for details.
      </div>
    `;
  }
});

    document.getElementById("ntHomeBtn")?.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("card", "nt");
      url.searchParams.delete("book");
      url.searchParams.delete("chapter");
      url.searchParams.delete("view");
      url.searchParams.delete("section");
      window.history.replaceState({}, "", url);
      window.loadCard?.("nt");
    });
  }
});
})();
