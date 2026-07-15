window.initSefariaCard = function initSefariaCard() {
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
  const match = cleaned.match(/^(.+?)\s+(\d+)(?::(\d+))?(?:\s*-\s*(?:(\d+):)?(\d+))?$/i);
  if (!match) return null;

  return {
    reference: cleaned,
    book: match[1].trim(),
    chapter: String(Math.max(1, Number(match[2]) || 1)),
    verse: match[3] ? String(Math.max(1, Number(match[3]) || 1)) : null
  };
}

function toSefariaApiRef(reference) {
  return String(reference || "")
    .trim()
    .replace(/\s+(\d)/, ".$1")
    .replace(/:/g, ".");
}

function flattenText(value) {
  if (Array.isArray(value)) return value.flatMap(flattenText);
  return value === null || value === undefined ? [] : [String(value)];
}

function makePassageEntries(text, sections = [], toSections = []) {
  const startChapter = Number(sections[0] || 1);
  const endChapter = Number(toSections[0] || startChapter);
  const startVerse = Number(sections[1] || 1);
  const chapterGroups = Array.isArray(text) && Array.isArray(text[0]);

  if (chapterGroups || endChapter !== startChapter) {
    return text.flatMap((chapterText, chapterIndex) => {
      const chapter = startChapter + chapterIndex;
      const firstVerse = chapterIndex === 0 ? startVerse : 1;
      return flattenText(chapterText).map((value, verseIndex) => ({
        label: `${chapter}:${firstVerse + verseIndex}`,
        value
      }));
    });
  }

  return flattenText(text).map((value, verseIndex) => ({
    label: String(startVerse + verseIndex),
    value
  }));
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

  async function loadSefaria(book = "Genesis", chapter = "1", requestedReference = "") {
    root.innerHTML = "Loading...";

    try {
      const apiRef = requestedReference
        ? toSefariaApiRef(requestedReference)
        : `${book}.${chapter}`;
      const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(apiRef)}?lang=bi&context=0`;
      const res = await fetch(url);
      const data = await res.json();

      console.log("SEFARIA:", data);

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      const passageEntries = makePassageEntries(
        data?.text,
        data?.sections,
        data?.toSections
      );
      if (!passageEntries.length) {
        throw new Error("No text returned");
      }

      const verses = passageEntries
        .map(entry => `
          <p class="rounded-md px-2 py-1">
            <span class="text-slate-500 mr-2">${entry.label}</span>${entry.value}
          </p>
        `)
        .join("");

      root.innerHTML = `
        <div class="space-y-2">
          ${verses}
        </div>
      `;

      meta.textContent = data.ref || requestedReference || `${book} ${chapter}`;
      bookInput.value = book;
      chapterInput.value = chapter;
      searchInput.value = requestedReference || `${book} ${chapter}`;
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

    loadSefaria(parsed.book, parsed.chapter, parsed.reference);
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
};
