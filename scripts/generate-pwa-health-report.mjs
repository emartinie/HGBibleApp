import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(process.argv[2] || ".");
const output = path.join(root, "data", "pwa-health-report.json");
const excluded = new Set([".git", "node_modules"]);
const startupExtensions = new Set([".html", ".js", ".css", ".json", ".svg", ".png"]);
const textExtensions = new Set([".html", ".js", ".mjs", ".css", ".json", ".geojson", ".csv", ".md", ".txt", ".rules"]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (excluded.has(entry.name)) return [];
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const normalize = value => value.split(path.sep).join("/");
const sourcePath = value => value === "assets/sounds/voice/omer-meditations/txt.txt"
  ? "assets/sounds/voice/omer-meditations/txt.txt."
  : value;
const files = walk(root)
  .filter(file => normalize(path.relative(root, file)) !== "data/pwa-health-report.json")
  .map(file => {
    const relative = sourcePath(normalize(path.relative(root, file)));
    const stat = fs.statSync(file);
    const extension = path.extname(relative).toLowerCase();
    return { path: relative, bytes: stat.size, extension };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

const byPath = new Map(files.map(file => [file.path, file]));
const read = relative => {
  try { return fs.readFileSync(path.join(root, relative), "utf8"); }
  catch { return ""; }
};
const extractLocalRefs = (source, base = "") => {
  const matches = [...source.matchAll(/(?:src|href)\s*=\s*["']([^"'#?]+)|(?:fetch|import)\s*\(\s*["'`]([^"'`?]+)|from\s+["']([^"']+)/g)];
  return [...new Set(matches.map(match => match[1] || match[2] || match[3])
    .filter(ref => ref && !/^(?:https?:|data:|#|javascript:)/i.test(ref))
    .map(ref => normalize(path.normalize(path.join(base, ref.replace(/^\.\//, "")))))
    .map(ref => ref.replace(/^(\.\.\/)+/, ""))
    .filter(ref => byPath.has(ref)))];
};

const indexSource = read("index.html");
const startupRefs = new Set(["index.html", ...extractLocalRefs(indexSource)]);
const swSource = read("service-worker.js");
const shellMatch = swSource.match(/const SHELL_ASSETS\s*=\s*\[([\s\S]*?)\]/);
const precache = shellMatch
  ? [...shellMatch[1].matchAll(/["']\.?\/?([^"']+)["']/g)].map(match => match[1] || "index.html")
  : [];

function resourceType(file) {
  const ext = file.extension;
  if (ext === ".js" || ext === ".mjs") return "javascript";
  if (ext === ".json" || ext === ".geojson" || ext === ".csv" || ext === ".ndjson" || ext === ".xlsx") return "data";
  if (ext === ".css") return "css";
  if (ext === ".html") return "html";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(ext)) return "image";
  if ([".mp3", ".wav", ".m4a", ".ogg"].includes(ext)) return "audio";
  if ([".mp4", ".webm", ".mov"].includes(ext)) return "video";
  if ([".woff", ".woff2", ".ttf", ".otf"].includes(ext)) return "font";
  return "miscellaneous";
}

function allocation(file) {
  if (/^(?:BookDraft|podcast-scripts|knowledge-module-prototype)\//.test(file.path) || /\.(?:old|docx)$/i.test(file.path)) return "development-only";
  if (["audio", "video", "image"].includes(resourceType(file)) || /^(?:podcasts|videos|images|assets)\//.test(file.path)) return "optional-media";
  if (resourceType(file) === "data" || /^(?:data|commentary|scripture|investigations|articles)\//.test(file.path)) return "content-dataset";
  if (startupRefs.has(file.path) || precache.includes(file.path)) return "core";
  return "dynamic";
}

const totals = {};
const allocations = {};
for (const file of files) {
  const type = resourceType(file);
  totals[type] ||= { bytes: 0, files: 0 };
  totals[type].bytes += file.bytes;
  totals[type].files += 1;
  const group = allocation(file);
  allocations[group] ||= { bytes: 0, files: 0 };
  allocations[group].bytes += file.bytes;
  allocations[group].files += 1;
  file.type = type;
  file.allocation = group;
}

const jsonFiles = files.filter(file => [".json", ".geojson", ".ndjson"].includes(file.extension));
const datasets = jsonFiles.map(file => {
  let parsed;
  let recordCount = null;
  let parseStatus = "valid";
  try {
    const source = read(file.path);
    if (file.extension === ".ndjson") {
      recordCount = source.split(/\r?\n/).filter(Boolean).length;
    } else {
      parsed = JSON.parse(source);
      recordCount = Array.isArray(parsed)
        ? parsed.length
        : parsed && typeof parsed === "object"
          ? Math.max(...Object.values(parsed).filter(Array.isArray).map(value => value.length), Object.keys(parsed).length)
          : 1;
    }
  } catch {
    parseStatus = "invalid";
  }
  const stem = path.basename(file.path, file.extension).replace(/[-_]/g, " ");
  const consumers = files
    .filter(candidate => candidate.extension === ".js" && read(candidate.path).includes(file.path.replace(/^data\//, "")))
    .map(candidate => candidate.path);
  return {
    path: file.path,
    purpose: stem,
    bytes: file.bytes,
    recordCount,
    parseStatus,
    loading: startupRefs.has(file.path) ? "startup" : "on-demand or unreferenced",
    status: /(?:generated|schedule|week\d+)/i.test(file.path) ? "generated or derived (heuristic)" : "authoritative status not declared",
    consumers
  };
}).sort((a, b) => b.bytes - a.bytes);

const cardFiles = files.filter(file => /^cards\/[^/]+\.html$/i.test(file.path));
const cardNames = cardFiles.map(file => path.basename(file.path, ".html"));
const lifecycleBlock = read("js/app.js").match(/const CARD_LIFECYCLE\s*=\s*\{([\s\S]*?)\n\s*\};/)?.[1] || "";
const scriptlessBlock = read("js/app.js").match(/const SCRIPTLESS_CARDS\s*=\s*new Set\(\[([\s\S]*?)\]\)/)?.[1] || "";
const cards = cardFiles.map(html => {
  const name = path.basename(html.path, ".html");
  const jsPath = `js/${name}.js`;
  const js = byPath.get(jsPath);
  const source = `${read(html.path)}\n${js ? read(jsPath) : ""}`;
  const refs = extractLocalRefs(source, "");
  const associated = refs.map(ref => byPath.get(ref)).filter(Boolean);
  const lifecycleLine = lifecycleBlock.split(/\r?\n/).find(line => line.includes(`${name}:`) || line.includes(`"${name}"`)) || "";
  const cleanup = /cleanup\s*:/.test(lifecycleLine);
  const init = /init\s*:/.test(lifecycleLine);
  return {
    name,
    html: html.path,
    scripts: js ? [jsPath] : [],
    datasets: associated.filter(file => file.type === "data").map(file => file.path),
    media: associated.filter(file => ["image", "audio", "video"].includes(file.type)).map(file => file.path),
    knownBytes: html.bytes + (js?.bytes || 0) + associated.reduce((sum, file) => sum + file.bytes, 0),
    loading: startupRefs.has(html.path) || startupRefs.has(jsPath) ? "startup" : "on-demand",
    dependencies: refs,
    initialization: init ? "explicit lifecycle init" : js ? "script side effects or self-init" : "static markup",
    cleanup: cleanup ? "explicit lifecycle cleanup" : "no explicit cleanup registered",
    scriptlessDeclared: scriptlessBlock.includes(`"${name}"`)
  };
}).sort((a, b) => b.knownBytes - a.knownBytes);

const modules = files.filter(file => [".js", ".mjs"].includes(file.extension)).map(file => {
  const source = read(file.path);
  const dependencies = extractLocalRefs(source, normalize(path.dirname(file.path)));
  const globals = [...source.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)/g)].map(match => match[1]);
  return { path: file.path, bytes: file.bytes, dependencies, globals: [...new Set(globals)].sort() };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: {
    application: "HomeGroups Bible App",
    ref: process.env.HG_HEALTH_REF || "main archive",
    commit: process.env.HG_HEALTH_COMMIT || "unavailable in source archive",
    generator: "scripts/generate-pwa-health-report.mjs",
    fingerprint: crypto.createHash("sha256").update(files.map(file => `${file.path}:${file.bytes}`).join("\n")).digest("hex")
  },
  methodology: {
    assetBytes: "Filesystem byte sizes, excluding .git, node_modules, and this generated report.",
    startup: "Static local src/href references in index.html. Browser runtime transfer values are reported separately.",
    cards: "cards/*.html paired with same-name js/*.js plus statically discoverable local references.",
    records: "Top-level array length; for objects, largest top-level array length or key count. This is structural, not semantic.",
    cautions: ["Dynamic paths assembled at runtime may not be attributed.", "Remote CDN resources are not included in repository bytes.", "Generated/authoritative labels are conservative heuristics unless declared in source."]
  },
  assets: {
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    fileCount: files.length,
    byType: totals,
    byAllocation: allocations,
    largest: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 25),
    files
  },
  startup: {
    staticLocalResources: [...startupRefs].filter(ref => byPath.has(ref)).map(ref => byPath.get(ref)),
    staticLocalBytes: [...startupRefs].filter(ref => byPath.has(ref)).reduce((sum, ref) => sum + byPath.get(ref).bytes, 0),
    remoteResources: [...indexSource.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/g)].map(match => match[1])
  },
  serviceWorker: {
    file: "service-worker.js",
    cacheVersion: swSource.match(/CACHE_VERSION\s*=\s*["']([^"']+)/)?.[1] || null,
    precache,
    hasOfflineFallback: /offline\.html/.test(swSource),
    deletesOldShellCaches: /caches\.keys[\s\S]*caches\.delete/.test(swSource),
    strategy: /if\s*\(cached\)[\s\S]*event\.waitUntil\(refresh\)/.test(swSource) ? "stale-while-revalidate for shell; network-first navigation" : "custom"
  },
  cards: { count: cards.length, inventory: cards },
  datasets: {
    count: datasets.length,
    totalRecords: datasets.reduce((sum, dataset) => sum + (dataset.recordCount || 0), 0),
    inventory: datasets
  },
  architecture: {
    modules,
    lifecycleRegistered: cards.filter(card => card.initialization === "explicit lifecycle init").length,
    cleanupRegistered: cards.filter(card => card.cleanup === "explicit lifecycle cleanup").length,
    sharedInfrastructure: ["js/app.js", "js/share-routing.js", "js/mainstage.js", "js/timeStore.js", "js/pwa.js"],
    observations: [
      "Cards are fetched and initialized on demand through the shared loader.",
      "MainStage is embedded in index.html and initialized at startup.",
      "Card lifecycle cleanup is explicit only where registered; absence alone is not proof of a leak.",
      "Several startup libraries and media embeds are remote and therefore excluded from repository footprint."
    ]
  }
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${normalize(path.relative(root, output))}: ${report.assets.fileCount} files, ${report.assets.totalBytes} bytes`);

