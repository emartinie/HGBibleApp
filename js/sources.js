(function () {
  const INTERTEXT_DATA_URL = "data/intertext/nt_ot_quotes.json";

  function getScope(root = document) {
    return root && typeof root.querySelector === "function" ? root : document;
  }

  function setStatus(scope, message) {
    const status = scope.querySelector("#sourcesStatus");
    if (status) status.textContent = message;
  }

  function openCard(cardName) {
    if (!cardName || typeof window.loadCard !== "function") return;
    window.loadCard(cardName);
  }

  function openInvestigation(file) {
    if (!file) return;
    window.pendingInvestigationFile = file;
    openCard("investigations");
  }

  async function loadIntertextSummary(scope) {
    const meta = scope.querySelector("#sourcesIntertextMeta");
    if (!meta) return;

    try {
      const response = await fetch(INTERTEXT_DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const entries = Array.isArray(data) ? data : Object.values(data || {});
      const ntCount = entries.filter(entry => entry?.nt?.text).length;
      const lxxCount = entries.filter(entry => entry?.ot?.lxx?.text).length;
      const masoreticCount = entries.filter(entry => entry?.ot?.masoretic?.text).length;

      meta.textContent =
        `${entries.length} entries · ${ntCount} NT · ${lxxCount} LXX · ${masoreticCount} Masoretic`;
    } catch (error) {
      console.warn("[Sources] intertext summary unavailable", error);
      meta.textContent = "Intertext dataset available in the explorer.";
    }
  }

  function bindSourceRoutes(scope) {
    const card = scope.querySelector("#sourcesCard");
    if (!card) return;

    card.onclick = event => {
      const cardButton = event.target.closest("[data-source-card]");
      if (cardButton) {
        const cardName = cardButton.dataset.sourceCard;
        setStatus(scope, `Opening ${cardButton.textContent.trim()}.`);
        openCard(cardName);
        return;
      }

      const investigationButton = event.target.closest("[data-investigation-file]");
      if (investigationButton) {
        setStatus(scope, `Opening ${investigationButton.textContent.trim()}.`);
        openInvestigation(investigationButton.dataset.investigationFile);
      }
    };
  }

  async function initSourcesCard(root = document) {
    const scope = getScope(root);
    if (!scope.querySelector("#sourcesCard")) return;

    bindSourceRoutes(scope);
    await loadIntertextSummary(scope);
    console.log("[Sources] verified resource routes ready");
  }

  window.initSourcesCard = initSourcesCard;
})();
