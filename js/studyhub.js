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
    document.getElementById("studyhubRefreshBtn")?.addEventListener("click", updateStudyHubContext);

    document.getElementById("openNtReaderBtn")?.addEventListener("click", () => {
      setAppRoute({
        card: "nt",
        book: null,
        chapter: null,
        view: null,
        section: null
      });
      openCardByName("nt");
    });

    document.getElementById("openIntertextBtn")?.addEventListener("click", () => {
      setAppRoute({ card: "intertext-quotes" });
      openCardByName("intertext-quotes");
    });

    document.getElementById("openSourcesBtn")?.addEventListener("click", () => {
      setAppRoute({ card: "sources" });
      openCardByName("sources");
    });

    document.getElementById("openPrepNotesBtn")?.addEventListener("click", () => {
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
    });
  }

  function initStudyHub() {
    updateStudyHubContext();
    wireStudyHubButtons();
  }

  initStudyHub();
})();
