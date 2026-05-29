function ntLog(label, data = null) {
  console.log(`[NT] ${label}`, data ?? "");
}

(function () {
  const NT_BASE = "cards/nt.html";

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

  function render() {
    const { book, chapter, view, section } = getParams();

    ntLog("ROUTE", { book, chapter, view, section });

    // 1. No book → landing
    if (!book) {
      renderLanding();
      return;
    }

    // 2. introduction view
    if (view === "introduction") {
      renderIntroduction(book);
      return;
    }

    // 3. chapter view
    if (chapter) {
      renderChapter(book, chapter, section);
      return;
    }

    // fallback
    contentZone.innerHTML = `<div class="p-6 text-slate-400">Select a chapter</div>`;
  }

  function renderLanding() {
    contentZone.innerHTML = `
      <div class="p-6 space-y-4">
        <h1 class="text-xl text-cyan-200 font-bold">
          📖 New Testament
        </h1>

        <p class="text-slate-400">
          Landing page ready. Next step: book grid + Sefaria links.
        </p>
      </div>
    `;
  }

  function renderIntroduction(book) {
    contentZone.innerHTML = `
      <div class="p-6 text-slate-300">
        Introduction: ${book}
      </div>
    `;
  }

  function renderChapter(book, chapter, section) {
    contentZone.innerHTML = `
      <div class="p-6 text-slate-300">
        Chapter ${chapter} — ${book}
        <br/>
        Section: ${section || "none"}
      </div>
    `;
  }

  render();
})();
