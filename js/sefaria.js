(function () {
  const root = document.getElementById("sefariaContent");
  const meta = document.getElementById("sefariaMeta");
  const bookInput = document.getElementById("sefariaBook");
  const chapterInput = document.getElementById("sefariaChapter");

  const loadBtn = document.getElementById("sefariaLoadBtn");
  const prevBtn = document.getElementById("sefariaPrevBtn");
  const nextBtn = document.getElementById("sefariaNextBtn");

  const searchInput = document.getElementById("sefariaSearch");
  const searchBtn = document.getElementById("sefariaSearchBtn");

  if (!root || !bookInput || !chapterInput) return;

  const NT_BASE = "cards/nt.html";

  // -----------------------------
  // STATE (single source of truth)
  // -----------------------------
  let state = {
    book: "Genesis",
    chapter: "1"
  };

  function syncState(book, chapter) {
    state.book = book;
    state.chapter = chapter;
  }

  function getRef() {
    return {
      book: (bookInput.value || state.book || "Genesis").trim(),
      chapter: String(Math.max(1, Number(chapterInput.value || state.chapter || 1)))
    };
  }

  // -----------------------------
  // SAFE HELPERS
  // -----------------------------
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
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  function parseReference(input) {
    if (!input) return null;

    const cleaned = input.trim().replace(/\s+/g, " ");
    const match = cleaned.match(/^(.+?)\s+(\d+)(?::(\d+))?$/i);
    if (!match) return null;

    return {
      book: match[1].trim(),
      chapter: String(Math.max(1, Number(match[2]) || 1)),
      verse: match[3] ? String(Math.max(1, Number(match[3]) || 1)) : null
    };
  }

  // -----------------------------
  // CORE LOADER
  // -----------------------------
  async function loadSefaria(book, chapter) {
    root.innerHTML = "Loading...";

    try {
      const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(book)}.${chapter}?lang=bi`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (!Array.isArray(data?.text)) throw new Error("Invalid response");

      const html = data.text.map((v, i) => `
        <p class="rounded-md px-2 py-1">
          <span class="text-slate-500 mr-2">${i + 1}</span>${escapeHtml(v)}
        </p>
      `).join("");

      root.innerHTML = `<div class="space-y-2">${html}</div>`;

      meta.textContent = data.ref || `${book} ${chapter}`;

      bookInput.value = book;
      chapterInput.value = chapter;

      syncState(book, chapter);

    } catch (err) {
      root.innerHTML = `<div class="text-red-400">Failed: ${err.message}</div>`;
    }
  }

  // -----------------------------
  // ACTIONS
  // -----------------------------
  function handleLoad() {
    const { book, chapter } = getRef();
    loadSefaria(book, chapter);
  }

  function handleSearch() {
    const parsed = parseReference(searchInput.value);
    if (!parsed) {
      root.innerHTML = `<div class="text-red-400">Invalid reference</div>`;
      return;
    }
    loadSefaria(parsed.book, parsed.chapter);
  }

  function handlePrev() {
    const { book, chapter } = getRef();
    loadSefaria(book, String(Math.max(1, Number(chapter) - 1)));
  }

  function handleNext() {
    const { book, chapter } = getRef();
    loadSefaria(book, String(Number(chapter) + 1));
  }

  // -----------------------------
  // EVENTS
  // -----------------------------
  loadBtn?.addEventListener("click", handleLoad);
  searchBtn?.addEventListener("click", handleSearch);
  prevBtn?.addEventListener("click", handlePrev);
  nextBtn?.addEventListener("click", handleNext);

  chapterInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLoad();
  });

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // -----------------------------
  // INIT
  // -----------------------------
  const saved = loadLastRef?.();
  if (saved?.book && saved?.chapter) {
    loadSefaria(saved.book, saved.chapter);
  } else {
    loadSefaria("Genesis", "1");
  }

})();
