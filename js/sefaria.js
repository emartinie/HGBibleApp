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

  function parseReference(input) {
    if (!input) return null;

    const cleaned = input.trim().replace(/\s+/g, " ");
    const match = cleaned.match(/^(.+?)\s+(\d+)$/i);
    if (!match) return null;

    return {
      book: match[1].trim(),
      chapter: String(Math.max(1, Number(match[2]) || 1))
    };
  }

  function getRef() {
    return {
      book: (bookInput.value || "Genesis").trim(),
      chapter: String(Math.max(1, Number(chapterInput.value) || 1))
    };
  }

  function saveLastRef(book, chapter) {
    localStorage.setItem("sefariaLastRef", JSON.stringify({ book, chapter }));
  }

  function loadLastRef() {
    try {
      return JSON.parse(localStorage.getItem("sefariaLastRef") || "null");
    } catch {
      return null;
    }
  }

  async function loadSefaria(book = "Genesis", chapter = "1") {
    root.innerHTML = "Loading...";

    try {
      const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(book)}.${chapter}?lang=bi`;
      const res = await fetch(url);
      const data = await res.json();

      console.log("SEFARIA:", data);

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      if (!Array.isArray(data?.text) || data.text.length === 0) {
        throw new Error("No text returned");
      }

      const verses = data.text
        .map((v, i) => `
          <p class="rounded-md px-2 py-1">
            <span class="text-slate-500 mr-2">${i + 1}</span>${v}
          </p>
        `)
        .join("");

      root.innerHTML = `
        <div class="space-y-2">
          ${verses}
        </div>
      `;

      meta.textContent = data.ref || `${book} ${chapter}`;
      bookInput.value = book;
      chapterInput.value = chapter;
      searchInput.value = `${book} ${chapter}`;
      saveLastRef(book, chapter);
    } catch (err) {
      meta.textContent = "";
      root.innerHTML = `<div class="text-red-400">Failed: ${err.message}</div>`;
      console.error(err);
    }
  }

  function handleLoad() {
    const { book, chapter } = getRef();
    loadSefaria(book, chapter);
  }

  function handleSearch() {
    const parsed = parseReference(searchInput.value);
    if (!parsed) {
      root.innerHTML = `<div class="text-red-400">Invalid reference. Try "Genesis 1" or "Psalms 23".</div>`;
      return;
    }

    loadSefaria(parsed.book, parsed.chapter);
  }

  function handlePrev() {
    const { book, chapter } = getRef();
    const prev = Math.max(1, Number(chapter) - 1);
    loadSefaria(book, String(prev));
  }

  function handleNext() {
    const { book, chapter } = getRef();
    const next = Number(chapter) + 1;
    loadSefaria(book, String(next));
  }

  loadBtn?.addEventListener("click", handleLoad);
  searchBtn?.addEventListener("click", handleSearch);
  prevBtn?.addEventListener("click", handlePrev);
  nextBtn?.addEventListener("click", handleNext);

  chapterInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLoad();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

const savedSearch = localStorage.getItem("sefariaSearch");

if (savedSearch) {
  searchInput.value = savedSearch;
  localStorage.removeItem("sefariaSearch");
  handleSearch();
} else {
  const jump = JSON.parse(localStorage.getItem("sefariaJump") || "null");

  if (jump?.book && jump?.chapter) {
    loadSefaria(jump.book, jump.chapter);
    localStorage.removeItem("sefariaJump");
  } else {
    const saved = loadLastRef();
    if (saved?.book && saved?.chapter) {
      loadSefaria(saved.book, saved.chapter);
    } else {
      loadSefaria("Genesis", "1");
    }
  }
}
})();
