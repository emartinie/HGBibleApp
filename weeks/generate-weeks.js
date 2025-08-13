// generate-weeks.js
const fs = require("fs");
const path = require("path");

const template = fs.readFileSync("weeks/week7.json", "utf8");

for (let i = 1; i <= 52; i++) {
  if (i === 7) continue; // Skip week7 because it already exists
  const filePath = path.join("weeks", `week${i}.json`);
  const newJson = JSON.parse(template);
  newJson.week = i;
  newJson.title = `Placeholder Title for Week ${i}`;
  newJson.theme_verse.reference = `Reference ${i}`;
  newJson.theme_verse.text = `Placeholder verse text for week ${i}...`;
  fs.writeFileSync(filePath, JSON.stringify(newJson, null, 2));
}

console.log("✅ All week files created!");
