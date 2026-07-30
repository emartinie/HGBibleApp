(function relationshipEngineBootstrap(global) {
  "use strict";

  const DATA_URLS = Object.freeze({
    relationships: "data/relationships/relationships.json",
    covenants: "data/covenants/covenants.json",
    commandmentAssociations: "data/covenants/commandment-associations.json",
    comparisons: "data/covenants/comparison-texts.json"
  });
  const SUPPORTED_NODE_TYPES = Object.freeze([
    "covenant", "commandment", "scripture", "investigation", "timeline",
    "article", "studyhub", "source", "teacher", "intertext", "calendar",
    "hebrewWord", "greekWord", "event", "media"
  ]);
  const SUPPORTED_RELATIONSHIPS = Object.freeze([
    "HAS_COMMANDMENT", "HAS_SOURCE", "HAS_ARTICLE", "HAS_EVENT",
    "HAS_TIMELINE_EVENT", "HAS_INVESTIGATION", "HAS_MEDIA",
    "HAS_LANGUAGE_NOTE", "FULFILLS", "RENEWS", "QUOTES", "CITES",
    "REFERENCES", "COMMENTS_ON", "PARALLELS", "RELATED_TO",
    "IS_SIGN_OF", "IS_PART_OF", "IS_ASSOCIATED_WITH"
  ]);
  const PHASE_ONE_COVENANTS = new Set(["mosaic", "abrahamic"]);

  let loadPromise = null;
  let relationshipCache = [];

  function normalizeNode(nodeOrType, id) {
    if (typeof nodeOrType === "object" && nodeOrType) {
      return {
        type: String(nodeOrType.type || nodeOrType.nodeType || ""),
        id: String(nodeOrType.id ?? "")
      };
    }
    return { type: String(nodeOrType || ""), id: String(id ?? "") };
  }

  function slug(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "node";
  }

  function hash(value) {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }

  function relationshipId(record) {
    const key = [
      record.fromType, record.fromId, record.relationship,
      record.toType, record.toId
    ].join("|");
    return "rel-" + hash(key);
  }

  function createRelationship(record) {
    const normalized = {
      id: record.id || "",
      fromType: String(record.fromType || ""),
      fromId: String(record.fromId ?? ""),
      relationship: String(record.relationship || ""),
      toType: String(record.toType || ""),
      toId: String(record.toId ?? ""),
      classification: String(record.classification || "descriptive"),
      sources: [...new Set((record.sources || []).filter(Boolean).map(String))],
      confidence: String(record.confidence || "unclassified"),
      notes: String(record.notes || "")
    };
    if (record.metadata && typeof record.metadata === "object") {
      normalized.metadata = { ...record.metadata };
    }
    normalized.id = normalized.id || relationshipId(normalized);
    return normalized;
  }

  async function fetchJson(url, fallback) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("HTTP " + response.status);
      return await response.json();
    } catch (error) {
      console.warn("[HGRelationships] Could not load " + url + ".", error);
      return fallback;
    }
  }

  function adaptCommandments(associations) {
    return (associations || []).map((association) => createRelationship({
      fromType: "covenant",
      fromId: association.covenantId,
      relationship: "HAS_COMMANDMENT",
      toType: "commandment",
      toId: association.commandmentId,
      classification: association.classification?.status || "textual",
      sources: association.basisReferences || [],
      confidence: "explicit",
      notes: association.notes || ""
    }));
  }

  function adaptCovenants(covenants) {
    const output = [];
    (covenants || []).filter((covenant) => PHASE_ONE_COVENANTS.has(covenant.id)).forEach((covenant) => {
      Object.values(covenant.relatedSources || {}).flat().forEach((source) => {
        const sourceId = slug([source.author, source.work, source.location].filter(Boolean).join("-"));
        output.push(createRelationship({
          fromType: "covenant",
          fromId: covenant.id,
          relationship: "HAS_SOURCE",
          toType: "source",
          toId: sourceId,
          classification: source.classification || "ancient-source",
          sources: [source.location].filter(Boolean),
          confidence: "explicit",
          notes: source.notes || "",
          metadata: {
            author: source.author || "",
            work: source.work || "",
            location: source.location || ""
          }
        }));
      });

      (covenant.ntReferences || []).forEach((reference) => {
        const citation = typeof reference === "string" ? reference : reference.reference;
        if (!citation) return;
        output.push(createRelationship({
          fromType: "covenant",
          fromId: covenant.id,
          relationship: "REFERENCES",
          toType: "scripture",
          toId: citation,
          classification: typeof reference === "object" ? reference.classification || "nt-reference" : "nt-reference",
          sources: [citation],
          confidence: "explicit",
          notes: typeof reference === "object" ? reference.summary || "" : ""
        }));
      });
    });
    return output;
  }

  function adaptComparisons(comparisons) {
    const output = [];
    (comparisons || []).forEach((comparison) => {
      (comparison.covenantIds || []).forEach((covenantId) => {
        output.push(createRelationship({
          fromType: "covenant",
          fromId: covenantId,
          relationship: "PARALLELS",
          toType: "scripture",
          toId: comparison.reference || comparison.id,
          classification: "comparison-metadata",
          sources: [comparison.reference].filter(Boolean),
          confidence: "explicit",
          notes: comparison.literarySetting || "",
          metadata: { comparisonId: comparison.id }
        }));
      });
    });
    return output;
  }

  function deduplicate(records) {
    const byKey = new Map();
    records.forEach((record) => {
      const normalized = createRelationship(record);
      const key = [
        normalized.fromType, normalized.fromId, normalized.relationship,
        normalized.toType, normalized.toId
      ].join("|");
      if (!byKey.has(key)) byKey.set(key, normalized);
    });
    return [...byKey.values()];
  }

  async function load() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const [stored, covenants, associations, comparisons] = await Promise.all([
        fetchJson(DATA_URLS.relationships, []),
        fetchJson(DATA_URLS.covenants, []),
        fetchJson(DATA_URLS.commandmentAssociations, []),
        fetchJson(DATA_URLS.comparisons, [])
      ]);
      relationshipCache = deduplicate([
        ...(Array.isArray(stored) ? stored : []),
        ...adaptCommandments(Array.isArray(associations) ? associations : []),
        ...adaptCovenants(Array.isArray(covenants) ? covenants : []),
        ...adaptComparisons(Array.isArray(comparisons) ? comparisons : [])
      ]);
      return relationshipCache.slice();
    })().catch((error) => {
      console.warn("[HGRelationships] Relationship loading failed.", error);
      relationshipCache = [];
      return [];
    });
    return loadPromise;
  }

  async function getOutgoing(nodeOrType, id) {
    const node = normalizeNode(nodeOrType, id);
    const relationships = await load();
    return relationships.filter((item) => item.fromType === node.type && item.fromId === node.id);
  }

  async function getIncoming(nodeOrType, id) {
    const node = normalizeNode(nodeOrType, id);
    const relationships = await load();
    return relationships.filter((item) => item.toType === node.type && item.toId === node.id);
  }

  async function getRelationships(nodeOrType, id) {
    const node = normalizeNode(nodeOrType, id);
    const relationships = await load();
    return relationships.filter((item) =>
      (item.fromType === node.type && item.fromId === node.id) ||
      (item.toType === node.type && item.toId === node.id)
    );
  }

  async function find(type, id) {
    const node = normalizeNode(type, id);
    const [incoming, outgoing] = await Promise.all([
      getIncoming(node),
      getOutgoing(node)
    ]);
    return {
      type: node.type,
      id: node.id,
      incoming,
      outgoing,
      relationships: deduplicate([...incoming, ...outgoing])
    };
  }

  async function findByRelationship(relationship, nodeOrType, id) {
    const relationships = await load();
    const filtered = relationships.filter((item) => item.relationship === relationship);
    if (!nodeOrType) return filtered;
    const node = normalizeNode(nodeOrType, id);
    return filtered.filter((item) =>
      (item.fromType === node.type && item.fromId === node.id) ||
      (item.toType === node.type && item.toId === node.id)
    );
  }

  async function getNeighbors(nodeOrType, id) {
    const node = normalizeNode(nodeOrType, id);
    const relationships = await getRelationships(node);
    const neighbors = new Map();
    relationships.forEach((item) => {
      const neighbor = item.fromType === node.type && item.fromId === node.id
        ? { type: item.toType, id: item.toId }
        : { type: item.fromType, id: item.fromId };
      neighbors.set(neighbor.type + "|" + neighbor.id, neighbor);
    });
    return [...neighbors.values()];
  }

  function cache() {
    return {
      loaded: Boolean(loadPromise),
      count: relationshipCache.length,
      relationships: relationshipCache.slice()
    };
  }

  function clearCache() {
    loadPromise = null;
    relationshipCache = [];
  }

  global.HGRelationships = Object.freeze({
    load,
    getRelationships,
    getIncoming,
    getOutgoing,
    find,
    findByRelationship,
    getNeighbors,
    cache,
    clearCache,
    supportedNodeTypes: SUPPORTED_NODE_TYPES,
    supportedRelationships: SUPPORTED_RELATIONSHIPS
  });
})(window);
