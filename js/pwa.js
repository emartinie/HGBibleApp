// HG Bible App PWA registration — Phase 1.
(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js", {
        scope: "./",
        updateViaCache: "none"
      });

      // Check for a newer shell without interrupting the current session.
      registration.update().catch(() => {});
    } catch (error) {
      console.warn("[PWA] Service worker registration failed", error);
    }
  });
})();
