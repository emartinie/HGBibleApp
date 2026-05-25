(function () {
  const DATA_PATH = "data/quizzes/nt_questions.json";

  const els = {
    categoryList: document.getElementById("quizCategoryList"),
    question: document.getElementById("quizQuestion"),
    answers: document.getElementById("quizAnswers"),
    meta: document.getElementById("quizMeta"),
    scripture: document.getElementById("quizScripture"),
    progressFill: document.getElementById("quizProgressFill"),
    score: document.getElementById("quizScore"),
    count: document.getElementById("quizCount"),
    prev: document.querySelector(".prev-card-btn"),
    next: document.querySelector(".next-card-btn"),
  };

  let questions = [];
  let index = 0;
  let correct = 0;

  // ---------------- LOAD ----------------
  async function load() {
    try {
      const res = await fetch(DATA_PATH);
      questions = await res.json();

      if (!questions.length) {
        els.categoryList.innerText = "No quiz data found.";
        return;
      }

      renderQuestion();
      renderProgress();
      bindNav();

    } catch (e) {
      console.error(e);
      els.categoryList.innerText = "Failed to load quiz data.";
    }
  }

  // ---------------- RENDER QUESTION ----------------
  function renderQuestion() {
    const q = questions[index];

    if (!q) return;

    els.question.innerHTML = `
      <div class="text-lg font-semibold">
        Q${q.id}: ${q.question || "Missing question"}
      </div>
    `;

    els.answers.innerHTML = `
      <div class="mt-2 text-slate-300">
        ${q.answer ? q.answer : "<em>No answer provided</em>"}
      </div>

      <button id="revealBtn" class="mt-3 px-3 py-1 bg-slate-700 rounded">
        Reveal / Toggle
      </button>
    `;

    els.meta.innerHTML = `
      <div class="text-xs text-slate-500 mt-2">
        Source: ${q.source || "unknown"}
      </div>
    `;

    els.scripture.innerHTML = `
      <div class="text-sm text-slate-300 leading-relaxed">
        ${q.scripture || "No scripture context available."}
      </div>
    `;

    const btn = document.getElementById("revealBtn");
    if (btn) {
      btn.onclick = () => {
        els.answers.classList.toggle("hidden");
      };
    }
  }

  // ---------------- PROGRESS ----------------
  function renderProgress() {
    const pct = ((index + 1) / questions.length) * 100;

    if (els.progressFill) {
      els.progressFill.style.width = pct + "%";
    }

    if (els.score) {
      els.score.innerText = `Correct: ${correct}`;
    }

    if (els.count) {
      els.count.innerText = `Question ${index + 1} / ${questions.length}`;
    }
  }

  // ---------------- NAV ----------------
  function bindNav() {
    if (els.prev) {
      els.prev.onclick = () => {
        index = Math.max(0, index - 1);
        renderQuestion();
        renderProgress();
      };
    }

    if (els.next) {
      els.next.onclick = () => {
        index = Math.min(questions.length - 1, index + 1);
        renderQuestion();
        renderProgress();
      };
    }
  }

  // ---------------- INIT ----------------
  load();
})();
