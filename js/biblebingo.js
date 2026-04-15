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
    renderScoreboard();
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
    speakCall(label);
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

    bindScoreboardUI();
  }

    // ----------------------------
  // SCOREBOARD
  // ----------------------------
  let teams = [
    { name: "Team A", score: 0 },
    { name: "Team B", score: 0 }
  ];

  function renderScoreboard() {
    const board = document.getElementById("bingo-board");
    if (!board) return;

    board.innerHTML = "";

    teams.forEach((team, index) => {
      const card = document.createElement("div");
      card.className = "bg-slate-800 p-4 rounded-xl shadow-md w-40 text-center";

      card.innerHTML = `
        <input
          class="w-full mb-2 bg-slate-900 text-white text-center rounded px-2 py-1 font-bold"
          value="${team.name}"
        />
        <div class="text-3xl font-extrabold text-white mb-2">${team.score}</div>
        <div class="flex justify-center gap-2 mb-2">
          <button class="btn-up px-2 py-1 rounded bg-emerald-600 text-white">+1</button>
          <button class="btn-down px-2 py-1 rounded bg-red-600 text-white">-1</button>
        </div>
        <button class="btn-remove text-xs text-red-400 hover:text-red-300">Remove</button>
      `;

      card.querySelector("input").oninput = (e) => {
        team.name = e.target.value;
      };

      card.querySelector(".btn-up").onclick = () => {
        team.score++;
        renderScoreboard();
      };

      card.querySelector(".btn-down").onclick = () => {
        team.score--;
        renderScoreboard();
      };

      card.querySelector(".btn-remove").onclick = () => {
        teams.splice(index, 1);
        renderScoreboard();
      };

      board.appendChild(card);
    });
  }

  function bindScoreboardUI() {
    const addBtn = document.getElementById("bingo-add-team");
    if (!addBtn) return;

    addBtn.onclick = () => {
      teams.push({
        name: `Team ${String.fromCharCode(65 + teams.length)}`,
        score: 0
      });
      renderScoreboard();
    };
  }

  // ----------------------------
  // PUBLIC DEBUG (optional)
  // ----------------------------
  window.biblebingo = {
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
 // document.addEventListener("DOMContentLoaded", () => {
   // init();
  //  bindUI();
  //});
init();
bindUI();
})();
