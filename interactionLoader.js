(function () {
  "use strict";

  const SAFE_INTERACTIONS = {
    interlinear: {
      html: "cards/interlinear.html",
      script: "js/interlinear.js",
      init: "initInterlinearCard",
      cleanup: "destroyInterlinearCard",
      title: "Look Beneath the English"
    }
  };

  const loadedScripts = new Map();
  let requestId = 0;
  let activeInteraction = null;

  function loadScriptOnce(src, interactionName) {
    if (!src) return Promise.resolve();
    if (loadedScripts.has(src)) return loadedScripts.get(src);

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${src}?v=${Date.now()}`;
      script.defer = true;
      script.dataset.interactionScript = interactionName;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.body.appendChild(script);
    });

    loadedScripts.set(src, promise);
    return promise;
  }

  function cleanup(root) {
    if (!activeInteraction) return;
    const definition = SAFE_INTERACTIONS[activeInteraction];

    root.dispatchEvent(new CustomEvent("interaction:cleanup", {
      bubbles: true,
      detail: { interactionName: activeInteraction }
    }));

    if (definition?.cleanup && typeof window[definition.cleanup] === "function") {
      window[definition.cleanup](root);
    }

    activeInteraction = null;
  }

  async function load(interactionName, root) {
    const definition = SAFE_INTERACTIONS[interactionName];
    if (!definition) throw new Error(`Interaction is not allowed: ${interactionName}`);
    if (!root) throw new Error("An interaction host is required.");

    const currentRequest = ++requestId;
    cleanup(root);
    root.innerHTML = '<div class="interaction-status">Opening companion…</div>';

    try {
      const response = await fetch(`${definition.html}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load ${definition.html}`);
      const html = await response.text();
      if (currentRequest !== requestId) return false;

      root.innerHTML = `<div class="interaction-card-host">${html}</div>`;
      activeInteraction = interactionName;

      await loadScriptOnce(definition.script, interactionName);
      if (currentRequest !== requestId) return false;

      root.dispatchEvent(new CustomEvent("interaction:init", {
        bubbles: true,
        detail: { interactionName }
      }));

      if (definition.init && typeof window[definition.init] === "function") {
        await window[definition.init](root);
      }

      return true;
    } catch (error) {
      if (currentRequest !== requestId) return false;
      activeInteraction = null;
      root.innerHTML = '<div class="interaction-status interaction-error">This companion could not be opened.</div>';
      throw error;
    }
  }

  function cancel(root) {
    requestId += 1;
    cleanup(root);
    if (root) root.replaceChildren();
  }

  window.interactionLoader = Object.freeze({ load, cancel });
})();
