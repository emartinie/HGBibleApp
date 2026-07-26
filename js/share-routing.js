// Canonical URL routing and sharing for the HG Bible App.
// Release 1.1: framework-free, backward-compatible, and adapter-based.

(function () {
  "use strict";

  const ROUTE_PARAMS = new Set([
    "week",
    "book",
    "chapter",
    "view",
    "section",
    "ref",
    "from",
    "file",
    "id",
    "date",
    "model",
    "event"
  ]);

  const adapters = new Map();
  let routeHandler = null;
  let started = false;
  let handlingRoute = false;

  function hasValue(value) {
    return value !== null && value !== undefined && value !== "";
  }

  function getCurrentRoute(source = window.location.href) {
    const url = source instanceof URL ? source : new URL(source, window.location.href);
    const route = {
      card: url.searchParams.get("card") || "mainstage"
    };

    ROUTE_PARAMS.forEach(key => {
      const value = url.searchParams.get(key);
      if (value !== null && value !== "") route[key] = value;
    });

    return route;
  }

  function getRouteState(route = getCurrentRoute()) {
    const state = { ...route };
    delete state.card;
    return state;
  }

  function clearRouteParams(url) {
    ROUTE_PARAMS.forEach(key => url.searchParams.delete(key));
  }

  function buildRoute(cardOrRoute, state = {}) {
    const requested = typeof cardOrRoute === "object" && cardOrRoute !== null
      ? cardOrRoute
      : { card: cardOrRoute, ...state };
    const url = new URL(window.location.href);
    const card = requested.card || "mainstage";

    clearRouteParams(url);
    url.searchParams.set("card", card);

    Object.entries(requested).forEach(([key, value]) => {
      if (key === "card" || !ROUTE_PARAMS.has(key) || !hasValue(value)) return;
      url.searchParams.set(key, String(value));
    });

    url.hash = "";
    return url;
  }

  function sameLocation(left, right) {
    return (
      left.pathname === right.pathname &&
      left.search === right.search &&
      left.hash === right.hash
    );
  }

  function announceRoute(route, source) {
    window.dispatchEvent(new CustomEvent("hg:routechange", {
      detail: { route, source }
    }));
  }

  function writeRoute(cardOrRoute, state = {}, options = {}) {
    const route = typeof cardOrRoute === "object" && cardOrRoute !== null
      ? cardOrRoute
      : { card: cardOrRoute, ...state };
    const url = buildRoute(route);
    const current = new URL(window.location.href);

    if (!sameLocation(current, url)) {
      const method = options.replace ? "replaceState" : "pushState";
      window.history[method]({ hgRoute: route }, "", url);
    }

    if (options.announce !== false) {
      announceRoute(getCurrentRoute(url), options.source || "write");
    }

    return url;
  }

  function setCardState(card, patch = {}, options = {}) {
    const current = getCurrentRoute();
    const base = current.card === card ? getRouteState(current) : {};
    const next = { ...base, ...patch };

    Object.keys(next).forEach(key => {
      if (!hasValue(next[key])) delete next[key];
    });

    return writeRoute({ card, ...next }, {}, {
      replace: options.replace === true,
      announce: options.announce !== false,
      source: options.source || "card-state"
    });
  }

  function registerCard(card, adapter = {}) {
    if (!card || typeof adapter !== "object") return function () {};
    adapters.set(card, adapter);

    return function unregisterCard() {
      if (adapters.get(card) === adapter) adapters.delete(card);
    };
  }

  async function restoreCard(card, root = document, route = getCurrentRoute()) {
    const adapter = adapters.get(card);
    if (!adapter || typeof adapter.restore !== "function") return;
    await adapter.restore(route, root);
  }

  function getCanonicalRoute() {
    const route = getCurrentRoute();
    const adapter = adapters.get(route.card);

    if (!adapter || typeof adapter.getState !== "function") return route;

    try {
      return {
        card: route.card,
        ...getRouteState(route),
        ...(adapter.getState() || {})
      };
    } catch (error) {
      console.warn("[ROUTER] Could not read card state", { card: route.card, error });
      return route;
    }
  }

  async function applyCurrentRoute(source = "restore") {
    if (handlingRoute) return;
    const route = getCurrentRoute();
    handlingRoute = true;

    try {
      announceRoute(route, source);
      if (typeof routeHandler === "function") {
        await routeHandler(route, { source });
      } else if (typeof window.loadCard === "function") {
        await window.loadCard(route.card, { fromRoute: true });
      }
    } finally {
      handlingRoute = false;
    }
  }

  function navigate(card, state = {}, options = {}) {
    writeRoute({ card, ...state }, {}, {
      replace: options.replace === true,
      announce: false
    });

    if (options.restore === false) {
      announceRoute(getCurrentRoute(), options.source || "navigate");
      return Promise.resolve();
    }

    return applyCurrentRoute(options.source || "navigate");
  }

  function translateLegacyCardUrl(rawHref) {
    try {
      const url = new URL(rawHref, window.location.href);
      const match = url.pathname.match(/\/cards\/([^/]+)\.html$/i);
      if (!match) return null;

      const card = match[1];
      const state = {};
      ROUTE_PARAMS.forEach(key => {
        const value = url.searchParams.get(key);
        if (value !== null && value !== "") state[key] = value;
      });

      return buildRoute(card, state);
    } catch {
      return null;
    }
  }

  function bindRouteLinks() {
    document.addEventListener("click", event => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || rawHref.startsWith("javascript:")) return;

      const legacy = translateLegacyCardUrl(rawHref);
      const resolved = legacy || new URL(rawHref, window.location.href);
      const current = new URL(window.location.href);
      const isAppRoute =
        resolved.origin === current.origin &&
        resolved.pathname === current.pathname &&
        resolved.searchParams.has("card");

      if (!isAppRoute) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      const route = getCurrentRoute(resolved);
      navigate(route.card, getRouteState(route), { source: "link" });
    }, true);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }

  function showShareToast(message) {
    let toast = document.getElementById("hgShareToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hgShareToast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.style.cssText = [
        "position:fixed",
        "left:50%",
        "bottom:max(20px, env(safe-area-inset-bottom))",
        "transform:translate(-50%, 12px)",
        "z-index:10050",
        "padding:10px 14px",
        "border:1px solid rgba(120,216,232,.4)",
        "border-radius:999px",
        "background:rgba(7,16,25,.96)",
        "color:#e7eef7",
        "box-shadow:0 12px 35px rgba(0,0,0,.35)",
        "font:600 14px/1.2 system-ui,sans-serif",
        "opacity:0",
        "transition:opacity .18s ease, transform .18s ease",
        "pointer-events:none"
      ].join(";");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0)";
    window.clearTimeout(showShareToast.timer);
    showShareToast.timer = window.setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, 12px)";
    }, 1800);
  }

  function isMobileShareEnvironment() {
    return (
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    );
  }

  async function shareCurrentRoute() {
    const canonical = getCanonicalRoute();
    const url = writeRoute(canonical, {}, {
      replace: true,
      announce: false
    }).href;
    const title = document.title || "HG Bible App";

    if (isMobileShareEnvironment() && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await copyText(url);
      showShareToast("Link copied");
    } catch (error) {
      console.error("[SHARE] Could not copy URL", error);
      showShareToast("Could not copy link");
    }
  }

  function mountShareButton() {
    if (document.getElementById("hgShareRouteBtn")) return;

    const controls = document.querySelector(".card-control-bar");
    if (!controls) return;

    const button = document.createElement("button");
    button.id = "hgShareRouteBtn";
    button.type = "button";
    button.className = "ui-btn utility-btn";
    button.title = "Share this location";
    button.setAttribute("aria-label", "Share this location");
    button.textContent = "⇪";
    button.addEventListener("click", shareCurrentRoute);
    controls.appendChild(button);
  }

  function mountMobileUtilityMenu() {
    if (document.getElementById("hgMobileUtilityWrap")) return;

    const controls = document.querySelector(".card-control-bar");
    if (!controls) return;

    if (!document.getElementById("hgMobileUtilityStyles")) {
      const style = document.createElement("style");
      style.id = "hgMobileUtilityStyles";
      style.textContent = `
        #reloadCardBtn,
        #aboutHomeGroupsBtn,
        #hgShareRouteBtn {
          display: none !important;
        }

        #hgMobileUtilityWrap {
          display: inline-flex;
          position: relative;
          flex: 0 0 auto;
        }

        #hgMobileUtilityBtn {
          width: 36px;
          min-width: 36px;
          height: 36px;
          min-height: 36px;
          padding: 0;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 1.05rem;
          letter-spacing: .06em;
        }

        #hgMobileUtilityMenu {
          position: fixed;
          top: 0;
          right: 8px;
          z-index: 2147483000;
          width: max-content;
          min-width: 132px;
          padding: 6px;
          border: 1px solid rgba(148, 163, 184, .28);
          border-radius: 12px;
          background: #071019;
          box-shadow: 0 18px 48px rgba(0, 0, 0, .72);
        }

        #hgMobileUtilityMenu[hidden] {
          display: none !important;
        }

        #hgMobileUtilityMenu button {
          display: block;
          width: 100%;
          padding: 9px 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #e7eef7;
          font: 600 .86rem/1.2 system-ui, sans-serif;
          text-align: left;
          white-space: nowrap;
        }

        #hgMobileUtilityMenu button:hover,
        #hgMobileUtilityMenu button:focus-visible {
          background: rgba(120, 216, 232, .14);
          outline: none;
        }

      `;
      document.head.appendChild(style);
    }

    const wrap = document.createElement("div");
    wrap.id = "hgMobileUtilityWrap";

    const trigger = document.createElement("button");
    trigger.id = "hgMobileUtilityBtn";
    trigger.type = "button";
    trigger.className = "ui-btn utility-btn";
    trigger.textContent = "•••";
    trigger.title = "More actions";
    trigger.setAttribute("aria-label", "More actions");
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.id = "hgMobileUtilityMenu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    const actions = [
      {
        label: "↻ Reload",
        run: () => document.getElementById("reloadCardBtn")?.click()
      },
      {
        label: "⇪ Share",
        run: shareCurrentRoute
      },
      {
        label: "ⓘ About",
        run: () => document.getElementById("aboutHomeGroupsBtn")?.click()
      }
    ];

    function closeMenu() {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }

    actions.forEach(action => {
      const item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "menuitem");
      item.textContent = action.label;
      item.addEventListener("click", () => {
        closeMenu();
        action.run();
      });
      menu.appendChild(item);
    });

    trigger.addEventListener("click", event => {
      event.stopPropagation();
      const opening = menu.hidden;

      if (opening) {
        const rect = trigger.getBoundingClientRect();
        menu.style.top = Math.round(rect.bottom + 8) + "px";
        menu.style.right = Math.max(8, Math.round(window.innerWidth - rect.right)) + "px";
      }

      menu.hidden = !opening;
      trigger.setAttribute("aria-expanded", String(opening));
    });

    menu.addEventListener("click", event => event.stopPropagation());
    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });

    wrap.appendChild(trigger);
    controls.appendChild(wrap);
    document.body.appendChild(menu);
  }

  function start(handler) {
    if (typeof handler === "function") routeHandler = handler;
    if (started) return;
    started = true;

    bindRouteLinks();
    window.addEventListener("popstate", () => applyCurrentRoute("popstate"));
    mountShareButton();
    mountMobileUtilityMenu();

    if (!document.getElementById("hgShareRouteBtn") || !document.getElementById("hgMobileUtilityWrap")) {
      const observer = new MutationObserver(() => {
        mountShareButton();
        mountMobileUtilityMenu();
        if (document.getElementById("hgShareRouteBtn") && document.getElementById("hgMobileUtilityWrap")) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      window.setTimeout(() => observer.disconnect(), 15000);
    }
  }

  window.HGRoute = Object.freeze({
    start,
    read: getCurrentRoute,
    getCurrentRoute: getCanonicalRoute,
    getState: getRouteState,
    build: buildRoute,
    write: writeRoute,
    navigate,
    setCardState,
    registerCard,
    restoreCard,
    restore: applyCurrentRoute,
    share: shareCurrentRoute
  });

  // Compatibility with the first share-routing recovery.
  window.hgBuildRoute = buildRoute;
  window.hgSetRoute = writeRoute;
  window.hgRestoreRoute = applyCurrentRoute;
})();
