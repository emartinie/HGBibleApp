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
    contentZone.innerHTML = `
      <div class="p-6 text-slate-300">
        NT Landing (we’ll rebuild this next)
      </div>
    `;
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
