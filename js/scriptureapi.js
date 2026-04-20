(async function () {
  const API_BASE = "https://rest.api.bible";
  const API_KEY = "5sFfxuspfEX8TD9YAODX8";
  const BIBLE_ID = "a6aee10bb058511c-01"; // KJV example

  const root = document.getElementById("scriptureContent");
  const meta = document.getElementById("scriptureMeta");
  const bookSelect = document.getElementById("scriptureBook");
  const chapterInput = document.getElementById("scriptureChapter");
  const loadBtn = document.getElementById("scriptureLoadBtn");
  const prevBtn = document.getElementById("scripturePrevBtn");
  const nextBtn = document.getElementById("scriptureNextBtn");

  if (!root || !bookSelect || !chapterInput) return;

  function getRef() {
    const book = bookSelect.value || "JHN";
    const chapter = String(Math.max(1, Number(chapterInput.value) || 1));
    return { book, chapter };
  }

  function setMeta(book, chapter, apiData) {
    const title = apiData?.data?.reference || `${book} ${chapter}`;
    meta.textContent = title;
  }

  async function loadChapter(book = "JHN", chapter = "1") {
    root.innerHTML = "Loading...";

    try {
      const res = await fetch(
        `${API_BASE}/v1/bibles/${BIBLE_ID}/chapters/${book}.${chapter}`,
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

      setMeta(book, chapter, data);

      root.innerHTML = `
        <div class="prose prose-invert max-w-none">
          ${data.data.content}
        </div>
      `;
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

  loadBtn?.addEventListener("click", handleLoad);
  prevBtn?.addEventListener("click", handlePrev);
  nextBtn?.addEventListener("click", handleNext);

  chapterInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLoad();
  });

  bookSelect.addEventListener("change", () => {
    chapterInput.value = 1;
    handleLoad();
  });

  loadChapter(bookSelect.value, chapterInput.value);
})();
