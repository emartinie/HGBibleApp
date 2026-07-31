(function () {
  "use strict";

  let root = null;
  let staticReport = null;
  let liveReport = null;
  let longTaskObserver = null;
  const observed = { longTasks: [], errors: [], rejections: [] };
  const sessionStart = performance.timeOrigin || Date.now();
  let navigationCount = 0;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const bytes = value => {
    if (!Number.isFinite(value)) return "Unavailable";
    const units = ["B", "KB", "MB", "GB"];
    let amount = value;
    let unit = 0;
    while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1; }
    return `${amount.toFixed(unit ? 1 : 0)} ${units[unit]} (${value.toLocaleString()} bytes)`;
  };
  const table = (headers, rows) => `
    <div class="ph-table-wrap"><table class="ph-table"><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const section = (title, content, open = false) => `<details${open ? " open" : ""}><summary>${escapeHtml(title)}</summary><div class="ph-body">${content}</div></details>`;
  const unavailable = reason => `<span class="ph-empty">Unavailable — ${escapeHtml(reason)}</span>`;

  async function measureCaches() {
    if (!("caches" in window)) return { supported: false, reason: "Cache Storage API is not exposed." };
    const names = await caches.keys();
    const cachesReport = [];
    const seen = new Map();
    let knownBytes = 0;
    for (const name of names) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      let cacheBytes = 0;
      let measurable = 0;
      for (const request of requests) {
        const response = await cache.match(request);
        let size = Number(response?.headers.get("content-length"));
        if (!Number.isFinite(size) || size <= 0) {
          try { size = (await response.clone().blob()).size; } catch { size = null; }
        }
        if (Number.isFinite(size)) { cacheBytes += size; knownBytes += size; measurable += 1; }
        const canonical = new URL(request.url).pathname;
        seen.set(canonical, [...(seen.get(canonical) || []), name]);
      }
      cachesReport.push({ name, entries: requests.length, knownBytes: cacheBytes, measurable });
    }
    return {
      supported: true,
      names: cachesReport,
      knownBytes,
      duplicateResources: [...seen].filter(([, cacheNames]) => new Set(cacheNames).size > 1)
        .map(([path, cacheNames]) => ({ path, caches: [...new Set(cacheNames)] }))
    };
  }

  function measureLocalStorage() {
    try {
      let characters = 0;
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key) || "";
        characters += key.length + value.length;
        keys.push({ key, approximateBytes: (key.length + value.length) * 2 });
      }
      return { supported: true, entries: localStorage.length, approximateBytes: characters * 2, keys };
    } catch (error) {
      return { supported: false, reason: error.message };
    }
  }

  async function measureIndexedDb() {
    if (!window.indexedDB) return { supported: false, reason: "IndexedDB is not exposed." };
    if (typeof indexedDB.databases !== "function") {
      return { supported: true, databaseNames: null, reason: "Browser does not support indexedDB.databases()." };
    }
    try {
      const databases = await indexedDB.databases();
      return { supported: true, databaseNames: databases.map(db => ({ name: db.name || "(unnamed)", version: db.version })) };
    } catch (error) {
      return { supported: true, databaseNames: null, reason: error.message };
    }
  }

  async function measureServiceWorker() {
    if (!("serviceWorker" in navigator)) return { supported: false, reason: "Service workers are not supported." };
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      supported: true,
      controlled: Boolean(navigator.serviceWorker.controller),
      scope: registration?.scope || null,
      active: registration?.active?.state || null,
      waiting: registration?.waiting?.state || null,
      installing: registration?.installing?.state || null
    };
  }

  function measurePerformance() {
    const resources = performance.getEntriesByType("resource");
    const navigation = performance.getEntriesByType("navigation")[0];
    const startup = resources.filter(entry => entry.startTime <= (navigation?.domInteractive || Infinity));
    const sum = (entries, key) => entries.reduce((total, entry) => total + (entry[key] || 0), 0);
    return {
      navigation: navigation ? {
        domContentLoadedMs: navigation.domContentLoadedEventEnd,
        domInteractiveMs: navigation.domInteractive,
        loadEventMs: navigation.loadEventEnd,
        transferBytes: navigation.transferSize,
        decodedBytes: navigation.decodedBodySize
      } : null,
      resourceCount: resources.length,
      startupRequestCount: startup.length,
      startupTransferBytes: sum(startup, "transferSize"),
      startupDecodedBytes: sum(startup, "decodedBodySize"),
      loadedScripts: [...document.scripts].map(script => script.src || "(inline)"),
      loadedStylesheets: [...document.styleSheets].map(sheet => {
        try { return sheet.href || "(inline)"; } catch { return "(restricted stylesheet)"; }
      }),
      failedResourceTiming: resources.filter(entry => entry.transferSize === 0 && entry.decodedBodySize === 0).map(entry => entry.name)
    };
  }

  async function collectLive() {
    const [cache, indexedDb, serviceWorker, storage] = await Promise.all([
      measureCaches().catch(error => ({ supported: false, reason: error.message })),
      measureIndexedDb(),
      measureServiceWorker().catch(error => ({ supported: false, reason: error.message })),
      navigator.storage?.estimate
        ? navigator.storage.estimate().catch(error => ({ error: error.message }))
        : Promise.resolve({ error: "StorageManager estimate() is unavailable." })
    ]);
    const heap = performance.memory ? {
      usedBytes: performance.memory.usedJSHeapSize,
      totalBytes: performance.memory.totalJSHeapSize,
      limitBytes: performance.memory.jsHeapSizeLimit
    } : null;
    return {
      measuredAt: new Date().toISOString(),
      sessionAgeMs: Date.now() - sessionStart,
      currentCard: new URLSearchParams(location.search).get("card") || "mainstage",
      navigationCount,
      domNodes: document.getElementsByTagName("*").length,
      heap,
      performance: measurePerformance(),
      localStorage: measureLocalStorage(),
      indexedDb,
      cache,
      storage: {
        usageBytes: storage.usage ?? null,
        quotaBytes: storage.quota ?? null,
        usagePercent: storage.usage && storage.quota ? storage.usage / storage.quota * 100 : null,
        error: storage.error || null
      },
      serviceWorker,
      observations: {
        longTasks: observed.longTasks,
        uncaughtErrors: observed.errors,
        unhandledRejections: observed.rejections
      },
      limitations: [
        "Event-listener and timer totals are unavailable without invasive instrumentation.",
        "Heap values are Chromium-specific and may be unavailable or rounded.",
        "Resource Timing transfer sizes may be zero for cache hits or cross-origin resources.",
        "Cache entry byte totals use Content-Length or local Blob size and may differ from disk allocation.",
        "IndexedDB database sizes are included only in the browser-wide storage estimate; per-database sizes are unavailable.",
        "Observations begin when this on-demand dashboard script loads, not at initial app startup."
      ]
    };
  }

  function assess(report, live) {
    const warnings = [];
    const startupData = report.startup.staticLocalResources.filter(file => file.type === "data");
    if (startupData.length) warnings.push({ level: "watch", reason: `${startupData.length} content dataset(s) are statically referenced at startup.`, evidence: startupData.map(file => file.path).join(", ") });
    const noCleanup = report.cards.inventory.filter(card => card.scripts.length && card.cleanup === "no explicit cleanup registered");
    if (noCleanup.length) warnings.push({
      level: "watch",
      reason: `${noCleanup.length} scripted cards have no explicit lifecycle cleanup registration.`,
      evidence: "This is a review signal, not proof of a leak: " + noCleanup.map(card => card.name).join(", ")
    });
    const failedJson = report.datasets.inventory.filter(dataset => dataset.parseStatus !== "valid");
    if (failedJson.length) warnings.push({ level: "attention", reason: `${failedJson.length} JSON dataset(s) did not parse.`, evidence: failedJson.map(item => item.path).join(", ") });
    if (live.storage.usagePercent != null && live.storage.usagePercent >= 80) warnings.push({ level: "attention", reason: "Browser storage usage exceeds 80% of the browser-reported quota.", evidence: `${live.storage.usagePercent.toFixed(1)}%` });
    else if (live.storage.usagePercent != null && live.storage.usagePercent >= 60) warnings.push({ level: "watch", reason: "Browser storage usage exceeds 60% of the browser-reported quota.", evidence: `${live.storage.usagePercent.toFixed(1)}%` });
    if (live.cache.duplicateResources?.length) warnings.push({ level: "watch", reason: `${live.cache.duplicateResources.length} resource(s) occur in more than one cache.`, evidence: live.cache.duplicateResources.slice(0, 5).map(item => item.path).join(", ") });
    if (live.observations.uncaughtErrors.length || live.observations.unhandledRejections.length) warnings.push({ level: "attention", reason: "Runtime errors were observed while the dashboard was active.", evidence: `${live.observations.uncaughtErrors.length} errors, ${live.observations.unhandledRejections.length} rejections` });
    const level = warnings.some(item => item.level === "attention") ? "Needs Attention" : warnings.length ? "Watch" : "Healthy";
    return { level, warnings };
  }

  function render() {
    if (!root || !staticReport || !liveReport) return;
    const health = assess(staticReport, liveReport);
    const largest = staticReport.assets.largest[0];
    const activeEngines = liveReport.performance.loadedScripts.length;
    const growth = staticReport.startup.staticLocalBytes < 5 * 1024 * 1024 && (!liveReport.storage.usagePercent || liveReport.storage.usagePercent < 60)
      ? "Substantial capacity remaining" : "Moderate capacity remaining";
    root.querySelector("[data-ph-summary]").innerHTML = [
      ["Overall Health", health.level, `ph-${health.level === "Healthy" ? "good" : health.level === "Watch" ? "watch" : "bad"}`],
      ["App Footprint", bytes(staticReport.assets.totalBytes)],
      ["Startup Load", bytes(staticReport.startup.staticLocalBytes)],
      ["Cache Usage", liveReport.cache.supported ? bytes(liveReport.cache.knownBytes) : "Unavailable"],
      ["Dataset Records", staticReport.datasets.totalRecords.toLocaleString()],
      ["Loaded Scripts", activeEngines.toLocaleString()],
      ["Largest Resource", largest ? `${largest.path} · ${bytes(largest.bytes)}` : "None"],
      ["Growth Capacity", growth]
    ].map(([label, value, cls = ""]) => `<div class="ph-stat"><span>${escapeHtml(label)}</span><strong class="${cls}">${escapeHtml(value)}</strong></div>`).join("");

    const warningHtml = health.warnings.length
      ? health.warnings.map(item => `<div class="ph-card ph-warning"><h4 class="ph-${item.level === "attention" ? "bad" : "watch"}">${escapeHtml(item.reason)}</h4><div class="ph-meta">${escapeHtml(item.evidence)}</div></div>`).join("")
      : `<div class="ph-card"><strong class="ph-good">No demonstrated warnings in the current measurements.</strong></div>`;
    const types = Object.entries(staticReport.assets.byType).sort((a, b) => b[1].bytes - a[1].bytes);
    const typeRows = types.map(([name, value]) => [escapeHtml(name), value.files.toLocaleString(), escapeHtml(bytes(value.bytes))]);
    const largestRows = staticReport.assets.largest.slice(0, 15).map(file => [escapeHtml(file.path), escapeHtml(file.type), escapeHtml(file.allocation), escapeHtml(bytes(file.bytes))]);
    const startupRows = staticReport.startup.staticLocalResources.map(file => [escapeHtml(file.path), escapeHtml(file.type), escapeHtml(bytes(file.bytes))]);
    const cardRows = staticReport.cards.inventory.map(card => [
      escapeHtml(card.name), escapeHtml(bytes(card.knownBytes)), escapeHtml(card.loading),
      escapeHtml(card.initialization), escapeHtml(card.cleanup),
      escapeHtml([...card.datasets, ...card.media].slice(0, 4).join(", ") || "None statically detected")
    ]);
    const datasetRows = staticReport.datasets.inventory.slice(0, 80).map(dataset => [
      escapeHtml(dataset.path), dataset.recordCount == null ? "Unavailable" : dataset.recordCount.toLocaleString(),
      escapeHtml(bytes(dataset.bytes)), escapeHtml(dataset.loading), escapeHtml(dataset.status),
      escapeHtml(dataset.consumers.join(", ") || "Not statically detected")
    ]);
    const cacheRows = liveReport.cache.supported ? liveReport.cache.names.map(cache => [
      escapeHtml(cache.name), cache.entries.toLocaleString(), escapeHtml(bytes(cache.knownBytes)), `${cache.measurable}/${cache.entries}`
    ]) : [];
    const nav = liveReport.performance.navigation;
    const runtimeCards = [
      ["Current card", liveReport.currentCard], ["DOM nodes", liveReport.domNodes.toLocaleString()],
      ["Session navigation events", liveReport.navigationCount.toLocaleString()],
      ["JS heap", liveReport.heap ? `${bytes(liveReport.heap.usedBytes)} used / ${bytes(liveReport.heap.limitBytes)} limit` : "Unavailable in this browser"],
      ["Long tasks observed", liveReport.observations.longTasks.length.toLocaleString()],
      ["Uncaught errors", liveReport.observations.uncaughtErrors.length.toLocaleString()],
      ["Unhandled rejections", liveReport.observations.unhandledRejections.length.toLocaleString()]
    ].map(([title, value]) => `<div class="ph-card"><h4>${escapeHtml(title)}</h4>${escapeHtml(value)}</div>`).join("");
    const storagePercent = liveReport.storage.usagePercent;
    const sections = [
      section("1. Overall Health", `<div class="ph-grid">${warningHtml}</div><p class="ph-note">Status is evidence-based. Size alone is not treated as a defect.</p>`, true),
      section("2. Application Footprint", `${table(["Type", "Files", "Raw / readable size"], typeRows)}<h3>Largest files</h3>${table(["Path", "Type", "Allocation", "Size"], largestRows)}<p class="ph-note">Total: ${bytes(staticReport.assets.totalBytes)} across ${staticReport.assets.fileCount.toLocaleString()} files. Repository bytes are distinct from browser storage.</p>`),
      section("3. Startup Utilization", `${table(["Static local resource", "Type", "Size"], startupRows)}
        <div class="ph-grid"><div class="ph-card"><h4>Runtime requests before interactive</h4>${liveReport.performance.startupRequestCount.toLocaleString()}</div>
        <div class="ph-card"><h4>Transferred / decoded</h4>${bytes(liveReport.performance.startupTransferBytes)} / ${bytes(liveReport.performance.startupDecodedBytes)}</div>
        <div class="ph-card"><h4>DOM interactive</h4>${nav ? `${nav.domInteractiveMs.toFixed(1)} ms` : "Unavailable"}</div>
        <div class="ph-card"><h4>Load event</h4>${nav ? `${nav.loadEventMs.toFixed(1)} ms` : "Unavailable"}</div></div>
        <p class="ph-note">Static startup size is source-derived; browser timings are live and may reflect service-worker or HTTP cache effects. Time-to-app-shell and time-to-interactive are approximated by navigation timing because no dedicated production marks exist.</p>`),
      section(`4. Card & Engine Utilization (${staticReport.cards.count})`, table(["Card", "Known size", "Load", "Initialization", "Cleanup", "Associated data/media"], cardRows)),
      section(`5. Data Inventory (${staticReport.datasets.count})`, `${table(["Dataset", "Structural records", "Size", "Loading", "Authority", "Consumers"], datasetRows)}<p class="ph-note">Record counts are structural and may not equal domain records for nested objects. The source scanner does not duplicate data.</p>`),
      section("6. Storage & Cache Health", `<div class="ph-grid">
        <div class="ph-card"><h4>Browser storage</h4>${liveReport.storage.usageBytes == null ? unavailable(liveReport.storage.error || "estimate unavailable") : `${bytes(liveReport.storage.usageBytes)} / ${bytes(liveReport.storage.quotaBytes)}${storagePercent == null ? "" : ` (${storagePercent.toFixed(2)}%)`}<div class="ph-bar"><i style="width:${Math.min(100, storagePercent || 0)}%"></i></div>`}</div>
        <div class="ph-card"><h4>localStorage</h4>${liveReport.localStorage.supported ? `${liveReport.localStorage.entries} keys · ${bytes(liveReport.localStorage.approximateBytes)} estimated UTF-16` : unavailable(liveReport.localStorage.reason)}</div>
        <div class="ph-card"><h4>IndexedDB</h4>${liveReport.indexedDb.databaseNames ? `${liveReport.indexedDb.databaseNames.length} databases visible` : unavailable(liveReport.indexedDb.reason || "database listing unavailable")}</div>
        <div class="ph-card"><h4>Duplicate cache entries</h4>${liveReport.cache.duplicateResources?.length ?? "Unavailable"}</div></div>
        ${cacheRows.length ? table(["Cache", "Entries", "Known response bytes", "Measurable"], cacheRows) : `<p>${unavailable(liveReport.cache.reason || "No caches found")}</p>`}`),
      section("7. Runtime Health", `<div class="ph-grid">${runtimeCards}</div><h3>Loaded resources</h3><p class="ph-meta">${liveReport.performance.loadedScripts.map(escapeHtml).join("<br>")}</p><p class="ph-note">${liveReport.limitations.map(escapeHtml).join(" ")}</p>`),
      section("8. Service Worker Health", `<div class="ph-grid">
        <div class="ph-card"><h4>Registration</h4>${liveReport.serviceWorker.supported ? `Controlled: ${liveReport.serviceWorker.controlled}<br>Active: ${escapeHtml(liveReport.serviceWorker.active || "none")}<br>Waiting: ${escapeHtml(liveReport.serviceWorker.waiting || "none")}<br>Installing: ${escapeHtml(liveReport.serviceWorker.installing || "none")}` : unavailable(liveReport.serviceWorker.reason)}</div>
        <div class="ph-card"><h4>Source strategy</h4>Cache: ${escapeHtml(staticReport.serviceWorker.cacheVersion || "not detected")}<br>${escapeHtml(staticReport.serviceWorker.strategy)}<br>Offline fallback: ${staticReport.serviceWorker.hasOfflineFallback ? "yes" : "no"}<br>Old shell cleanup: ${staticReport.serviceWorker.deletesOldShellCaches ? "yes" : "not detected"}</div></div>
        <p class="ph-note">The dashboard does not alter or refresh service-worker caches.</p>`),
      section("9. Dependency & Coupling Review", `<div class="ph-grid"><div class="ph-card"><h4>Shared infrastructure</h4>${staticReport.architecture.sharedInfrastructure.map(escapeHtml).join("<br>")}</div><div class="ph-card"><h4>Lifecycle coverage</h4>${staticReport.architecture.lifecycleRegistered} explicit init registrations<br>${staticReport.architecture.cleanupRegistered} explicit cleanup registrations</div></div><p>${staticReport.architecture.observations.map(escapeHtml).join(" ")}</p><p class="ph-note">Global-object use and direct dependencies are inventoried in the exported JSON. Relationships are not classified as harmful without demonstrated behavior.</p>`),
      section("10. Growth Capacity", `<div class="ph-card"><h4 class="ph-good">${escapeHtml(growth)}</h4><p>Most card resources and content datasets remain on-demand, and browser quota usage is ${storagePercent == null ? "unavailable" : `${storagePercent.toFixed(2)}%`}. Additional structured records and cards can be added without changing the shell architecture. Review startup cost before adding new global scripts, and review offline policy before adding large media or datasets to the shell cache.</p><p class="ph-note">No unsupported numerical growth prediction is made.</p></div>`),
      section("Methodology, Privacy & Limitations", `<p>${staticReport.methodology.assetBytes} ${staticReport.methodology.startup} ${staticReport.methodology.cards} ${staticReport.methodology.records}</p><p>All analysis runs locally. No analytics, identifying data, Firestore document reads, tracking, uploads, or remote telemetry are performed.</p><p class="ph-meta">Source fingerprint: ${escapeHtml(staticReport.source.fingerprint)}<br>Generated: ${escapeHtml(staticReport.generatedAt)}<br>Commit: ${escapeHtml(staticReport.source.commit)}</p>`)
    ];
    root.querySelector("[data-ph-sections]").innerHTML = sections.join("");
    liveReport.health = health;
    liveReport.growthCapacity = growth;
  }

  async function refresh() {
    if (!root) return;
    root.querySelector("[data-ph-summary]").innerHTML = `<div class="ph-stat"><span>Status</span><strong>Measuring…</strong></div>`;
    try {
      staticReport ||= await fetch("data/pwa-health-report.json", { cache: "no-cache" }).then(response => {
        if (!response.ok) throw new Error(`Static health report returned ${response.status}`);
        return response.json();
      });
      liveReport = await collectLive();
      render();
    } catch (error) {
      root.querySelector("[data-ph-summary]").innerHTML = `<div class="ph-stat"><span>Dashboard error</span><strong class="ph-bad">${escapeHtml(error.message)}</strong></div>`;
    }
  }

  function exportReport() {
    if (!staticReport || !liveReport) return;
    const payload = {
      schemaVersion: 1,
      timestamp: new Date().toISOString(),
      application: staticReport.source,
      assetTotals: { totalBytes: staticReport.assets.totalBytes, byType: staticReport.assets.byType, fileCount: staticReport.assets.fileCount },
      datasetTotals: { count: staticReport.datasets.count, structuralRecords: staticReport.datasets.totalRecords },
      cacheTotals: liveReport.cache,
      startupMeasurements: { static: staticReport.startup, live: liveReport.performance },
      warningCount: liveReport.health?.warnings.length || 0,
      architecturalHealth: { status: liveReport.health?.level, growthCapacity: liveReport.growthCapacity, observations: staticReport.architecture.observations },
      runtime: liveReport,
      fullSourceInventory: staticReport
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `homegroups-pwa-health-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function observe() {
    window.addEventListener("popstate", () => { navigationCount += 1; }, { signal: window.__pwaHealthAbort.signal });
    window.addEventListener("error", event => {
      observed.errors.push({ at: new Date().toISOString(), message: event.message, source: event.filename || null });
    }, { signal: window.__pwaHealthAbort.signal });
    window.addEventListener("unhandledrejection", event => {
      observed.rejections.push({ at: new Date().toISOString(), reason: String(event.reason) });
    }, { signal: window.__pwaHealthAbort.signal });
    if ("PerformanceObserver" in window) {
      try {
        longTaskObserver = new PerformanceObserver(list => {
          observed.longTasks.push(...list.getEntries().map(entry => ({ startMs: entry.startTime, durationMs: entry.duration })));
        });
        longTaskObserver.observe({ type: "longtask", buffered: true });
      } catch { /* unsupported entry type */ }
    }
  }

  window.initPwaHealthCard = async function initPwaHealthCard(host) {
    window.destroyPwaHealthCard();
    window.__pwaHealthAbort = new AbortController();
    root = host?.querySelector("#pwaHealth") || document.querySelector("#pwaHealth");
    if (!root) return;
    root.querySelector("[data-ph-refresh]").addEventListener("click", refresh, { signal: window.__pwaHealthAbort.signal });
    root.querySelector("[data-ph-export]").addEventListener("click", exportReport, { signal: window.__pwaHealthAbort.signal });
    observe();
    await refresh();
  };

  window.destroyPwaHealthCard = function destroyPwaHealthCard() {
    window.__pwaHealthAbort?.abort();
    longTaskObserver?.disconnect();
    longTaskObserver = null;
    root = null;
  };
})();
