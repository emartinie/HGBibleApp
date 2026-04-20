(async function () {
  const API_BASE = "https://rest.api.bible";
  const API_KEY = "5sFfxuspfEX8TD9YAODX8";

  const BIBLE_IDS = {
    KJV: "a6aee10bb058511c-01",
    AMP: "a81b73293d3080c9-01",
    NASB: "b8ee27bcd1cae43a-01"
  };

  const root = document.getElementById("scriptureContent");
  const meta = document.getElementById("scriptureMeta");
  const versionSelect = document.getElementById("scriptureVersion");
  const bookSelect = document.getElementById("scriptureBook");
  const chapterInput = document.getElementById("scriptureChapter");
  const loadBtn = document.getElementById("scriptureLoadBtn");
  const prevBtn = document.getElementById("scripturePrevBtn");
  const nextBtn = document.getElementById("scriptureNextBtn");
  const searchInput = document.getElementById("scriptureSearch");
  const searchBtn = document.getElementById("scriptureSearchBtn");

  if (!root || !versionSelect || !bookSelect || !chapterInput) return;

  const BOOK_MAP = {
    matthew: "MAT",
    mark: "MRK",
    luke: "LUK",
    john: "JHN",
    acts: "ACT",
    romans: "ROM",
    "1 corinthians": "1CO",
    "2 corinthians": "2CO",
    galatians: "GAL",
    ephesians: "EPH",
    philippians: "PHP",
    colossians: "COL",
    "1 thessalonians": "1TH",
    "2 thessalonians": "2TH",
    "1 timothy": "1TI",
    "2 timothy": "2TI",
    titus: "TIT",
    philemon: "PHM",
    hebrews: "HEB",
    james: "JAS",
    "1 peter": "1PE",
    "2 peter": "2PE",
    "1 john": "1JN",
    "2 john": "2JN",
    "3 john": "3JN",
    jude: "JUD",
    revelation: "REV",
    genesis: "GEN",
    exodus: "EXO",
    leviticus: "LEV",
    numbers: "NUM",
    deuteronomy: "DEU",
    joshua: "JOS",
    judges: "JDG",
    ruth: "RUT",
    "1 samuel": "1SA",
    "2 samuel": "2SA",
    "1 kings": "1KI",
    "2 kings": "2KI",
    "1 chronicles": "1CH",
    "2 chronicles": "2CH",
    ezra: "EZR",
    nehemiah: "NEH",
    esther: "EST",
    job: "JOB",
    psalm: "PSA",
    psalms: "PSA",
    proverbs: "PRO",
    ecclesiastes: "ECC",
    "song of solomon": "SNG",
    isaiah: "ISA",
    jeremiah: "JER",
    lamentations: "LAM",
    ezekiel: "EZK",
    daniel: "DAN",
    hosea: "HOS",
    joel: "JOL",
    amos: "AMO",
    obadiah: "OBA",
    jonah: "JON",
    micah: "MIC",
    nahum: "NAM",
    habakkuk: "HAB",
    zephaniah: "ZEP",
    haggai: "HAG",
    zechariah: "ZEC",
    malachi: "MAL"
  };

  function normalizeBookName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, " ");
  }

  function parseReference(input) {
    if (!input) return null;

    const cleaned = input.trim().replace(/\s+/g, " ");
    const match = cleaned.match(/^(.+?)\s+(\d+)(?::(\d+))?$/i);
    if (!match) return null;

    const rawBook = normalizeBookName(match[1]);
    const chapter = String(Number(match[2]));
    const verse = match[3] ? String(Number(match[3])) : null;
    const code = BOOK_MAP[rawBook];

    if (!code || !chapter) return null;

    return { rawBook, code, chapter, verse };
  }

  function getSelectedBibleId() {
    return BIBLE_IDS[versionSelect.value] || BIBLE_IDS.KJV;
  }

  function getRef() {
    const book = bookSelect.value || "JHN";
    const chapter = String(Math.max(1, Number(chapterInput.value) || 1));
    return { book, chapter };
  }

  function setMeta(apiData, verse) {
    const version = versionSelect.value;
    const title = apiData?.data?.reference || "";
    meta.textContent = verse ? `${title} (${version}, verse ${verse})` : `${title} (${version})`;
  }

  function scrollToVerse(verse) {
    if (!verse) return;

    const contentEl = document.getElementById("scriptureContent");
    if (!contentEl) return;

    const verseEl =
      contentEl.querySelector(`[data-number="${verse}"]`) ||
      contentEl.querySelector(`[id$=".${verse}"]`) ||
      contentEl.querySelector(`[id$="-${verse}"]`);

    if (verseEl && typeof verseEl.scrollIntoView === "function") {
      verseEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function loadChapter(book = "JHN", chapter = "1", verse = null) {
    root.innerHTML = "Loading...";

    try {
      const bibleId = getSelectedBibleId();

      const res = await fetch(
        `${API_BASE}/v1/bibles/${bibleId}/chapters/${book}.${chapter}`,
        {
          method: "GET",
          headers: {
            "api-key": API_KEY,
            "accept": "application/json"
          }
        }
      );

      const data = await res.json();
      console.log("API RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      if (!data?.data?.content) {
        throw new Error("No scripture content returned");
      }

      setMeta(data, verse);

      root.innerHTML = `
        <div class="prose prose-invert max-w-none">
          ${data.data.content}
        </div>
      `;

      setTimeout(() => scrollToVerse(verse), 50);
    } catch (err) {
      meta.textContent = "";
      root.innerHTML = `
        <div class="text-red-400">
          Failed to load scripture: ${err.message}
        </div>
      `;
      console.error(err);
    }
  }

  function handleLoad() {
    const { book, chapter } = getRef();
    loadChapter(book, chapter);
  }

  function handlePrev() {
    const current = Math.max(1, Number(chapterInput.value) || 1);
    chapterInput.value = Math.max(1, current - 1);
    handleLoad();
  }

  function handleNext() {
    const current = Math.max(1, Number(chapterInput.value) || 1);
    chapterInput.value = current + 1;
    handleLoad();
  }

  function handleReferenceSearch() {
    const parsed = parseReference(searchInput?.value || "");
    if (!parsed) {
      root.innerHTML = `<div class="text-red-400">Invalid reference. Try "John 1" or "Genesis 1:1".</div>`;
      return;
    }

    bookSelect.value = parsed.code;
    chapterInput.value = parsed.chapter;
    loadChapter(parsed.code, parsed.chapter, parsed.verse);
  }

  loadBtn?.addEventListener("click", handleLoad);
  prevBtn?.addEventListener("click", handlePrev);
  nextBtn?.addEventListener("click", handleNext);
  searchBtn?.addEventListener("click", handleReferenceSearch);

  versionSelect.addEventListener("change", handleLoad);

  chapterInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLoad();
  });

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleReferenceSearch();
  });

  bookSelect.addEventListener("change", () => {
    chapterInput.value = 1;
    handleLoad();
  });

  loadChapter(bookSelect.value, chapterInput.value);
})();
