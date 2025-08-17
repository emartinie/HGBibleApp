const fs = require('fs');
const path = require('path');

// Choose which week to test
const weekNumber = 1;
const weekFile = path.join(__dirname, 'weeks', `week${weekNumber}.json`);

fs.readFile(weekFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading week file:', err);
    return;
  }

  try {
    const weekData = JSON.parse(data);

    console.log('Week title:', weekData.title);

    if (weekData.sections) {
      console.log('Sections found:', Object.keys(weekData.sections));
    } else {
      console.log('No sections found');
    }
  } catch (parseErr) {
    console.error('Error parsing JSON:', parseErr);
  }
});
