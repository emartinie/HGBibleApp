// normalizeWeeks.js
// Node.js script to normalize 52 weeks of Bible study JSON

const fs = require('fs');
const path = require('path');

// --- CONFIG --- 
const inputDir = path.join(__dirname, 'weeks'); // folder with original week JSONs
const outputDir = path.join(__dirname, 'weeks_normalized'); // output folder
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Master template defining all expected sections/subsections
const template = {
  english: "",
  hebrew: "",
  transliteration: "",
  week: 0,
  title: "",
  theme_verse: { text: "", reference: "" },
  intro: { summary: "", instructions: "" },
  sections: {
    audio_playlist: [],
    chapter_outlines: {
      Torah: [],
      Prophets: [],
      Writings: [],
      Gospels: [],
      Letters: [],
      Revelation: []
    },
    commentary: { quote: "", content: "" },
    deeper_learning: "",
    aleph_tav: "",
    kids_study: { videos: [], pdf: "" },
    language_learning: { hebrew: { word: "", text: "", meaning: "" }, greek: { word: "", text: "", meaning: "" }, audio: "" },
    psalms_plan: []
  }
};

// Function to recursively merge template with existing week data
function normalizeWeek(template, weekData) {
  const normalized = { ...template };

  for (const key in template) {
    if (weekData[key] !== undefined) {
      if (typeof template[key] === 'object' && !Array.isArray(template[key]) && template[key] !== null) {
        normalized[key] = normalizeWeek(template[key], weekData[key]);
      } else {
        normalized[key] = weekData[key];
      }
    }
    // otherwise leave template placeholder
  }

  return normalized;
}

// Process all week JSON files
fs.readdirSync(inputDir).forEach(file => {
  if (file.endsWith('.json')) {
    const filePath = path.join(inputDir, file);
    const weekData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const normalizedWeek = normalizeWeek(template, weekData);

    // Write normalized JSON
    const weekNumber = normalizedWeek.week || path.parse(file).name.match(/\d+/)[0];
    const outputFile = path.join(outputDir, `week${weekNumber}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(normalizedWeek, null, 2), 'utf8');
    console.log(`Normalized week ${weekNumber} -> ${outputFile}`);
  }
});

console.log('All weeks normalized successfully!');
