(function () {

  // =========================================================
  // 📦 CORE DOM / CONFIG
  // =========================================================

  const NT_BASE = "cards/nt.html";
  const root = document.getElementById("nt-root");

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
  // 🧰 UTILITIES
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

  function hasPorchPanel() {
    return typeof window.openPorchPanel === "function";
  }

  // =========================================================
  // 🪟 PANEL SYSTEM
  // =========================================================

  function openPanel(title, html) {
    if (hasPorchPanel()) {
      window.openPorchPanel(title, html);
      return;
    }

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
  // 🔗 LINK INTERCEPT SYSTEM
  // =========================================================

  function interceptNTLinks() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || !href.startsWith(NT_BASE)) return;

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
  // 🏷️ HEADER STATE
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
  // 🏠 LANDING PAGE
  // =========================================================

  function renderNTLanding() {
    setContextHeader("My New Testament Notes");
    setSubContext("Choose a book and jump straight to the part you want.");

    if (!root) return;

    root.innerHTML = `
      <section class="space-y-6">

        <div class="text-center space-y-2 border-b border-slate-700 pb-4">
          <h1 class="text-2xl font-bold text-cyan-200">
            📖 My New Testament Research
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
          or leave yourself a reminder for future Jewish Research tie-ins.
        </div>

      </section>
    `;

    loadBookTiles();
  }

  // =========================================================
  // 📚 BOOK GRID
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
      const tile = document.createElement("div");
      tile.className = "group rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900/80 to-slate-950/60 p-4";

      tile.innerHTML = `
        <div class="mb-4 border-b border-slate-700 pb-3">
          <div class="text-lg font-semibold text-cyan-200">
            ${bookName}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <a href="${NT_BASE}?book=${encodeURIComponent(bookName)}&view=introduction">Intro</a>
          <a href="${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1">Chapter 1</a>
          <a href="${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=summary">Summary</a>
          <a href="${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=reviewQuestions">Review</a>
        </div>
      `;

      grid.appendChild(tile);
    });
  }

  // =========================================================
  // 📖 CHAPTER RENDERING
  // =========================================================

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
      renderSection("objectives", "Objectives", ch.objectives, bookName, chapterNum);
    }

    if (!activeSection || activeSection === "summary") {
      renderSection("summary", "Summary", ch.summary, bookName, chapterNum);
    }

    if (!activeSection || activeSection === "outline") {
      renderSection("outline", "Outline", ch.outline, bookName, chapterNum);
    }

    if (!activeSection || activeSection === "wordsToPonder") {
      renderSection("wordsToPonder", "Words to Ponder", ch.wordsToPonder, bookName, chapterNum);
    }

    if (!activeSection || activeSection === "reviewQuestions") {
      renderSection("reviewQuestions", "Review Questions", ch.reviewQuestions, bookName, chapterNum);
    }
  }

  // =========================================================
  // 🧾 SECTION RENDERER
  // =========================================================

  function renderSection(id, title, text, book, chapter) {
    if (!text) return;

    const el = document.getElementById(id);
    if (!el) return;

    const href =
      `${NT_BASE}?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(chapter)}&section=${encodeURIComponent(id)}`;

    const paragraphs = String(text)
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .split(/\n\s*\n+/)
      .map(p => `<p>${escapeHtml(p.trim())}</p>`)
      .join("");

    el.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-3">
        <h2 class="text-xl font-semibold text-cyan-200">${title}</h2>

        <div class="flex gap-2">
          <a href="${href}">Link</a>
          <button data-copy="${escapeHtml(href)}">Copy</button>
          <button data-panel="${escapeHtml(id)}">Panel</button>
        </div>
      </div>

      <div class="reader-block">
        ${paragraphs}
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

  // =========================================================
  // 📘 INTRODUCTION
  // =========================================================

  function renderIntroduction(bookName, intro) {
    setContextHeader(`${bookName} — Introduction`);
    setSubContext("Book overview and study entry points.");

    if (!root) return;
    if (!intro?.rawText) {
      root.innerHTML = "<p>No introduction available.</p>";
      return;
    }

    root.innerHTML = `
      <section>
        <h2>Begin Study</h2>
        <div class="reader-block">
          <pre>${escapeHtml(intro.rawText)}</pre>
        </div>
      </section>
    `;
  }

  // =========================================================
  // 🧭 NAVIGATION
  // =========================================================

  function renderChapterNav(bookName, chapterNum) {
    const nav = document.getElementById("chapter-nav");
    if (!nav) return;

    const chNum = Number(chapterNum);

    nav.innerHTML = `
      <div style="display:flex;justify-content:space-between;">
        <div>
          ${chNum > 1 ? `<a href="#">← Previous</a>` : `<span>← Previous</span>`}
        </div>
        <div>Chapter ${chNum}</div>
        <div>
          <a href="#">Next →</a>
        </div>
      </div>
    `;
  }

  // =========================================================
  // 🚀 INIT
  // =========================================================

  interceptNTLinks();

  const { book, chapter, view, section } = getParams();

  if (!book) {
    renderNTLanding();
    return;
  }

  const bookKey = book.toLowerCase().replace(/\s+/g, "");
  const jsonPath = `data/nt/${bookKey}.json`;

  fetch(jsonPath)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load book data");
      return res.json();
    })
    .then(data => {

      if (!root) return;

      root.innerHTML = `
        <section>
          <div id="nt-header"></div>
          <div id="nt-body"></div>
        </section>
      `;

      const body = document.getElementById("nt-body");

      if (view === "introduction") {
        renderIntroduction(book, data.introduction);
        return;
      }

      if (!chapter) {
        body.innerHTML = "<p>Select a chapter.</p>";
        return;
      }

      const ch = data.chapters[String(chapter)];
      if (!ch) {
        body.innerHTML = "<p>Chapter not found.</p>";
        return;
      }

      renderChapter(book, chapter, ch, section);

    })
    .catch(err => {
      console.error(err);

      if (root) {
        root.innerHTML = `<p>Error loading NT data.</p>`;
      }
    });

})();
