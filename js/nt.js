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
    setSubContext("Choose a book to begin structured study.");

    if (!root) return;

    root.innerHTML = `
      <section class="space-y-6">
        <div id="nt-book-grid"
             style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
        </div>

        <p class="text-slate-400 text-sm">
          Each book includes an introduction, objectives, summaries,
          outlines, and review questions—drawn directly from the text.
        </p>
      </section>
    `;

    loadBookTiles();
  }

  function loadBookTiles() {
    const books = [
      "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
      "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
      "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
      "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
      "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
    ];

    const grid = document.getElementById("nt-book-grid");
    if (!grid) return;

    books.forEach(bookName => {
      const tile = document.createElement("a");
      tile.href = `${NT_BASE}?book=${encodeURIComponent(bookName)}&view=introduction`;

      tile.style.cssText = `
        display:block;
        padding:12px;
        border:1px solid #334155;
        border-radius:8px;
        text-decoration:none;
        color:inherit;
      `;

      tile.innerHTML = `
        <div style="font-weight:600;">${bookName}</div>
        <div style="font-size:0.8rem;color:#94a3b8;">Introduction</div>
      `;

      tile.onmouseenter = () => {
        tile.style.background = "#0f172a";
      };

      tile.onmouseleave = () => {
        tile.style.background = "transparent";
      };

      grid.appendChild(tile);
    });
  }

  function renderIntroduction(bookName, intro) {
    setContextHeader(`${bookName} — Introduction`);
    setSubContext("Book overview and study entry points.");

    if (!root) return;

    if (!intro?.rawText) {
      root.innerHTML = "<p>No introduction available.</p>";
      return;
    }

    const linkIntro = `${NT_BASE}?book=${encodeURIComponent(bookName)}&view=introduction`;
    const linkCh1 = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1`;
    const linkSum = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=summary`;
    const linkRQ = `${NT_BASE}?book=${encodeURIComponent(bookName)}&chapter=1&section=reviewQuestions`;

    root.innerHTML = `
      <section class="mb-6">
        <h2 class="text-xl font-semibold">Begin Study</h2>

        <div class="flex gap-2 flex-wrap mt-3">
          <a href="${linkCh1}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60">Read Chapter 1</a>
          <a href="${linkSum}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60">Summary First</a>
          <a href="${linkRQ}" class="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60">Review Questions</a>

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

    const btn = document.getElementById("introPanelBtn");
    if (btn) {
      btn.onclick = () => {
        openPanel(
          `${bookName} — Introduction`,
          buildPanelSection(`${bookName} — Introduction`, intro.rawText, linkIntro)
        );
      };
    }
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
        root.innerHTML = "<p class='text-red-400'>Error loading content.</p>";
      }
    });
})();
