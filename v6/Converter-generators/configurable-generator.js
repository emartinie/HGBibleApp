const fs = require('fs');
const path = require('path');

// Folders
const sourceFolder = path.join(__dirname, 'weeks'); // your original JSONs
const targetFolder = path.join(__dirname, 'weeks_normalized');

// Ensure target folder exists
if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

// --- CONFIG: define sections to include/exclude or rename ---
const config = {
  includeSections: [
    'audio_playlist',
    'chapter_outlines',
    'commentary',
    'deeper_learning',
    'aleph_tav',
    'kids_study',
    'language_learning'
  ],
  removeSections: ['psalms_plan'], // sections to remove
  renameSections: {
    aleph_tav: 'hidden_aleph_tav'
    // e.g., you could rename kids_study -> children_study
  }
};

// Default template generator for a week
const defaultWeekTemplate = weekNum => ({
  week: weekNum,
  title: "",
  english: "",
  hebrew: "",
  transliteration: "",
  theme_verse: { text: "", reference: "" },
  intro: { summary: "", instructions: "" },
  sections: {}
});

// Normalize a single week JSON according to config
function normalizeWeek(weekJson, weekNumber) {
  const normalized = defaultWeekTemplate(weekNumber);

  // Copy top-level fields if they exist
  ['title', 'english', 'hebrew', 'transliteration'].forEach(key => {
    if (weekJson[key]) normalized[key] = weekJson[key];
  });

  if (weekJson.theme_verse) normalized.theme_verse = weekJson.theme_verse;
  if (weekJson.intro) normalized.intro = weekJson.intro;

  // Process sections
  normalized.sections = {};
  if (weekJson.sections) {
    Object.keys(weekJson.sections).forEach(secKey => {
      // Skip removed sections
      if (config.removeSections.includes(secKey)) return;

      // Skip sections not included (if includeSections defined)
      if (config.includeSections.length && !config.includeSections.includes(secKey)) return;

      // Rename if configured
      const finalKey = config.renameSections[secKey] || secKey;

      normalized.sections[finalKey] = weekJson.sections[secKey];
    });
  }

  return normalized;
}

// Process all week files
fs.readdirSync(sourceFolder).forEach(file => {
  if (file.endsWith('.json')) {
    const weekNumber = parseInt(file.match(/\d+/)?.[0]);
    if (!weekNumber) return;

    const raw = fs.readFileSync(path.join(sourceFolder, file), 'utf-8');
    const weekJson = JSON.parse(raw);

    const normalized = normalizeWeek(weekJson, weekNumber);

    fs.writeFileSync(
      path.join(targetFolder, `week${weekNumber}.json`),
      JSON.stringify(normalized, null, 2),
      'utf-8'
    );
    console.log(`Week ${weekNumber} normalized.`);
  }
});

console.log('All weeks processed!');
