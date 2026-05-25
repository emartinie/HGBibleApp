(function () {
  const DATA_PATH = "data/quizzes/nt_questions.json";

  // ---------- STATE ----------
  let questions = [];
  let filteredQuestions = [];
  let currentIndex = 0;

  let score = 0;
  let viewed = 0;

  let activeSet = null;

  // ---------- ELEMENT CACHE ----------
  const els = {
    categoryList: document.getElementById("quizCategoryList"),
    question: document.getElementById("quizQuestion"),
    answers: document.getElementById("quizAnswers"),
    scripture: document.getElementById("quizScripture"),
    progress: document.getElementById("quizProgressFill"),
    score: document.getElementById("quizScore"),
    count: document.getElementById("quizCount"),

    prevBtn: document.querySelector(".prev-card-btn"),
    nextBtn: document.querySelector(".next-card-btn"),
  };

  // ---------- INIT ----------
  init();

  async function init() {
    await loadData();
    buildQuizSets();
    bindNav();
    selectDefaultSet();
  }

  // ---------- LOAD DATA ----------
  async function loadData() {
    try {
      const res = await fetch(DATA_PATH);
      questions = await res.json();

      if (!Array.isArray(questions)) {
        throw new Error("Quiz JSON is not an array");
      }
    } catch (err) {
      console.error(err);
      if (els.categoryList) {
        els.categoryList.innerHTML = "Failed to load quiz data.";
      }
    }
  }

  // ---------- BUILD QUIZ SETS ----------
  function buildQuizSets() {
    if (!els.categoryList) return;

    const sets = {};

    questions.forEach(q => {
      const setName = q.source || "unknown";
      if (!sets[setName]) sets[setName] = [];
      sets[setName].push(q);
    });

    els.categoryList.innerHTML = "";

    Object.keys(sets).forEach(setName => {
      const btn = document.createElement("button");
      btn.className = "quiz-set-btn";
      btn.textContent = `${setName} (${sets[setName].length})`;

      btn.onclick = () => {
        activeSet = setName;
        filteredQuestions = sets[setName];
        currentIndex = 0;

        resetProgress();
        renderQuestion();
      };

      els.categoryList.appendChild(btn);
    });
  }

  // ---------- DEFAULT SET ----------
  function selectDefaultSet() {
    const firstSet = questions[0]?.source;
    if (!firstSet) return;

    const grouped = groupBySource();
    activeSet = firstSet;
    filteredQuestions = grouped[firstSet] || [];

    renderQuestion();
  }

  function groupBySource() {
    const map = {};
    questions.forEach(q => {
      const s = q.source || "unknown";
      if (!map[s]) map[s] = [];
      map[s].push(q);
    });
    return map;
  }

  // ---------- QUESTION RENDER ----------
  function renderQuestion() {
    if (!filteredQuestions.length) return;

    const q = filteredQuestions[currentIndex];

    if (els.question) {
      els.question.innerHTML = `
        <div class="text-lg font-semibold">
          ${escape(q.question || "No question")}
        </div>
      `;
    }

    if (els.answers) {
      els.answers.innerHTML = `
        <div class="mt-2 text-slate-300">
          ${q.answer ? escape(q.answer) : "No answer provided"}
        </div>

        <button id="revealBtn" class="mt-3 px-3 py-1 bg-cyan-700 rounded text-white text-sm">
          Reveal / Toggle
        </button>
      `;
    }

    if (els.scripture) {
      els.scripture.innerHTML = `
        <div class="text-sm text-slate-400">
          Source: ${escape(q.source || "unknown")}
        </div>
      `;
    }

    updateProgress();
    bindReveal();
  }

  // ---------- NAV ----------
  function bindNav() {
    if (els.prevBtn) {
      els.prevBtn.onclick = () => {
        if (currentIndex > 0) {
          currentIndex--;
          renderQuestion();
        }
      };
    }

    if (els.nextBtn) {
      els.nextBtn.onclick = () => {
        if (currentIndex < filteredQuestions.length - 1) {
          currentIndex++;
          viewed++;
          renderQuestion();
        }
      };
    }
  }

  function bindReveal() {
    const btn = document.getElementById("revealBtn");
    if (!btn) return;

    btn.onclick = () => {
      const el = els.answers;
      if (!el) return;

      el.classList.toggle("hidden");

      if (!el.classList.contains("hidden")) {
        score++; // simplistic scoring hook
        updateProgress();
      }
    };
  }

  // ---------- PROGRESS ----------
  function resetProgress() {
    score = 0;
    viewed = 0;
    updateProgress();
  }

  function updateProgress() {
    const total = filteredQuestions.length || 1;
    const percent = Math.round((currentIndex / total) * 100);

    if (els.progress) {
      els.progress.style.width = `${percent}%`;
    }

    if (els.score) {
      els.score.textContent = `Score: ${score}`;
    }

    if (els.count) {
      els.count.textContent = `Question ${currentIndex + 1} / ${total}`;
    }
  }

  // ---------- UTIL ----------
  function escape(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
})();
