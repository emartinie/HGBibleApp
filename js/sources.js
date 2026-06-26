(function () {
  const expectedSourceIds = [
    "openIntertextBtn",
    "openNtReaderBtn",
    "loadBtn",
    "referenceSelect",
    "toggleJewish",
    "jewishSection",
    "toggleNT",
    "ntSection",
    "toggleFathers",
    "fathersSection",
    "toggleDSS",
    "dssSection",
    "togglePeople",
    "peopleSection"
  ];

  const toggles = {
    toggleJewish: "jewishSection",
    toggleNT: "ntSection",
    toggleFathers: "fathersSection",
    toggleDSS: "dssSection",
    togglePeople: "peopleSection"
  };

  function initSourcesCard() {
    const missingSourceIds = expectedSourceIds.filter(id => !document.getElementById(id));

    if (missingSourceIds.length) {
      console.warn(`[sources.js] Missing expected sources.html IDs: ${missingSourceIds.join(", ")}`);
    }

    const openIntertextBtn = document.getElementById("openIntertextBtn");
    if (openIntertextBtn) {
      openIntertextBtn.onclick = () => {
        window.dispatchEvent(new CustomEvent("open-intertext"));
        window.loadCard?.("intertext-quotes");
      };
    }

    const openNtReaderBtn = document.getElementById("openNtReaderBtn");
    if (openNtReaderBtn) {
      openNtReaderBtn.onclick = () => {
        window.dispatchEvent(new CustomEvent("open-nt-reader"));
        window.loadCard?.("nt");
      };
    }

    const loadBtn = document.getElementById("loadBtn");
    if (loadBtn) {
      loadBtn.onclick = () => {
        const val = document.getElementById("referenceSelect")?.value;
        window.dispatchEvent(new CustomEvent("load-reference", { detail: val }));
      };
    }

    Object.entries(toggles).forEach(([btnId, sectionId]) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;

      btn.onclick = () => {
        document.getElementById(sectionId)?.classList.toggle("hidden");
      };
    });

    console.log("[sources] listeners attached");
  }

  window.initSourcesCard = initSourcesCard;
  initSourcesCard();
})();
