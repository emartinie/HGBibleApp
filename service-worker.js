// HG Bible App service worker — conservative Phase 1 shell caching.
const CACHE_VERSION = "hg-bible-shell-v2";
const APP_SHELL_URL = new URL("./index.html", self.registration.scope).href;
const OFFLINE_URL = new URL("./offline.html", self.registration.scope).href;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./images/HGHouses.png",
  "./images/hg-app-icon-192.png",
  "./images/hg-app-icon-512.png",
  "./images/apple-touch-icon.png",
  "./images/hg-app-icon.svg",
  "./css/fullscreen.css",
  "./js/share-routing.js",
  "./js/mainstage.js",
  "./js/app.js",
  "./js/about.js",
  "./js/fullscreen.js",
  "./js/orbitFloatingPlayer.js",
  "./js/bullseyeMedia.js",
  "./js/topNav.js",
  "./js/pwa.js"
].map(path => new URL(path, self.registration.scope).href);

const SHELL_ASSET_SET = new Set(SHELL_ASSETS);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);

    // Cache independently so one optional asset cannot prevent installation.
    await Promise.allSettled(
      SHELL_ASSETS.map(async url => {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(url, response);
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith("hg-bible-shell-") && key !== CACHE_VERSION)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put(APP_SHELL_URL, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE_VERSION);
        return (await cache.match(APP_SHELL_URL)) ||
          (await cache.match(OFFLINE_URL)) ||
          Response.error();
      }
    })());
    return;
  }

  const canonicalUrl = new URL(url.pathname, self.location.origin).href;
  if (!SHELL_ASSET_SET.has(canonicalUrl)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(canonicalUrl);

    const refresh = fetch(request).then(async response => {
      if (response.ok) await cache.put(canonicalUrl, response.clone());
      return response;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(refresh);
      return cached;
    }

    return (await refresh) || Response.error();
  })());
});
