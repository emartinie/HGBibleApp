let questions = [];
let currentIndex = 0;

async function initTrivia(){
  await loadQuestions();
}

// Load questions from JSON
async function loadQuestions() {
  try {
    const res = await fetch("bible_questions_with_hints.json");
    questions = await res.json();

    if (!questions.length) {
      document.getElementById("questionsCard").innerText = "No questions found.";
      return;
    }

    showQuestion();

  } catch (err) {
    console.error(err);
    document.getElementById("questionsCard").innerText = "Failed to load questions.";
  }
}

function showQuestion() {
  currentIndex = Math.floor(Math.random() * questions.length);
  const q = questions[currentIndex];

  const card = document.getElementById("questionsCard");
  const hintCard = document.getElementById("hintCard");
  const answerCard = document.getElementById("answerCard");
  const answerText = document.getElementById("answerText");

  card.style.transform = "scale(0.95)";
  card.style.opacity = 0;

  setTimeout(() => {
    card.innerHTML = `<div><strong>Q${q.id}:</strong> ${q.question}</div>`;
    card.style.transform = "scale(1)";
    card.style.opacity = 1;

    hintText.innerText = q.hint;
    hintCard.classList.add("hidden");

    answerText.innerText = q.answer;
    answerCard.classList.add("hidden");

  }, 150);
}

// 🔥 RUN IT IMMEDIATELY
initTrivia();

        document.getElementById("nextBtn").addEventListener("click", () => {
          if (currentIndex < questions.length - 1) currentIndex++;
          showQuestion();
        });
        document.getElementById("prevBtn").addEventListener("click", () => {
          if (currentIndex > 0) currentIndex--;
          showQuestion();
        });
        document.getElementById("revealBtn").addEventListener("click", () => {
          const answerCard = document.getElementById("answerCard");
          answerCard.classList.toggle("hidden");
        });
        document.getElementById("hintBtn").addEventListener("click", () => {
          const hintCard = document.getElementById("hintCard");
          hintCard.classList.toggle("hidden");
        });




      (function () {
        // ---------- CONFIG: change paths if needed ----------
        const audioFiles = {
          up: 'assets/sounds/score-down.mp3',    // replace with your real path
          down: 'assets/sounds/score-up.mp3' // replace with your real path
        };

        // ---------- Load audio objects safely ----------
        const sounds = {};
        for (const k of Object.keys(audioFiles)) {
          try {
            const a = new Audio();
            a.src = audioFiles[k];
            a.preload = 'auto';
            a.load();
            sounds[k] = a;
          } catch (e) {
            console.warn('Audio load failed for', k, e);
          }
        }


        // ---------- playSound: try file then fallback ----------
        function playSound(name) {
          const a = sounds[name];
          if (a && a.src) {
            const p = a.play();
            if (p && typeof p.then === 'function') {
              p.catch(err => {
                // autoplay blocked or file problem -> fallback beep
                console.warn('Audio play failed, fallback to beep:', err);
                beepFallback(name === 'up' ? 880 : 440, 0.12);
              });
            }
            return;
          }
          // no audio file -> fallback
          beepFallback(name === 'up' ? 880 : 440, 0.12);
        }

        // ---------- unlock audio on first user gesture (mobile) ----------
        function unlockAudio() {
          // resume WebAudio context if created
          if (window.__beepAudioCtx && window.__beepAudioCtx.state === 'suspended') {
            window.__beepAudioCtx.resume().catch(() => { });
          }
          // try to play & pause each HTMLAudio to unlock
          Object.values(sounds).forEach(a => {
            if (!a) return;
            a.muted = true;
            a.play().then(() => { a.pause(); a.muted = false; }).catch(() => { a.muted = false; });
          });
          document.removeEventListener('pointerdown', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
        }
        document.addEventListener('pointerdown', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });




        // ---------- Attach handlers safely (no crash if element missing) ----------
        function button(id, cb) {
          const el = document.getElementById(id);
          if (!el) {
            console.warn('Button not found:', id);
            return;
          }
          el.addEventListener('click', cb);
          // also support keyboard activation for accessibility
          el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cb(e); } });
        }



        // initial render
      })();

      (function () {
        const board = document.getElementById("sb-board");
        const addBtn = document.getElementById("sb-add-team");
        if (!board || !addBtn) return;

        let teams = [
          { name: "Team A", score: 0 },
          { name: "Team B", score: 0 }
        ];

        function render() {
          board.innerHTML = "";

          teams.forEach((team, index) => {
            const card = document.createElement("div");
            card.className =
              "bg-slate-800 p-4 rounded-xl shadow-md w-40 text-center";

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
        <button class="text-xs text-red-400 hover:text-red-300">Remove</button>
      `;

            card.querySelector("input").oninput = e => team.name = e.target.value;
            card.querySelector(".btn-up").onclick = () => { team.score++; render(); };
            card.querySelector(".btn-down").onclick = () => { team.score--; render(); };
            card.querySelector("button.text-red-400").onclick = () => {
              teams.splice(index, 1);
              render();
            };

            board.appendChild(card);
          });
        }

        addBtn.onclick = () => {
          teams.push({
            name: `Team ${String.fromCharCode(65 + teams.length)}`,
            score: 0
          });
          render();
        };

        render();
      })();
