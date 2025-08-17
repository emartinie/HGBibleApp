// normalizeWeeksConfig.js

const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'weeks');
const outputDir = path.join(__dirname, 'weeks_normalized');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// --- CONFIG --- 
// Define all sections/subsections you want generated
const sectionsConfig = [
  'audio_playlist',
  'chapter_outlines.Torah',
  'chapter_outlines.Prophets',
  'chapter_outlines.Writings',
  'chapter_outlines.Gospels',
  'chapter_outlines.Letters',
  'chapter_outlines.Revelation',
  'commentary.quote',
  'commentary.content',
  'deeper_learning',
  'aleph_tav',
  'kids_study.videos',
  'kids_study.pdf',
  'language_learning.hebrew.word',
  'language_learning.hebrew.text',
  'language_learning.hebrew.meaning',
  'language_learning.greek.word',
  'language_learning.greek.text',
  'language_learning.greek.meaning',
  'language_learning.audio',
  'psalms_plan'
];

// Function to set a value in object by path string
function setPath(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  curr[parts[parts.length - 1]] = value;
}

// Process all week JSONs
fs.readdirSync(inputDir).forEach(file => {
  if (!file.endsWith('.json')) return;
  
  const filePath = path.join(inputDir, file);
  const weekData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const normalized = {
    english: weekData.english || "",
    hebrew: weekData.hebrew || "",
    transliteration: weekData.transliteration || "",
    week: weekData.week || 0,
    title: weekData.title || "",
    theme_verse: weekData.theme_verse || { text: "", reference: "" },
    intro: weekData.intro || { summary: "", instructions: "" },
    sections: {}
  };
  
  // Apply config: if data exists use it, else create empty
  sectionsConfig.forEach(sectionPath => {
    const pathParts = sectionPath.split('.');
    let existing = weekData.sections;
    for (const part of pathParts) {
      if (existing && existing[part] !== undefined) {
        existing = existing[part];
      } else {
        existing = undefined;
        break;
      }
    }
    
    // Decide placeholder: array or object or empty string
    let placeholder = [];
    if (sectionPath.includes('.')) placeholder = [];
    if (typeof existing === 'string') placeholder = "";
    if (typeof existing === 'object' && !Array.isArray(existing) && existing !== null) placeholder = {};
    
    setPath(normalized.sections, sectionPath, existing !== undefined ? existing : placeholder);
  });
  
  // Write normalized file
  const weekNumber = normalized.week || path.parse(file).name.match(/\d+/)[0];
  const outputFile = path.join(outputDir, `week${weekNumber}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(normalized, null, 2), 'utf8');
  console.log(`Normalized week ${weekNumber}`);
});

console.log('All 52 weeks generated with config!');
