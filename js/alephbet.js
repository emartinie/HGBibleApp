const ALEPHBET = [
  { letter: "א", name: "Aleph", sound: "Silent / A" },
  { letter: "ב", name: "Bet", sound: "B / V" },
  { letter: "ג", name: "Gimel", sound: "G" },
  { letter: "ד", name: "Dalet", sound: "D" },
  { letter: "ה", name: "He", sound: "H" },
  { letter: "ו", name: "Vav", sound: "V / O / U" },
  { letter: "ז", name: "Zayin", sound: "Z" },
  { letter: "ח", name: "Chet", sound: "Kh" },
  { letter: "ט", name: "Tet", sound: "T" },
  { letter: "י", name: "Yod", sound: "Y" },
  { letter: "כ/ך", name: "Kaf", sound: "K / Kh" },
  { letter: "ל", name: "Lamed", sound: "L" },
  { letter: "מ/ם", name: "Mem", sound: "M" },
  { letter: "נ/ן", name: "Nun", sound: "N" },
  { letter: "ס", name: "Samekh", sound: "S" },
  { letter: "ע", name: "Ayin", sound: "Silent / NG" },
  { letter: "פ/ף", name: "Pe", sound: "P / F" },
  { letter: "צ/ץ", name: "Tsadi", sound: "Ts" },
  { letter: "ק", name: "Qof", sound: "K" },
  { letter: "ר", name: "Resh", sound: "R" },
  { letter: "ש", name: "Shin", sound: "Sh / S" },
  { letter: "ת", name: "Tav", sound: "T" }
];

// Normalize any “multi form” Hebrew key → base character
function baseHebrewChar(letter) {
  return letter?.split("/")[0]?.trim() || letter;
}

const paleoMap = {
  "א": "𐤀",
  "ב": "𐤁",
  "ג": "𐤂",
  "ד": "𐤃",
  "ה": "𐤄",
  "ו": "𐤅",
  "ז": "𐤆",
  "ח": "𐤇",
  "ט": "𐤈",
  "י": "𐤉",
  "כ": "𐤊",
  "ל": "𐤋",
  "מ": "𐤌",
  "נ": "𐤍",
  "ס": "𐤎",
  "ע": "𐤏",
  "פ": "𐤐",
  "צ": "𐤑",
  "ק": "𐤒",
  "ר": "𐤓",
  "ש": "𐤔",
  "ת": "𐤕"
};

let currentMode = "modern";

// SAFE STATE HOLDER (THIS FIXES EVERYTHING)
let currentLetter = "א";

function setAlephScript(mode) {
  currentMode = mode;

  document.querySelectorAll(".hebrew, .aleph-letter, #alephLetter")
    .forEach(el => {
      const raw = el.dataset.letter || el.textContent;
      const base = baseHebrewChar(raw);

      if (!el.dataset.letter) {
        el.dataset.letter = raw;
      }

      el.textContent =
        mode === "paleo"
          ? (paleoMap[base] || base)
          : raw;
    });
}

// MODE BUTTONS
document.getElementById("scriptModernBtn")?.addEventListener("click", () => {
  setAlephScript("modern");
});

document.getElementById("scriptPaleoBtn")?.addEventListener("click", () => {
  setAlephScript("paleo");
});

(function () {
  let index = 0;
  let audio = new Audio();

  const letterEl = document.getElementById("alephLetter");
  const nameEl = document.getElementById("alephName");
  const soundEl = document.getElementById("alephSound");

  function render() {
    const l = ALEPHBET[index];

    const base = baseHebrewChar(l.letter);

    currentLetter = base;

    letterEl.textContent =
      currentMode === "paleo"
        ? (paleoMap[base] || base)
        : l.letter;

    letterEl.dataset.letter = l.letter;

    nameEl.textContent = l.name;
    soundEl.textContent = l.sound;

    audio.pause();
  }

  document.getElementById("alephPrev").onclick = () => {
    index = (index - 1 + ALEPHBET.length) % ALEPHBET.length;
    render();
  };

  document.getElementById("alephNext").onclick = () => {
    index = (index + 1) % ALEPHBET.length;
    render();
  };

  render();

  // FULL SONG
  document.getElementById("alephAudioBtn")?.addEventListener("click", () => {
    audio.src = "assets/sounds/heart-and-soul.mp3";
    audio.play();
  });

  // LETTER AUDIO (FIXED SAFE FALLBACK)
  document.getElementById("alephPlay")?.addEventListener("click", () => {
    const safe = currentLetter.toLowerCase();
    audio.src = `assets/sounds/letters/${safe}.mp3`;
    audio.play();
  });

})();
