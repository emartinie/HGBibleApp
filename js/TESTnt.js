function ntLog(label, data = null) {
  console.log(`[NT] ${label}`, data ?? "");
}

// =========================================================
// CORE DOM / CONFIG
// =========================================================

const root = document.getElementById("nt-root");

const headerZone = document.getElementById("nt-header");
const navZone = document.getElementById("nt-nav");
const contentZone = document.getElementById("nt-content");
const panelZone = document.getElementById("nt-panel");

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

  function renderIntertextConnectionsForText(text) {
    const sourceText = String(text || "");
    const matches = intertextEdges.filter(edge => sourceText.includes(edge.from));
    if (!matches.length) return "";

    return `
      <div class="mt-2 rounded-lg border border-cyan-700/40 bg-cyan-950/20 p-3 text-sm">
        <div class="font-semibold text-cyan-200 mb-1">Intertext Connections</div>
        <ul class="list-disc pl-5 text-slate-300">
          ${matches.map(edge => `<li>${escapeHtml(edge.to)} (${escapeHtml(edge.type)})</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function hasPorchPanel() {
    return typeof window.openPorchPanel === "function";
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

  // =========================================================
  // PANEL SYSTEM
  // =========================================================

  function openPanel(title, html) {
    if (hasPorchPanel()) {
      window.openPorchPanel(title, html);
      return;
    }

    // Fallback: render INSIDE nt-root, not a new window
    if (!root) {
      ntLog("ABORT RENDER: missing root", {
        source: "openPanel",
        rootNow: !!document.getElementById("nt-root"),
        contentNow: !!document.getElementById("nt-content"),
        cachedRoot: !!root,
        cachedContent: !!contentZone
      });
      return;
    }

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
      backBtn.onclick = () => {
        window.loadCard?.("nt");
      };
    }
  }

  function buildPanelSection(title, rawText, linkHref) {
    const safeLink = escapeHtml(linkHref || "");

 return `
  <div class="space-y-3 text-left">

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

    <div class="rounded-xl bg-gradient-to-b from-slate-950/60 to-slate-900/40 border border-slate-700 p-4 max-h-[60vh] overflow-auto shadow-inner">

      <div class="prose prose-invert max-w-none text-sm leading-relaxed">

        ${String(rawText || "")
          .replace(/\r\n/g, "\n")
          .replace(/[ \t]{2,}/g, " ")
          .split(/\n\s*\n+/)
          .map(p => `<p class="mb-3">${escapeHtml(p.trim())}</p>`)
          .join("")}

      </div>

    </div>

  </div>
`;
  }

  // =========================================================
  // LINK INTERCEPT SYSTEM
  // =========================================================

  function interceptNTLinks() {
    document.addEventListener("click", (e) => {
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

  if (!root) {
    ntLog("ABORT RENDER: missing root", {
      source: "renderNTLanding",
      rootNow: !!document.getElementById("nt-root"),
      contentNow: !!document.getElementById("nt-content"),
      cachedRoot: !!root,
      cachedContent: !!contentZone
    });
    return;
  }

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

    <div id="nt-book-grid"
         class="grid gap-4"
         style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));">
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

  const grid = document.getElementById("nt-book-grid");
  if (!grid) return;

  books.forEach(bookName => {
    const introLink = `${NT_BASE}?book=${encodeURIComponent(bookName)}&view=introduction`;
    const ch1Link = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1`;
    const summaryLink = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=summary`;
    const reviewLink = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=reviewQuestions`;

    const tile = document.createElement("div");
    tile.className = "group rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900/80 to-slate-950/60 p-4 shadow-lg hover:shadow-cyan-900/20 transition";

    tile.innerHTML = `
  <div class="mb-4 border-b border-slate-700 pb-3">

    <div class="text-lg font-semibold text-cyan-200 group-hover:text-cyan-100 transition">
      ${bookName}
    </div>

    <div class="text-xs text-slate-400">
      Direct entry points
    </div>

  </div>

  <div class="grid grid-cols-2 gap-2">

    <a href="${introLink}"
       class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center transition">
      Intro
    </a>

    <a href="${ch1Link}"
       class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center transition">
      Chapter 1
    </a>

    <a href="${summaryLink}"
       class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center transition">
      Summary
    </a>

    <a href="${reviewLink}"
       class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center transition">
      Review
    </a>

    <button
      type="button"
      class="col-span-2 px-3 py-2 rounded-lg border border-cyan-700/40 bg-cyan-900/20 hover:bg-cyan-800/30 text-sm text-center text-cyan-200 hover:text-white transition"
      data-nt-hint="${bookName}">
      Related Jewish Context
    </button>

  </div>
`;
    grid.appendChild(tile);
  });

  grid.querySelectorAll("[data-nt-hint]").forEach(btn => {
    btn.addEventListener("click", () => {
      const bookName = btn.getAttribute("data-nt-hint");
      openSefariaFromNT(bookName, 1);
      if (!root) {
        ntLog("ABORT RENDER: missing root", {
          source: "relatedJewishContext",
          rootNow: !!document.getElementById("nt-root"),
          contentNow: !!document.getElementById("nt-content"),
          cachedRoot: !!root,
          cachedContent: !!contentZone
        });
        return;
      }

      contentZone.innerHTML = `
        <section class="space-y-4">
          <div class="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <h2 class="text-xl font-semibold text-cyan-200 mb-2">${bookName} — Related Jewish Context</h2>
            <p class="text-slate-300">
              This is a placeholder for future cross-links, hints, thematic alignment,
              and other connections between ${bookName} and Jewish texts or traditions.
            </p>
            <p class="text-slate-400 text-sm mt-3">
              Not wired yet — just making room for the future on purpose.
            </p>

            <div class="mt-4">
              <button id="ntBackToLanding"
                class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm">
                Back to NT Landing
              </button>
            </div>
          </div>
        </section>
      `;
      ntLog("CONTENT AFTER RENDER", {
        source: "relatedJewishContext",
        length: contentZone?.innerHTML?.length ?? 0
      });

      const backBtn = document.getElementById("ntBackToLanding");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
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
  });
}
  
  // =========================================================
  // CHAPTER RENDERING
  // =========================================================

  function renderChapter(bookName, chapterNum, ch, activeSection) {
      ntLog("RENDER DECISION", "chapter");
      ntLog("RENDER CHAPTER", {
    bookName,
    chapterNum,
    activeSection,
    ch
  });
    setContextHeader(`${bookName} — Chapter ${chapterNum}`);
    setSubContext("Objectives, summary, outline, words to ponder, and review questions.");

    if (!root) {
      ntLog("ABORT RENDER: missing root", {
        source: "renderChapter",
        rootNow: !!document.getElementById("nt-root"),
        contentNow: !!document.getElementById("nt-content"),
        cachedRoot: !!root,
        cachedContent: !!contentZone
      });
      return;
    }

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


    renderChapterNav(bookName, chapterNum);

    if (!activeSection || activeSection === "objectives") {
      renderSection("objectives", "Objectives", ch.objectives);
    }

    if (!activeSection || activeSection === "summary") {
      renderSection("summary", "Summary", ch.summary);
    }

    if (!activeSection || activeSection === "outline") {
      renderSection("outline", "Outline", ch.outline);
    }

    if (!activeSection || activeSection === "wordsToPonder") {
      renderSection("wordsToPonder", "Words to Ponder", ch.wordsToPonder);
    }

    if (!activeSection || activeSection === "reviewQuestions") {
      renderSection("reviewQuestions", "Review Questions", ch.reviewQuestions);
    }
  }

  // =========================================================
  // INTRODUCTION
  // =========================================================

  function renderIntroduction(bookName, intro) {
  ntLog("RENDER DECISION", "introduction");
  ntLog("RENDER INTRO", {
    bookName,
    intro
  });
  setContextHeader(`${bookName} — Introduction`);
  setSubContext("Book overview and study entry points.");

  if (!root) {
    ntLog("ABORT RENDER: missing root", {
      source: "renderIntroduction",
      rootNow: !!document.getElementById("nt-root"),
      contentNow: !!document.getElementById("nt-content"),
      cachedRoot: !!root,
      cachedContent: !!contentZone
    });
    return;
  }

  if (!intro?.rawText) {
    root.innerHTML = "<p>No introduction available.</p>";
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
          linkIntro
        )
      );
    };
  }
}

  // =========================================================
  // NAVIGATION
  // =========================================================

  function renderChapterNav(bookName, chapterNum) {
    const nav = document.getElementById("chapter-nav");
    if (!nav) return;

    const chNum = Number(chapterNum);

    const prev = chNum > 1
      ? `<a href="${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=${chNum - 1}">← Previous</a>`
      : `<span style="opacity:0.4;">← Previous</span>`;

    const next = `<a href="${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=${chNum + 1}">Next →</a>`;

    nav.innerHTML = `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        border-bottom:1px solid #334155;
        padding-bottom:0.75rem;
      ">
        <div>${prev}</div>
        <div style="font-weight:600;">Chapter ${chNum}</div>
        <div>${next}</div>
      </div>
    `;
  }

  // =========================================================
  // SECTION RENDERER
  // =========================================================

  function renderSection(id, title, text) {
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
      <div class="flex items-center justify-between gap-2 mb-3">
        <h2 class="text-xl font-semibold text-cyan-200">${title}</h2>
        <div class="flex items-center gap-2">
          <a href="${href}" class="reader-chip">Link</a>
          <button class="reader-chip" data-copy="${escapeHtml(href)}">Copy</button>
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

    el.querySelectorAll("[data-panel]").forEach(b => {
      b.onclick = () => openPanel(
        `${book} — Ch ${chapter} — ${title}`,
        buildPanelSection(`${book} — Ch ${chapter} — ${title}`, text, href)
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
    if (!root) {
      ntLog("ABORT RENDER: missing root", {
        source: "fetchThen",
        rootNow: !!document.getElementById("nt-root"),
        contentNow: !!document.getElementById("nt-content"),
        cachedRoot: !!root,
        cachedContent: !!contentZone
      });
      return;
    }

  const body = contentZone;

  if (view === "introduction") {
    renderIntroduction(book, data.introduction);
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

  renderChapter(book, chapter, ch, section);

  if (view === "panel" && section && ch[section]) {
    const href =
      `${NT_BASE}?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(chapter)}&section=${encodeURIComponent(section)}`;

    openPanel(
      `${book} — Ch ${chapter} — ${section}`,
      buildPanelSection(`${book} — Ch ${chapter}`, ch[section], href)
    );
  }
})
    .catch(err => {
  console.error(err);
  ntLog("FETCH FAILURE", {
    path: jsonPath,
    message: err?.message
  });

  if (root) {
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
          Back to NT Landing
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
