// --------- CONFIG ---------
const START_DATE = new Date("2025-01-05T00:00:00Z"); // Week 1 start date
const MAX_WEEKS = 52;

// --------- GLOBAL STATE ---------
let currentWeek = getCurrentWeekNumber();

// UI Elements
const weekInfoEl = document.getElementById("weekInfo");
const prevWeekBtn = document.getElementById("prevWeekBtn");
const nextWeekBtn = document.getElementById("nextWeekBtn");

// --------- HELPERS ---------
function getCurrentWeekNumber() {
  const today = new Date();
  const diffMs = today - START_DATE;
  if (diffMs < 0) return 1;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1;
}

// --------- BUTTON STATE ---------
function updateButtons() {
  prevWeekBtn.disabled = currentWeek <= 1;
  nextWeekBtn.disabled = currentWeek >= MAX_WEEKS;
}

// --------- LOAD AND RENDER WEEK DATA ---------
async function loadWeek(weekNum) {
  try {
    const response = await fetch(`./weeks/week${weekNum}.json`);
    if (!response.ok) throw new Error(`Week data not found: week${weekNum}.json`);
    const data = await response.json();
    data.week = weekNum; // fallback if missing
    renderWeek(data);
  } catch (err) {
    weekInfoEl.textContent = `Error loading week ${weekNum}: ${err.message}`;
    console.error(err);
  }
}

function renderWeek(data) {
  // Week info
  weekInfoEl.textContent = `Week ${data.week}: ${data.english || ''} (${data.transliteration || ''})`;

  // Study Intro
  document.getElementById("studyIntroContent").innerHTML = data.intro || "(No intro available)";

  // Audio Scriptures
  const audioContainer = document.getElementById("audioContent");
  audioContainer.innerHTML = "";
  if (data.audio && data.audio.length) {
    data.audio.forEach(a => {
      const audioEl = document.createElement("audio");
      audioEl.controls = true;
      audioEl.src = a.url;
      audioEl.title = a.title;
      audioContainer.appendChild(audioEl);
      audioContainer.appendChild(document.createElement("br"));
    });
  } else audioContainer.textContent = "(No audio available)";

  // Scriptures
  const scriptures = data.scriptures || {};
  let scripturesHtml = "";
  if (scriptures.themeVerse) scripturesHtml += `<p><strong>Theme Verse:</strong> ${scriptures.themeVerse}</p>`;
  if (scriptures.memoryVerse) scripturesHtml += `<p><strong>Memory Verse:</strong> ${scriptures.memoryVerse}</p>`;
  ["torah", "prophets", "gospels", "letters"].forEach(cat => {
    if (scriptures[cat] && scriptures[cat].length) {
      scripturesHtml += `<h4>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h4><ul>`;
      scriptures[cat].forEach(ref => {
        scripturesHtml += `<li><a href="${ref.link || "#"}">${ref.ref}</a></li>`;
      });
      scripturesHtml += "</ul>";
    }
  });
  document.getElementById("scripturesContent").innerHTML = scripturesHtml || "(No scriptures available)";

  // Commentary
  document.getElementById("commentaryContent").innerHTML = data.commentary || "(No commentary available)";

  // Deeper Learning
  document.getElementById("deeperLearningContent").innerHTML = data.deeperLearning || "(No deeper learning available)";

  // Aleph Tavs
  document.getElementById("alephTavsContent").innerHTML = data.hiddenAlephTavs || "(No Aleph Tav notes available)";

  // Printouts
  const printoutsContainer = document.getElementById("printoutsContent");
  printoutsContainer.innerHTML = "";
  if (data.printouts && data.printouts.length) {
    data.printouts.forEach(item => {
      const link = document.createElement("a");
      link.href = item.url;
      link.textContent = item.title;
      link.target = "_blank";
      printoutsContainer.appendChild(link);
      printoutsContainer.appendChild(document.createElement("br"));
    });
  } else printoutsContainer.textContent = "(No printouts available)";

  // Kids Corner
  const kidsContainer = document.getElementById("kidsCornerContent");
  kidsContainer.innerHTML = "";
  if (data.kidsCorner && data.kidsCorner.length) {
    data.kidsCorner.forEach(item => {
      const link = document.createElement("a");
      link.href = item.url;
      link.textContent = item.title;
      link.target = "_blank";
      kidsContainer.appendChild(link);
      kidsContainer.appendChild(document.createElement("br"));
    });
  } else kidsContainer.textContent = "(No kids corner content)";

  // Words of the Week
  const wordsContainer = document.getElementById("wordsOfTheWeekContent");
  wordsContainer.innerHTML = "";
  if (data.wordsOfTheWeek && data.wordsOfTheWeek.length) {
    data.wordsOfTheWeek.forEach(word => {
      const p = document.createElement("p");
      p.textContent = `${word.hebrew || ''} / ${word.greek || ''} — ${word.meaning || ''}`;
      wordsContainer.appendChild(p);
    });
  } else wordsContainer.textContent = "(No words of the week)";
}

// --------- BUTTON HANDLERS ---------
prevWeekBtn.addEventListener("click", () => {
  if (currentWeek > 1) {
    currentWeek--;
    updateButtons();
    loadWeek(currentWeek);
  }
});

nextWeekBtn.addEventListener("click", () => {
  if (currentWeek < MAX_WEEKS) {
    currentWeek++;
    updateButtons();
    loadWeek(currentWeek);
  }
});

// --------- INITIALIZE ---------
updateButtons();
loadWeek(currentWeek);

// --------- Psalms Table Builder ---------
const psalmsData = [
  { day: 'Sunday', url: 'http://audio.esvbible.org/hw/19001001-19029011.mp3', passage: 'Chapters 1-29', link: 'https://www.biblegateway.com/passage/?search=psalm+1-29&version=TLV' },
  { day: 'Monday', url: 'http://audio.esvbible.org/hw/19030001-19050023.mp3', passage: 'Chapters 30-50', link: 'https://www.biblegateway.com/passage/?search=psalm+30-50&version=TLV' },
  { day: 'Tuesday', url: 'http://audio.esvbible.org/hw/19051001-19072020.mp3', passage: 'Chapters 51-72', link: 'https://www.biblegateway.com/passage/?search=psalm+51-72&version=TLV' },
  { day: 'Wednesday', url: 'http://audio.esvbible.org/hw/19063001-19089052.mp3', passage: 'Chapters 73-89', link: 'https://www.biblegateway.com/passage/?search=psalm+73-89&version=TLV' },
  { day: 'Thursday', url: 'http://audio.esvbible.org/hw/19090001-19106048.mp3', passage: 'Chapters 90-106', link: 'https://www.biblegateway.com/passage/?search=psalm+90-106&version=TLV' },
  { day: 'Friday', url: 'http://audio.esvbible.org/hw/19107001-19119176.mp3', passage: 'Chapters 107-119', link: 'https://www.biblegateway.com/passage/?search=psalm+107-119&version=TLV' },
  { day: 'Saturday', url: 'http://audio.esvbible.org/hw/19120001-19150006.mp3', passage: 'Chapters 120-150', link: 'https://www.biblegateway.com/passage/?search=psalm+120-150&version=TLV' },
  { day: 'ALL', url: 'http://audio.esvbible.org/hw/19001001-19150006.mp3', passage: 'Chapters 1-150', link: 'https://www.biblegateway.com/passage/?search=psalm+1-150&version=TLV' }
];

function buildPsalmsTable() {
  const table = document.getElementById('psalms-table');
  table.innerHTML = '';
  for (let i = 0; i < psalmsData.length; i += 2) {
    const row = document.createElement('tr');
    const cell1 = document.createElement('td');
    cell1.style.padding = '10px'; cell1.style.border = '1px solid #ccc';
    cell1.innerHTML = createPsalmCellHTML(psalmsData[i]);
    row.appendChild(cell1);

    const cell2 = document.createElement('td');
    cell2.style.padding = '10px'; cell2.style.border = '1px solid #ccc';
    if (i + 1 < psalmsData.length) cell2.innerHTML = createPsalmCellHTML(psalmsData[i+1]);
    else cell2.innerHTML = '<strong>All</strong>';
    row.appendChild(cell2);

    table.appendChild(row);
  }
}

function createPsalmCellHTML(psalm) {
  return `<strong>${psalm.day} - </strong>
          <audio controls preload="none" style="vertical-align: middle;">
            <source src="${psalm.url}" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          &nbsp;<a href="${psalm.link}" target="_blank" rel="noopener noreferrer">${psalm.passage}</a>`;
}

buildPsalmsTable();
