// Bible-themed backgrounds
const bibleBackgrounds = [
  "images/Elohim-God-Name-in-Hebrew-Torah-and-Bible.jpg",
  "images/biblescroll.jpg",
  "images/ThanksgivingPsalm118.jpg",
  "images/ALI-Web-Greek-Header_Greek-Header.png"
];

// Sections with rotating backgrounds
const rotatingSections = document.querySelectorAll('section.bg-rotating');

// Track current index per section
const indices = Array(rotatingSections.length).fill(0);

// Function to update backgrounds asynchronously
function updateBackgrounds() {
  const usedIndices = new Set();
  rotatingSections.forEach((section, i) => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * bibleBackgrounds.length);
    } while (usedIndices.has(nextIndex));
    usedIndices.add(nextIndex);
    indices[i] = nextIndex;
    section.style.backgroundImage = `url(${bibleBackgrounds[nextIndex]})`;
  });
}

// Initial set
rotatingSections.forEach((section, i) => {
  section.style.backgroundImage = `url(${bibleBackgrounds[i % bibleBackgrounds.length]})`;
});

// Change backgrounds every 20 seconds
setInterval(updateBackgrounds, 20000);
