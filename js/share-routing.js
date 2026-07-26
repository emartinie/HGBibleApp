// Shareable URL routing for dynamically loaded HG Bible App cards.
// This module is imported during app startup by firebaseTimeLoader.js.

(function () {
  const CARD_DETAIL_PARAMS = new Set([
    "file",
    "book",
    "chapter",
    "view",
    "section"
  ]);

  let routeObserver = null;
  let observedHost = null;
  let suppressNextObservedRoute = false;
  let lastObservedCard = null;

  function getCardSelector() {
    return document.getElementById("cardSelector");
  }

  function getLoadedCardHost() {
    return document.getElementById("loadedCardHost");
  }

  function getSelectedCard() {
    return getCardSelector()?.value || null;
  }

  function clearCardDetailParams(url, keep = []) {
    const preserved = new Set(keep);

    CARD_DETAIL_PARAMS.forEach(key => {
      if (!preserved.has(key)) {
        url.searchParams.delete(key);
      }
    });
  }

  function buildAppRoute(cardName, detail = {}) {
    const url = new URL(window.location.href);
    const detailKeys = Object.keys(detail).filter(key => detail[key] !== null && detail[key] !== undefined && detail[key] !== "");

    clearCardDetailParams(url, detailKeys);

    if (cardName) {
      url.searchParams.set("card", cardName);
    } else {
      url.searchParams.delete("card");
    }

    Object.entries(detail).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    url.hash = "";
    return url;
  }

  function writeRoute(cardName, detail = {}, options = {}) {
    const { replace = false, state = {} } = options;
    const url = buildAppRoute(cardName, detail);
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const next = `${url.pathname}${url.search}${url.hash}`;

    if (current === next) return url;

    const method = replace ? "replaceState" : "pushState";
    window.history[method]({ card: cardName, ...detail, ...state }, "", url);
    return url;
  }

  function rewriteNtFragmentLinks(scope = document) {
    scope.querySelectorAll?.('a[href*="cards/nt.html"], a[href^="nt.html"]')
      .forEach(link => {
        const rawHref = link.getAttribute("href");
        if (!rawHref) return;

        try {
          const fragmentUrl = new URL(rawHref, window.location.href);
          const detail = {};

          ["book", "chapter", "view", "section"].forEach(key => {
            const value = fragmentUrl.searchParams.get(key);
            if (value) detail[key] = value;
          });

          link.href = buildAppRoute("nt", detail).href;
          link.dataset.hgAppRoute = "nt";
        } catch (error) {
          console.warn("[ROUTER] Could not rewrite NT link", { rawHref, error });
        }
      });
  }

  function syncObservedCard() {
    const cardName = getSelectedCard();
    if (!cardName) return;

    rewriteNtFragmentLinks(getLoadedCardHost() || document);

    if (suppressNextObservedRoute) {
      suppressNextObservedRoute = false;
      lastObservedCard = cardName;
      return;
    }

    const urlCard = new URLSearchParams(window.location.search).get("card");
    if (urlCard === cardName) {
      lastObservedCard = cardName;
      return;
    }

    // A newly selected card is a navigation action. Remove stale details
    // belonging to the previous card and make the address bar shareable.
    writeRoute(cardName);
    lastObservedCard = cardName;
  }

  function observeCardHost() {
    const host = getLoadedCardHost();
    if (!host || host === observedHost) return;

    routeObserver?.disconnect();
    observedHost = host;
    routeObserver = new MutationObserver(syncObservedCard);
    routeObserver.observe(host, {
      childList: true,
      subtree: true
    });

    rewriteNtFragmentLinks(host);
  }

  function restoreRouteFromLocation() {
    const params = new URLSearchParams(window.location.search);
    const cardName = params.get("card");
    if (!cardName || typeof window.loadCard !== "function") return;

    if (cardName === "articles") {
      const file = params.get("file");
      if (file) window.pendingArticleFile = file;
    }

    suppressNextObservedRoute = true;
    lastObservedCard = cardName;
    window.loadCard(cardName);
  }

  function bindRouteClicks() {
    document.addEventListener("click", event => {
      const link = event.target.closest?.('a[data-hg-app-route="nt"]');
      if (!link || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;

      event.preventDefault();
      window.history.pushState({}, "", url);
      restoreRouteFromLocation();
    });
  }

  function initShareRouting() {
    observeCardHost();
    bindRouteClicks();

    window.addEventListener("popstate", restoreRouteFromLocation);

    // Some startup markup is assembled after this module evaluates.
    const bootObserver = new MutationObserver(() => {
      observeCardHost();
      rewriteNtFragmentLinks(document);
    });

    bootObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.setTimeout(() => bootObserver.disconnect(), 15000);
  }

  window.hgBuildRoute = buildAppRoute;
  window.hgSetRoute = writeRoute;
  window.hgRestoreRoute = restoreRouteFromLocation;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShareRouting, { once: true });
  } else {
    initShareRouting();
  }
})();