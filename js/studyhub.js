(function () {
  function getStudyContext() {
    const week = typeof getSelectedWeekNumber === "function"
      ? getSelectedWeekNumber()
      : 1;

    return { week };
  }

  function updateStudyHubContext() {
    const weekText = document.getElementById("studyhubWeekText");
    if (!weekText) return;

    const ctx = getStudyContext();
    weekText.textContent = `Quick access to the current study flow. Week ${ctx.week}.`;
  }

  function setAppRoute(params) {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    window.history.replaceState({}, "", url);
  }

  function openCardByName(cardName) {
    if (typeof window.loadCard === "function") {
      window.loadCard(cardName);
    }
  }

  function wireStudyHubButtons() {
    const refreshBtn = document.getElementById("studyhubRefreshBtn");
    if (refreshBtn) refreshBtn.onclick = updateStudyHubContext;

    const openNtReaderBtn = document.getElementById("openNtReaderBtn");
    if (openNtReaderBtn) openNtReaderBtn.onclick = () => {
      setAppRoute({
        card: "nt",
        book: null,
        chapter: null,
        view: null,
        section: null
      });
      openCardByName("nt");
    };

    const openIntertextBtn = document.getElementById("openIntertextBtn");
    if (openIntertextBtn) openIntertextBtn.onclick = () => {
      setAppRoute({ card: "intertext-quotes" });
      openCardByName("intertext-quotes");
    };

    const openSourcesBtn = document.getElementById("openSourcesBtn");
    if (openSourcesBtn) openSourcesBtn.onclick = () => {
      setAppRoute({ card: "sources" });
      openCardByName("sources");
    };

    const openPrepNotesBtn = document.getElementById("openPrepNotesBtn");
    if (openPrepNotesBtn) openPrepNotesBtn.onclick = () => {
      const ctx = getStudyContext();

      if (typeof window.openPorchPanel === "function") {
        window.openPorchPanel(
          "Prep Notes",
          `<div class="space-y-3">
             <p><strong>Week:</strong> ${ctx.week}</p>
             <p>This is a placeholder for sermon prep, notes, and compiled study resources.</p>
           </div>`
        );
      }
    };
  }

  function initStudyHub() {
    updateStudyHubContext();
    wireStudyHubButtons();
  }

  window.initStudyHubCard = initStudyHub;
  initStudyHub();
})();
