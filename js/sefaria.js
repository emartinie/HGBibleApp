(function () {

  const root = document.getElementById("sefariaContent");
  const meta = document.getElementById("sefariaMeta");
  const bookInput = document.getElementById("sefariaBook");
  const chapterInput = document.getElementById("sefariaChapter");
  const loadBtn = document.getElementById("sefariaLoadBtn");

  if (!root || !bookInput || !chapterInput) return;

  async function loadSefaria(book = "Genesis", chapter = "1") {
    root.innerHTML = "Loading...";

    try {
      const res = await fetch(
        `https://www.sefaria.org/api/texts/${encodeURIComponent(book)}.${chapter}?lang=bi`
      );

      const data = await res.json();
      console.log("SEFARIA:", data);

      if (!data?.text) {
        throw new Error("No text returned");
      }

      const verses = data.text
        .map((v, i) => `
          <p>
            <span class="text-slate-500">${i + 1}</span>
            ${v}
          </p>
        `)
        .join("");

      root.innerHTML = `
        <div class="space-y-2">
          ${verses}
        </div>
      `;

      meta.textContent = data.ref || `${book} ${chapter}`;

    } catch (err) {
      root.innerHTML = `<div class="text-red-400">Failed: ${err.message}</div>`;
      console.error(err);
    }
  }

  function handleLoad() {
    const book = bookInput.value || "Genesis";
    const chapter = chapterInput.value || "1";
    loadSefaria(book, chapter);
  }

  loadBtn?.addEventListener("click", handleLoad);

  chapterInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLoad();
  });

})();
