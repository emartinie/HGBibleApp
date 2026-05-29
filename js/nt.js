function ntLog(label, data = null) {
  console.log(`[NT] ${label}`, data ?? "");
}

(function () {
  const NT_BASE = "cards/nt.html";

  const contentZone = document.getElementById("nt-content");
  console.log("[NT INIT] contentZone exists?", !!contentZone, contentZone);
  
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

  debug("ROUTE", { book, chapter, view, section });

  if (!assertZone()) return;

  // 1. No book → landing
  if (!book) {
    debug("ROUTE → LANDING");
    renderLanding();
    return;
  }

  // 2. introduction view
  if (view === "introduction") {
    debug("ROUTE → INTRODUCTION", book);
    renderIntroduction(book);
    return;
  }

  // 3. chapter view
  if (chapter) {
    debug("ROUTE → CHAPTER", { book, chapter, section });
    renderChapter(book, chapter, section);
    return;
  }

  debug("ROUTE → FALLBACK (no chapter)");
  contentZone.innerHTML = `<div class="p-6 text-slate-400">Select a chapter</div>`;
}

function assertZone() {
  if (!contentZone) {
    console.error("[NT FATAL] contentZone is missing (#nt-content)");
    return false;
  }
  return true;
}
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
