const fs = require('fs');
const path = require('path');

// --- FOLDERS ---
const sourceFolder = path.join(__dirname, 'weeks_raw'); // your original JSONs
const masterContentFolder = path.join(__dirname, 'bible_studies'); // raw content per week
const targetFolder = path.join(__dirname, 'weeks_normalized');

// Create target folder if missing
if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

// --- CONFIG ---
const config = {
  includeSections: [
    'audio_playlist',
    'chapter_outlines',
    'commentary',
    'deeper_learning',
    'hidden_aleph_tav',
    'kids_study',
    'language_learning'
  ],
  removeSections: ['psalms_plan'], // remove static psalms
  renameSections: {
    aleph_tav: 'hidden_aleph_tav'
  }
};

// Default template for a week
const defaultWeekTemplate = weekNum => ({
  week: weekNum,
  title: `Week ${weekNum}`,
  english: "",
  hebrew: "",
  transliteration: "",
  theme_verse: { text: "", reference: "" },
  intro: { summary: "", instructions: "" },
  sections: {}
});

// Helper: read master content if available
function readMasterContent(weekNumber) {
  const filePath = path.join(masterContentFolder, `week${weekNumber}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return {};
}

// Normalize a single week
function normalizeWeek(weekJson, weekNumber) {
  const masterContent = readMasterContent(weekNumber);
  const normalized = defaultWeekTemplate(weekNumber);

  // Top-level fields
  ['title', 'english', 'hebrew', 'transliteration'].forEach(key => {
    normalized[key] = weekJson[key] || masterContent[key] || normalized[key];
  });

  normalized.theme_verse = weekJson.theme_verse || masterContent.theme_verse || normalized.theme_verse;
  normalized.intro = weekJson.intro || masterContent.intro || normalized.intro;

  // Sections
  normalized.sections = {};
  const allSections = { ...masterContent.sections, ...weekJson.sections };
  Object.keys(allSections).forEach(secKey => {
    if (config.removeSections.includes(secKey)) return;
    if (config.includeSections.length && !config.includeSections.includes(secKey)) return;

    const finalKey = config.renameSections[secKey] || secKey;
    normalized.sections[finalKey] = allSections[secKey];
  });

  return normalized;
}

// Process all 52 weeks
for (let i = 1; i <= 52; i++) {
  const rawFilePath = path.join(sourceFolder, `week${i}.json`);
  let weekJson = {};
  if (fs.existsSync(rawFilePath)) {
    weekJson = JSON.parse(fs.readFileSync(rawFilePath, 'utf-8'));
  }

  const normalized = normalizeWeek(weekJson, i);

  fs.writeFileSync(
    path.join(targetFolder, `week${i}.json`),
    JSON.stringify(normalized, null, 2),
    'utf-8'
  );
  console.log(`Week ${i} generated.`);
}

console.log('✅ All 52 weeks normalized and ready!');
