function ntLog(label, data = null) {
  console.log(`[NT] ${label}`, data ?? "");
}

(function () {
  const NT_BASE = "cards/nt.html";

  // ✅ ONLY ONE TARGET
  const contentZone = document.getElementById("nt-content");

  function getParams() {
    const params = new URLSearchParams(window.location.search);

    return {
      book: params.get("book"),
      chapter: params.get("chapter"),
      view: params.get("view"),
      section: params.get("section")
    };
  }

  function renderLoading() {
    contentZone.innerHTML = `
      <div class="p-6 text-slate-400">
        Loading...
      </div>
    `;
  }

  function renderError(msg) {
    contentZone.innerHTML = `
      <div class="p-6 text-red-300">
        ${msg}
      </div>
    `;
  }

  async function init() {
    const { book, chapter, view, section } = getParams();

    ntLog("PARAMS", { book, chapter, view, section });

    if (!book) {
      renderLanding();
      return;
    }

    renderLoading();

    const key = book.toLowerCase().replace(/\s+/g, "");
    const jsonPath = `data/nt/${key}.json`;

    ntLog("FETCH", jsonPath);

    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error("Failed to load book JSON");

      const data = await res.json();
      ntLog("DATA LOADED", data);

      if (view === "introduction") {
        renderIntroduction(book, data);
        return;
      }

      if (!chapter) {
        renderError("Select a chapter");
        return;
      }

      const ch = data.chapters?.[String(chapter)];

      if (!ch) {
        renderError("Chapter not found");
        return;
      }

      renderChapter(book, chapter, ch, section);

    } catch (err) {
      console.error(err);
      renderError("Failed to load NT data");
    }
  }

function renderLanding() {
  ntLog("RENDER LANDING");

  contentZone.innerHTML = `
    <section class="space-y-6">

      <div class="text-center space-y-2 border-b border-slate-700 pb-4">
        <h1 class="text-2xl font-bold text-cyan-200">
          📖 My New Testament Notes
        </h1>

        <p class="text-slate-400 text-sm">
          Choose a book and jump straight in.
        </p>
      </div>

      <div id="nt-book-grid"
        class="grid gap-4"
        style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));">
      </div>

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

  if (!grid) {
    ntLog("GRID MISSING ❌");
    return;
  }

  ntLog("BUILDING GRID", books.length);

  grid.innerHTML = ""; // important reset

  for (const book of books) {
    const intro = `${NT_BASE}?book=${encodeURIComponent(book)}&view=introduction`;
    const ch1 = `${NT_BASE}?book=${encodeURIComponent(book)}&chapter=1`;

    const card = document.createElement("div");
    card.className =
      "rounded-2xl border border-slate-700 bg-slate-900/60 p-4 space-y-3";

    card.innerHTML = `
      <div class="text-lg font-semibold text-cyan-200">
        ${book}
      </div>

      <div class="flex flex-wrap gap-2 text-sm">

        <a href="${intro}"
          class="px-3 py-1 rounded border border-slate-700 hover:bg-slate-800">
          Intro
        </a>

        <a href="${ch1}"
          class="px-3 py-1 rounded border border-slate-700 hover:bg-slate-800">
          Chapter 1
        </a>

      </div>
    `;

    grid.appendChild(card);
  }
}

  function renderIntroduction(book, data) {
    contentZone.innerHTML = `
      <div class="p-6 text-slate-300">
        Introduction placeholder for ${book}
      </div>
    `;
  }

  function renderChapter(book, chapter, ch, section) {
    ntLog("RENDER CHAPTER", { book, chapter, section });

    contentZone.innerHTML = `
      <div class="p-6 text-slate-300">
        Chapter ${chapter} loaded for ${book}
      </div>
    `;
  }

  init();
})();
