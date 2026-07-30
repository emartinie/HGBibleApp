(function () {
  "use strict";

  const BASE = "data/covenants/";
  const FILES = {
    covenants: BASE + "covenants.json",
    associations: BASE + "commandment-associations.json",
    comparisons: BASE + "comparison-texts.json"
  };
  let cachePromise = null;

  async function safeJson(url, fallback) {
    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) return fallback;
      const value = await response.json();
      return Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function load() {
    if (!cachePromise) {
      cachePromise = Promise.all([
        safeJson(FILES.covenants, []),
        safeJson(FILES.associations, []),
        safeJson(FILES.comparisons, [])
      ]).then(([covenants, associations, comparisons]) =>
        Object.freeze({ covenants, associations, comparisons })
      );
    }
    return cachePromise;
  }

  async function getAll() {
    return (await load()).covenants.slice();
  }

  async function getById(id) {
    const stableId = String(id || "");
    return (await load()).covenants.find(item => item.id === stableId) || null;
  }

  async function getAssociationsForCommandment(commandmentId) {
    const stableId = String(commandmentId ?? "");
    return (await load()).associations.filter(item => String(item.commandmentId) === stableId);
  }

  async function getComparisonMetadata(ids) {
    const comparisons = (await load()).comparisons;
    if (!ids) return comparisons.slice();
    const requested = new Set((Array.isArray(ids) ? ids : [ids]).map(String));
    return comparisons.filter(item => requested.has(item.id));
  }

  function clearCache() {
    cachePromise = null;
  }

  window.HGCovenants = Object.freeze({
    load,
    getAll,
    getById,
    getAssociationsForCommandment,
    getComparisonMetadata,
    clearCache
  });
})();
