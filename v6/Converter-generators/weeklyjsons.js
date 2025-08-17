const fs = require('fs');
const path = require('path');

// Folders
const sourceFolder = path.join(__dirname, 'weeks'); // existing JSONs
const targetFolder = path.join(__dirname, 'weeks_normalized');

// Ensure target folder exists
if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

// Define a template / default structure
const defaultWeekTemplate = weekNum => ({
  week: weekNum,
  title: "",
  english: "",
  hebrew: "",
  transliteration: "",
  theme_verse: { text: "", reference: "" },
  intro: { summary: "", instructions: "" },
  sections: {
    audio_playlist: [],
    chapter_outlines: { Torah: [], Prophets: [], Writings: [], Gospels: [], Letters: [], Revelation: [] },
    commentary: { quote: "", content: "" },
    deeper_learning: "",
    aleph_tav: "",
    kids_study: { videos: [], pdf: "" },
    language_learning: { hebrew: {}, greek: {}, audio: "" }
    // Remove psalms_plan since tables are static
  }
});

// Function to normalize a single week JSON
function normalizeWeek(weekJson, weekNumber) {
  const normalized = defaultWeekTemplate(weekNumber);

  // Copy over top-level fields if they exist
  ['title', 'english', 'hebrew', 'transliteration'].forEach(key => {
    if (weekJson[key]) normalized[key] = weekJson[key];
  });

  if (weekJson.theme_verse) normalized.theme_verse = weekJson.theme_verse;
  if (weekJson.intro) normalized.intro = weekJson.intro;

  // Copy sections
  if (weekJson.sections) {
    const sections = weekJson.sections;
    Object.keys(normalized.sections).forEach(secKey => {
      if (sections[secKey] !== undefined) {
        normalized.sections[secKey] = sections[secKey];
      }
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
