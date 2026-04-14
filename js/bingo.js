let calledHistory = [];

(function () {
  // ----------------------------
  // CONFIG
  // ----------------------------
  const AUTO_CALL_INTERVAL = 10000; // ms

  const COLUMNS = [
    { letter: "B", min: 1,  max: 15 },
    { letter: "I•", min: 16, max: 30 },
    { letter: "B", min: 31, max: 45 },
    { letter: "L", min: 46, max: 60 },
    { letter: "E", min: 61, max: 75 }
  ];

  // ----------------------------
  // STATE
  // ----------------------------
  let pool = [];
  let called = [];
  let autoTimer = null;

  // ----------------------------
  // INIT
  // ----------------------------
  function buildPool() {
    pool = [];
    COLUMNS.forEach(col => {
      for (let n = col.min; n <= col.max; n++) {
        pool.push({ letter: col.letter, number: n });
      }
    });
  }

  function init() {
    buildPool();
    updateDisplay("Ready");
  }

  function updateCurrentCall(label) {
  const el = document.getElementById("bingoCurrent");
  if (el) el.textContent = label;
}

function updateHistory(label) {
  if (calledHistory.includes(label)) return;

  calledHistory.push(label);

  const history = document.getElementById("bingoHistory");
  if (!history) return;

  const chip = document.createElement("span");
  chip.textContent = label;
  chip.className =
    "px-3 py-1 rounded-full bg-slate-800 text-white font-semibold";

  history.appendChild(chip);
}
  // ----------------------------
  // CORE LOGIC
  // ----------------------------
  function callNext() {
    if (pool.length === 0) {
      updateDisplay("All Called");
      stopAuto();
      return null;
    }

    const index = Math.floor(Math.random() * pool.length);
    const draw = pool.splice(index, 1)[0];
    called.push(draw);

    const label = `${draw.letter} ${draw.number}`;
    updateDisplay(label);
    speakCall(label)
    updateCurrentCall(label);
updateHistory(label);
    
    // Broadcast event (important)
    window.dispatchEvent(new CustomEvent("bingo:call", {
      detail: {
        letter: draw.letter,
        number: draw.number,
        called: [...called]
      }
    }));

    return draw;
  }

   function speakCall(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.75;   // slower, bingo-style
  utter.pitch = 0.75;
  speechSynthesis.cancel(); // stop overlap
  speechSynthesis.speak(utter);
 }
  // ----------------------------
  // AUTO CALL
  // ----------------------------
  function startAuto() {
    if (autoTimer) return;
    autoTimer = setInterval(callNext, AUTO_CALL_INTERVAL);
  }

  function stopAuto() {
    if (!autoTimer) return;
    clearInterval(autoTimer);
    autoTimer = null;
  }

  function toggleAuto() {
    autoTimer ? stopAuto() : startAuto();
  }

  // ----------------------------
  // UI
  // ----------------------------
  function updateDisplay(text) {
    const el = document.getElementById("bingoDisplay");
    if (el) el.textContent = text;
  }

   function resetGame() {
  calledHistory = [];
  document.getElementById("bingoCurrent").textContent = "—";
  document.getElementById("bingoHistory").innerHTML = "";
}

  function bindUI() {
    const nextBtn = document.getElementById("callNextBtn");
    const autoBtn = document.getElementById("autoCallBtn");

    if (nextBtn) nextBtn.addEventListener("click", callNext);
    if (autoBtn) autoBtn.addEventListener("click", toggleAuto);
  }

  // ----------------------------
  // PUBLIC DEBUG (optional)
  // ----------------------------
  window.BibleBingo = {
    callNext,
    reset: () => {
      stopAuto();
      buildPool();
      called = [];
      updateDisplay("Ready");
    },
    getState: () => ({ pool, called })
  };

  // ----------------------------
  // BOOT
  // ----------------------------
  document.addEventListener("DOMContentLoaded", () => {
    init();
    bindUI();
  });

})();
