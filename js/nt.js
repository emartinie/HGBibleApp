(function () {
  const params = new URLSearchParams(window.location.search);
  const book = params.get("book");
  const chapter = params.get("chapter");
  const view = params.get("view");
  const section = params.get("section");
  const NT_BASE = "cards/nt.html";
  const root = document.getElementById("nt-root");

  // ---------- HELPERS ----------
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

  function hasPorchPanel() {
    return typeof window.openPorchPanel === "function";
  }

  function openPanel(title, html) {
    if (hasPorchPanel()) {
      window.openPorchPanel(title, html);
      return;
    }

    // Fallback: render INSIDE nt-root, not a new window
    if (!root) return;

    root.innerHTML = `
      <section class="space-y-4">
        <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <h2 class="text-xl font-semibold">${escapeHtml(title)}</h2>
          <button id="ntBackBtn" class="reader-chip">Back</button>
        </div>
        ${html}
      </section>
    `;

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
        <div class="flex items-center justify-between gap-2">
          <a href="${safeLink}" class="text-cyan-300 underline text-sm">Open full page ↗</a>
          <button
            class="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
            onclick="navigator.clipboard?.writeText('${safeLink}')">
            Copy link
          </button>
        </div>

        <div class="rounded-xl bg-slate-950/40 border border-slate-700 p-4 max-h-[60vh] overflow-auto">
          <div class="prose prose-invert max-w-none">
            ${String(rawText || "")
              .replace(/\r\n/g, "\n")
              .replace(/[ \t]{2,}/g, " ")
              .split(/\n\s*\n+/)
              .map(p => `<p>${escapeHtml(p.trim())}</p>`)
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

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

  // ---------- RENDERERS ----------
  function setContextHeader(text) {
    const el = document.getElementById("nt-context");
    if (el) el.textContent = text;
  }

  function setSubContext(text) {
    const el = document.getElementById("nt-subcontext");
    if (el) el.textContent = text || "";
  }

function renderNTLanding() {
  setContextHeader("New Testament Reader");
  setSubContext("Choose a book and jump straight to the part you want.");

  if (!root) return;

  root.innerHTML = `
    <section class="space-y-6">
      <div id="nt-book-grid"
           class="grid gap-4"
           style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));">
      </div>

      <p class="text-slate-400 text-sm">
        Start with the introduction, jump into chapter 1, go straight to summary and review questions,
        or leave yourself a reminder for future Jewish context tie-ins.
      </p>
    </section>
  `;

  loadBookTiles();
}

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
    tile.className = "rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg";

    tile.innerHTML = `
      <div class="mb-3">
        <div class="text-lg font-semibold text-cyan-200">${bookName}</div>
        <div class="text-xs text-slate-400">Direct entry points</div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <a href="${introLink}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center">
          Intro
        </a>

        <a href="${ch1Link}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center">
          Chapter 1
        </a>

        <a href="${summaryLink}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center">
          Summary
        </a>

        <a href="${reviewLink}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center">
          Review
        </a>
      </div>
    `;

    grid.appendChild(tile);
  });
}

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
    tile.className = "rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-lg";

    tile.innerHTML = `
      <div class="mb-3">
        <div class="text-lg font-semibold text-cyan-200">${bookName}</div>
        <div class="text-xs text-slate-400">Direct entry points</div>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <a href="${introLink}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center">
          Intro
        </a>

        <a href="${ch1Link}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center">
          Chapter 1
        </a>

        <a href="${summaryLink}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center">
          Summary
        </a>

        <a href="${reviewLink}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-center">
          Review
        </a>

        <button
          type="button"
          class="col-span-2 px-3 py-2 rounded-lg border border-cyan-700/40 bg-cyan-900/20 hover:bg-cyan-800/30 text-sm text-center text-cyan-200"
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
      if (!root) return;

      root.innerHTML = `
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

      const backBtn = document.getElementById("ntBackToLanding");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          window.history.replaceState({}, "", "?card=nt");
          window.loadCard?.("nt");
        });
      }
    });
  });
}
  
  function renderChapter(bookName, chapterNum, ch, activeSection) {
    setContextHeader(`${bookName} — Chapter ${chapterNum}`);
    setSubContext("Objectives, summary, outline, words to ponder, and review questions.");

    if (!root) return;

    root.innerHTML = `
      <section id="chapter-nav" style="margin-bottom:1.5rem;"></section>

      <div id="objectives"></div>
      <div id="summary"></div>
      <div id="outline"></div>
      <div id="wordsToPonder"></div>
      <div id="reviewQuestions"></div>
    `;

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

  function renderSection(id, title, text) {
    if (!text) return;

    const el = document.getElementById(id);
    if (!el) return;

    const href = `${NT_BASE}?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(chapter)}&section=${encodeURIComponent(id)}`;

    const paragraphs = String(text)
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .split(/\n\s*\n+/)
      .map(p => `<p>${escapeHtml(p.trim())}</p>`)
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

  // ---------- INIT ----------
  interceptNTLinks();

  if (!book) {
    renderNTLanding();
    return;
  }

  const bookKey = book.toLowerCase();
  const jsonPath = `data/nt/${bookKey}.json`;

  fetch(jsonPath)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load book data");
      return res.json();
    })
    .then(data => {
      if (view === "introduction") {
        renderIntroduction(book, data.introduction);
        return;
      }

      if (!chapter) {
        root.innerHTML = "<p class='text-slate-400'>Select a chapter.</p>";
        return;
      }

      const ch = data.chapters[chapter];
      if (!ch) throw new Error("Chapter not found");

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
      if (root) {
root.innerHTML = `
  <section class="space-y-4">
    <div class="rounded-2xl border border-red-500/40 bg-red-900/20 p-5">
      <h2 class="text-lg font-semibold text-red-300">Something went wrong</h2>

      <p class="text-slate-300 text-sm mt-2">
        We couldn’t load this content. It may be missing or temporarily unavailable.
      </p>

      <div class="mt-4 flex gap-2 flex-wrap">
        <button id="ntRetryBtn"
          class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm">
          Try Again
        </button>

        <button id="ntHomeBtn"
          class="px-3 py-2 rounded-lg bg-cyan-700/90 hover:bg-cyan-600 text-white text-sm">
          Back to NT Landing
        </button>
      </div>
    </div>
  </section>
`;
        document.getElementById("ntRetryBtn")?.addEventListener("click", () => {
  window.loadCard?.("nt");
});

document.getElementById("ntHomeBtn")?.addEventListener("click", () => {
  const url = new URL(window.location.href);

  document.getElementById("ntQuotesBtn")?.addEventListener("click", () => {
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
