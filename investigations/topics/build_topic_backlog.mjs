import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const sourcePath = "C:/Users/eddie/Downloads/topic list for writing.md";
const outputDir = "C:/Users/eddie/Documents/Codex/2026-07-13/c/outputs/topic-backlog-2026-07-18";
const generatedDate = "2026-07-18";

const md = await fs.readFile(sourcePath, "utf8");
const lines = md.split(/\r?\n/);

const cleanMarkup = (text) => text
  .replace(/^#+\s*/, "")
  .replace(/^\*\*(.*)\*\*$/, "$1")
  .replace(/\*\*/g, "")
  .trim();

const slugify = (text) => text
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[’']/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 96);

const normalized = (text) => text
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\b(the|a|an)\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const romanHeading = /^#\s+\*\*([IVXLCDM]+)\.\s+(.+?)\*\*\s*$/;
const subHeading = /^##\s+\*\*(.+?)\*\*\s*$/;
const topicLine = /^\s*(\d+)\.\s+\*\*(.+?)\*\*\s*$/;
const roadmapHeading = /^#\s+\*\*Recommended first investigation sequence\*\*/i;

const topics = [];
const roadmapRaw = [];
let category = null;
let categoryRoman = null;
let subcategory = null;
let inRoadmap = false;

for (const line of lines) {
  if (roadmapHeading.test(line)) {
    inRoadmap = true;
    category = null;
    subcategory = null;
    continue;
  }
  const h1 = line.match(romanHeading);
  if (h1 && !inRoadmap) {
    categoryRoman = h1[1];
    category = cleanMarkup(h1[2]);
    subcategory = null;
    continue;
  }
  const h2 = line.match(subHeading);
  if (h2 && !inRoadmap) {
    subcategory = cleanMarkup(h2[1]);
    continue;
  }
  const item = line.match(topicLine);
  if (!item) continue;
  if (inRoadmap) {
    const rawTitle = item[2].trim();
    const inv = rawTitle.match(/^(INV-\d+)\s+[—–-]\s+(.+)$/);
    roadmapRaw.push({
      rank: Number(item[1]),
      investigationId: inv ? inv[1] : null,
      title: inv ? inv[2].trim() : rawTitle,
    });
  } else {
    topics.push({
      sourceNumber: Number(item[1]),
      title: item[2].trim(),
      category,
      categoryRoman,
      subcategory,
    });
  }
}

if (topics.length !== 1940) throw new Error(`Expected 1,940 canonical topics, found ${topics.length}`);
if (roadmapRaw.length !== 15) throw new Error(`Expected 15 roadmap references, found ${roadmapRaw.length}`);

const categoryTypes = new Map([
  ["HG Bible App Product and Research-System Investigations", "Product / System"],
  ["Learning, Discipleship, and Teaching Method", "Learning Module"],
  ["Eddie Martinie’s Book, Talk, and Public Work", "Book / Talk"],
  ["Community, Preparedness, Prayer, and Radio", "Community Guide"],
  ["Investigation Standards and Meta-Investigations", "Research Standard"],
]);

const keywordTags = [
  ["canon", /canon|canonical|apocrypha|deuterocanonical/i],
  ["manuscripts", /manuscript|scroll|codex|papyr/i],
  ["textual-criticism", /textual|variant|masoretic|septuagint|vulgate/i],
  ["torah", /torah|commandment|mitzv|moses/i],
  ["calendar", /calendar|appointed time|feast|shabbat|sabbath|jubilee|shemitah/i],
  ["astronomy", /astronom|star|eclipse|moon|sun|planet|constellation/i],
  ["chronology", /chronolog|timeline|date of|dating of/i],
  ["archaeology", /archaeolog|inscription|excavat|artifact/i],
  ["yeshua", /yeshua|jesus|messiah|christ|gospel/i],
  ["paul", /paul|pauline|apostle to the gentiles/i],
  ["israel", /israel|jewish|judah|zion|gentile|nations/i],
  ["prophecy", /prophe|eschatolog|end times|revelation|antichrist|tribulation/i],
  ["spiritual-beings", /angel|demon|divine council|nephilim|satan|spirit/i],
  ["genesis", /genesis|creation|adam|eve|flood|noah/i],
  ["languages", /hebrew|greek|aramaic|language|word study|grammar/i],
  ["temple", /temple|tabernacle|priest|sacrifice|levitical/i],
  ["early-history", /early church|church fathers|second temple|rabbinic|patristic/i],
  ["theology", /theolog|doctrine|trinity|atonement|salvation|covenant/i],
  ["claims-testing", /claim|myth|misquot|false|testing|evidence|probability/i],
  ["sources", /source|teacher|movement|commentary|bibliograph/i],
  ["app", /app|interface|user experience|release|module|engine|json|api/i],
  ["discipleship", /discipleship|learning|teaching|home group|curriculum/i],
  ["community", /community|prayer|preparedness|radio|emergency|family/i],
];

const deepResearch = /\b(complete|comprehensive|exhaustive|history|historical|chronology|timeline|archaeology|manuscript|textual|catalogue|all known|every|source evaluation|statistical|astronomical)\b/i;
const normGroups = new Map();
for (const topic of topics) {
  const key = normalized(topic.title);
  if (!normGroups.has(key)) normGroups.set(key, []);
  normGroups.get(key).push(topic.sourceNumber);
}

const findPossibleMatch = (topic) => {
  const a = normalized(topic.title);
  let best = null;
  for (const other of topics) {
    if (other.sourceNumber === topic.sourceNumber) continue;
    const b = normalized(other.title);
    const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
    if (ratio < 0.88 || !(a.includes(b) || b.includes(a))) continue;
    if (!best || ratio > best.ratio) best = { id: other.sourceNumber, ratio };
  }
  return best;
};

const enriched = topics.map((topic) => {
  const id = `TOP-${String(topic.sourceNumber).padStart(4, "0")}`;
  const exact = normGroups.get(normalized(topic.title));
  const possible = exact.length === 1 ? findPossibleMatch(topic) : null;
  const tags = [slugify(topic.category)];
  for (const [tag, pattern] of keywordTags) if (pattern.test(topic.title)) tags.push(tag);
  return {
    id,
    sourceNumber: topic.sourceNumber,
    title: topic.title,
    slug: slugify(topic.title),
    category: topic.category,
    categoryId: slugify(topic.category),
    categoryRoman: topic.categoryRoman,
    subcategory: topic.subcategory,
    contentType: categoryTypes.get(topic.category) || "Investigation",
    status: "candidate",
    priority: "untriaged",
    researchLevel: deepResearch.test(topic.title) ? "deep" : "standard",
    tags: [...new Set(tags)].slice(0, 6),
    duplicateReview: exact.length > 1 ? "exact duplicate" : possible ? "possible overlap" : "none",
    possibleMatchId: exact.length > 1
      ? `TOP-${String(exact.find((n) => n !== topic.sourceNumber)).padStart(4, "0")}`
      : possible ? `TOP-${String(possible.id).padStart(4, "0")}` : null,
    recommendedRank: null,
    targetDate: null,
    notes: "",
  };
});

const roadmapMap = new Map([
  [1,  { primary: 33,   supporting: [25, 26, 31, 32] }],
  [2,  { primary: 32,   supporting: [34, 35, 37, 54, 64, 65, 66, 67] }],
  [3,  { primary: 121,  supporting: [122, 123, 124, 125, 126, 127, 129, 130, 132] }],
  [4,  { primary: 1438, supporting: [1439] }],
  [5,  { primary: 893,  supporting: [894] }],
  [6,  { primary: 316,  supporting: [295, 315, 317, 318] }],
  [7,  { primary: 879,  supporting: [880, 888, 891, 892] }],
  [8,  { primary: 661,  supporting: [662, 663] }],
  [9,  { primary: 790,  supporting: [784, 785, 786, 787, 788, 789] }],
  [10, { primary: 1044, supporting: [1045, 1046, 1047] }],
  [11, { primary: 349,  supporting: [265, 267, 271, 272, 278, 279, 282] }],
  [12, { primary: 401,  supporting: [403, 408, 410, 411] }],
  [13, { primary: 1911, supporting: [1912, 1913, 1914, 1915, 1916] }],
  [14, { primary: 1543, supporting: [1544, 1545, 1548, 1549, 1550] }],
  [15, { primary: 1633, supporting: [1637, 1638, 1640, 1641, 1642] }],
]);

const roadmap = roadmapRaw.map((item) => {
  const mapping = roadmapMap.get(item.rank);
  const primary = enriched.find((topic) => topic.sourceNumber === mapping.primary);
  if (!primary) throw new Error(`Roadmap primary topic ${mapping.primary} was not found`);
  primary.recommendedRank = item.rank;
  primary.priority = "recommended";
  return {
    rank: item.rank,
    investigationId: item.investigationId,
    title: item.title,
    topicId: primary.id,
    matchedBacklogTitle: primary.title,
    supportingTopicIds: mapping.supporting.map((n) => `TOP-${String(n).padStart(4, "0")}`),
    mappingBasis: "source-guided",
  };
});

const categoryMap = new Map();
for (const topic of enriched) {
  if (!categoryMap.has(topic.categoryId)) {
    categoryMap.set(topic.categoryId, {
      id: topic.categoryId,
      roman: topic.categoryRoman,
      title: topic.category,
      order: categoryMap.size + 1,
      count: 0,
    });
  }
  categoryMap.get(topic.categoryId).count += 1;
}
const categories = [...categoryMap.values()];

const payload = {
  schemaVersion: 1,
  generatedDate,
  title: "HG Bible App Content Backlog",
  description: "Canonical future-topic backlog derived from the supplied Investigation Master Backlog.",
  source: {
    fileName: path.basename(sourcePath),
    canonicalTopicCount: enriched.length,
    roadmapReferenceCount: roadmap.length,
    note: "The 15 recommended investigations are roadmap references and are not counted as additional canonical topics.",
  },
  vocabularies: {
    statuses: ["candidate", "researching", "planned", "drafting", "review", "published", "deferred", "merged", "rejected"],
    priorities: ["untriaged", "recommended", "high", "medium", "low"],
    researchLevels: ["standard", "deep"],
  },
  categories,
  roadmap,
  topics: enriched,
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "content-backlog.json"), JSON.stringify(payload, null, 2) + "\n", "utf8");

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const backlog = workbook.worksheets.add("Backlog");
const roadmapSheet = workbook.worksheets.add("Roadmap");
const lists = workbook.worksheets.add("Lists");
for (const sheet of [summary, backlog, roadmapSheet, lists]) sheet.showGridLines = false;

const navy = "#102A43";
const blue = "#1976A3";
const gold = "#D6A84B";
const pale = "#EAF2F8";
const lightGold = "#FFF4D6";
const green = "#DFF2E5";
const gray = "#66788A";
const white = "#FFFFFF";

summary.getRange("A1:H2").merge();
summary.getRange("A1").values = [["HG Bible App · Content Backlog"]];
summary.getRange("A1:H2").format = { fill: navy, font: { color: white, bold: true, size: 22 }, verticalAlignment: "center" };
summary.getRange("A3:H3").merge();
summary.getRange("A3").values = [["Editorial source of truth for 1,940 canonical future topics; the JSON file is the app-facing export."]];
summary.getRange("A3:H3").format = { fill: "#D9EAF2", font: { color: navy, italic: true }, wrapText: true };

const summaryLabels = [
  ["Canonical topics", "Categories", "Recommended sequence", "Possible duplicate review"],
];
summary.getRange("A5:H5").values = [["Canonical topics", "", "Categories", "", "Recommended sequence", "", "Duplicate review", ""]];
summary.getRange("A5:H5").format = { fill: blue, font: { color: white, bold: true }, horizontalAlignment: "center" };
summary.getRange("A6:B7").merge(); summary.getRange("C6:D7").merge(); summary.getRange("E6:F7").merge(); summary.getRange("G6:H7").merge();
const dataStart = 7;
const dataEnd = dataStart + enriched.length - 1;
summary.getRange("A6").formulas = [[`=COUNTA('Backlog'!$A$${dataStart}:$A$${dataEnd})`]];
summary.getRange("C6").formulas = [[`=COUNTA('Lists'!$A$2:$A$${categories.length + 1})`]];
summary.getRange("E6").formulas = [[`=COUNTA('Roadmap'!$A$5:$A$${roadmap.length + 4})`]];
summary.getRange("G6").formulas = [[`=COUNTIF('Backlog'!$L$${dataStart}:$L$${dataEnd},"<>none")`]];
summary.getRange("A6:H7").format = { fill: pale, font: { color: navy, bold: true, size: 20 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: "#B8CBD8" } };

summary.getRange("A10:H10").merge();
summary.getRange("A10").values = [["How to use this workbook"]];
summary.getRange("A10:H10").format = { fill: gold, font: { color: "#1E293B", bold: true, size: 14 } };
summary.getRange("A11:H15").merge();
summary.getRange("A11").values = [[
  "Backlog is the editable master list. Keep titles and Topic IDs stable; update Status, Priority, Target Date, and Notes as work progresses. " +
  "Roadmap preserves the source file’s recommended first sequence without duplicating those topics. Duplicate Review is intentionally conservative: it flags exact duplicates and near-identical wording for human review, but never merges records automatically."
]];
summary.getRange("A11:H15").format = { fill: "#F7FAFC", font: { color: "#334E68" }, wrapText: true, verticalAlignment: "top", borders: { preset: "outside", style: "thin", color: "#D7E1E8" } };

summary.getRange("A18:D18").values = [["Category", "Topics", "% of backlog", "Primary content type"]];
summary.getRange("A18:D18").format = { fill: navy, font: { color: white, bold: true } };
const categoryRows = categories.map((c, i) => [c.title, c.count, null, categoryTypes.get(c.title) || "Investigation"]);
summary.getRange(`A19:D${18 + categoryRows.length}`).values = categoryRows;
for (let i = 0; i < categories.length; i++) {
  summary.getRange(`C${19 + i}`).formulas = [[`=B${19 + i}/$A$6`]];
}
summary.getRange(`B19:B${18 + categoryRows.length}`).format.numberFormat = "#,##0";
summary.getRange(`C19:C${18 + categoryRows.length}`).format.numberFormat = "0.0%";
summary.getRange(`A19:D${18 + categoryRows.length}`).format.borders = { preset: "inside", style: "thin", color: "#E2E8F0" };

const backlogHeaders = ["Topic ID", "Source #", "Title", "Slug", "Category", "Subcategory", "Content Type", "Status", "Priority", "Research Level", "Tags", "Duplicate Review", "Possible Match", "Recommended Rank", "Target Date", "Notes"];
backlog.getRange("A1:P2").merge();
backlog.getRange("A1").values = [["Content Backlog · Editable Master"]];
backlog.getRange("A1:P2").format = { fill: navy, font: { color: white, bold: true, size: 20 }, verticalAlignment: "center" };
backlog.getRange("A3:P4").merge();
backlog.getRange("A3").values = [["Preserved from the source markdown. Edit workflow fields, but keep Topic ID stable. Duplicate flags require human review; no entries were automatically deleted or merged."]];
backlog.getRange("A3:P4").format = { fill: lightGold, font: { color: "#5F4B19", italic: true }, wrapText: true, verticalAlignment: "center" };
backlog.getRange("A6:P6").values = [backlogHeaders];
backlog.getRange("A6:P6").format = { fill: blue, font: { color: white, bold: true }, wrapText: true, verticalAlignment: "center" };
const backlogRows = enriched.map((t) => [
  t.id, t.sourceNumber, t.title, t.slug, t.category, t.subcategory || "", t.contentType, t.status, t.priority,
  t.researchLevel, t.tags.join(", "), t.duplicateReview, t.possibleMatchId || "", t.recommendedRank, null, t.notes,
]);
backlog.getRange(`A7:P${dataEnd}`).values = backlogRows;
backlog.tables.add(`A6:P${dataEnd}`, true, "ContentBacklogTable");
backlog.freezePanes.freezeRows(6);
backlog.freezePanes.freezeColumns(2);
backlog.getRange(`H7:H${dataEnd}`).dataValidation = { rule: { type: "list", values: payload.vocabularies.statuses } };
backlog.getRange(`I7:I${dataEnd}`).dataValidation = { rule: { type: "list", values: payload.vocabularies.priorities } };
backlog.getRange(`J7:J${dataEnd}`).dataValidation = { rule: { type: "list", values: payload.vocabularies.researchLevels } };
backlog.getRange(`O7:O${dataEnd}`).format.numberFormat = "yyyy-mm-dd";
backlog.getRange(`L7:L${dataEnd}`).conditionalFormats.add("containsText", { text: "exact", format: { fill: "#FADBD8", font: { color: "#922B21", bold: true } } });
backlog.getRange(`L7:L${dataEnd}`).conditionalFormats.add("containsText", { text: "possible", format: { fill: lightGold, font: { color: "#7D5A00" } } });
backlog.getRange(`I7:I${dataEnd}`).conditionalFormats.add("containsText", { text: "recommended", format: { fill: green, font: { color: "#176B3A", bold: true } } });

roadmapSheet.getRange("A1:G2").merge();
roadmapSheet.getRange("A1").values = [["Recommended First Investigation Sequence"]];
roadmapSheet.getRange("A1:G2").format = { fill: navy, font: { color: white, bold: true, size: 20 }, verticalAlignment: "center" };
roadmapSheet.getRange("A3:G3").merge();
roadmapSheet.getRange("A3").values = [["These 15 items are references into the canonical backlog, not additional topic records. Composite investigations are mapped to one primary topic and the supporting topics that establish their broader scope."]];
roadmapSheet.getRange("A3:G3").format = { fill: lightGold, font: { color: "#5F4B19", italic: true }, wrapText: true };
roadmapSheet.getRange("A4:G4").values = [["Rank", "INV ID", "Recommended Title", "Primary Topic ID", "Primary Backlog Title", "Supporting Topic IDs", "Mapping Basis"]];
roadmapSheet.getRange("A4:G4").format = { fill: blue, font: { color: white, bold: true }, wrapText: true };
roadmapSheet.getRange(`A5:G${roadmap.length + 4}`).values = roadmap.map((r) => [r.rank, r.investigationId, r.title, r.topicId, r.matchedBacklogTitle, r.supportingTopicIds.join(", "), r.mappingBasis]);
roadmapSheet.tables.add(`A4:G${roadmap.length + 4}`, true, "RoadmapTable");
roadmapSheet.freezePanes.freezeRows(4);

lists.getRange("A1:D1").values = [["Categories", "Statuses", "Priorities", "Research Levels"]];
lists.getRange("A1:D1").format = { fill: navy, font: { color: white, bold: true } };
const listRows = Math.max(categories.length, payload.vocabularies.statuses.length, payload.vocabularies.priorities.length, payload.vocabularies.researchLevels.length);
const listValues = Array.from({ length: listRows }, (_, i) => [
  categories[i]?.title || "",
  payload.vocabularies.statuses[i] || "",
  payload.vocabularies.priorities[i] || "",
  payload.vocabularies.researchLevels[i] || "",
]);
lists.getRange(`A2:D${listRows + 1}`).values = listValues;
lists.freezePanes.freezeRows(1);

summary.getRange("A1:H45").format.font = { name: "Aptos" };
backlog.getRange(`A1:P${dataEnd}`).format.font = { name: "Aptos" };
roadmapSheet.getRange(`A1:G${roadmap.length + 4}`).format.font = { name: "Aptos" };
lists.getRange(`A1:D${listRows + 1}`).format.font = { name: "Aptos" };

summary.getRange("A1:H45").format.wrapText = true;
summary.getRange("A1:H45").format.autofitRows();
summary.getRange("A:A").format.columnWidth = 34;
summary.getRange("B:B").format.columnWidth = 12;
summary.getRange("C:C").format.columnWidth = 14;
summary.getRange("D:D").format.columnWidth = 22;
summary.getRange("E:H").format.columnWidth = 14;

const widths = [14, 10, 48, 34, 34, 25, 18, 15, 15, 16, 30, 18, 16, 16, 14, 38];
widths.forEach((w, i) => backlog.getRangeByIndexes(0, i, 1, 1).format.columnWidth = w);
backlog.getRange(`C7:C${dataEnd}`).format.wrapText = true;
backlog.getRange(`E7:F${dataEnd}`).format.wrapText = true;
backlog.getRange(`K7:K${dataEnd}`).format.wrapText = true;
backlog.getRange(`P7:P${dataEnd}`).format.wrapText = true;
backlog.getRange("1:6").format.autofitRows();

const roadWidths = [8, 12, 42, 18, 42, 38, 18];
roadWidths.forEach((w, i) => roadmapSheet.getRangeByIndexes(0, i, 1, 1).format.columnWidth = w);
roadmapSheet.getRange(`A1:G${roadmap.length + 4}`).format.wrapText = true;
roadmapSheet.getRange(`A1:G${roadmap.length + 4}`).format.autofitRows();
lists.getRange("A:A").format.columnWidth = 44;
lists.getRange("B:D").format.columnWidth = 20;

const inspectSummary = await workbook.inspect({ kind: "table", range: "Summary!A1:H25", include: "values,formulas", tableMaxRows: 25, tableMaxCols: 8 });
const inspectBacklog = await workbook.inspect({ kind: "table", range: "Backlog!A1:P12", include: "values,formulas", tableMaxRows: 12, tableMaxCols: 16 });
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "final formula error scan" });

for (const [sheetName, range, fileName] of [
  ["Summary", "A1:H43", "preview-summary.png"],
  ["Backlog", "A1:P24", "preview-backlog.png"],
  ["Roadmap", `A1:G${roadmap.length + 4}`, "preview-roadmap.png"],
  ["Lists", `A1:D${listRows + 1}`, "preview-lists.png"],
]) {
  const image = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, fileName), new Uint8Array(await image.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(path.join(outputDir, "HG-Bible-App-Content-Backlog.xlsx"));

const duplicateCounts = enriched.reduce((acc, t) => {
  acc[t.duplicateReview] = (acc[t.duplicateReview] || 0) + 1;
  return acc;
}, {});
const report = {
  canonicalTopics: enriched.length,
  roadmapReferences: roadmap.length,
  categories: categories.length,
  duplicateCounts,
  roadmap,
  summaryInspection: inspectSummary.ndjson,
  backlogInspection: inspectBacklog.ndjson,
  formulaErrors: errors.ndjson,
};
await fs.writeFile(path.join(outputDir, "qa-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({ canonicalTopics: enriched.length, roadmapReferences: roadmap.length, categories: categories.length, duplicateCounts, roadmap }, null, 2));
