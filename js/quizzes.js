(function () {
  const DATA_PATH = "data/quizzes/nt_questions.json";

  const els = {
    categoryList: document.getElementById("quizCategoryList"),
    question: document.getElementById("quizQuestion"),
    answers: document.getElementById("quizAnswers"),
    scripture: document.getElementById("quizScripture"),
    progressFill: document.getElementById("quizProgressFill"),
    score: document.getElementById("quizScore"),
    count: document.getElementById("quizCount"),

    prevBtn: document.querySelector(".prev-card-btn"),
    nextBtn: document.querySelector(".next-card-btn"),
  };

  let questions = [];
  let filtered = [];
  let currentIndex = 0;
  let score = 0;
  let currentSet = null;

  // ---------------------------
  // INIT
  // ---------------------------
  async function init() {
    await loadData();
    buildQuizSets();
    bindNav();
    showQuestion();
  }

  // ---------------------------
  // LOAD DATA
  // ---------------------------
  async function loadData() {
    try {
      const res = await fetch(DATA_PATH);
      questions = await res.json();
    } catch (e) {
      console.error(e);
      els.categoryList.innerText = "Failed to load quiz data.";
    }
  }

  // ---------------------------
  // GROUP QUIZ SETS
  // ---------------------------
  function buildQuizSets() {
    const groups = {};

    for (const q of questions) {
      if (!groups[q.source]) groups[q.source] = [];
      groups[q.source].push(q);
    }

    els.categoryList.innerHTML = "";

    Object.entries(groups).forEach(([source, items]) => {
      const btn = document.createElement("button");
      btn.className = "block w-full text-left p-2 border-b border-slate-700 hover:bg-slate-800/40";
      btn.innerText = `${source} (${items.length})`;

      btn.onclick = () => {
        currentSet = source;
        filtered = items;
        currentIndex = 0;
        score = 0;
        showQuestion();
      };

      els.categoryList.appendChild(btn);
    });

    // default load first set
    const first = Object.entries(groups)[0];
    if (first) {
      currentSet = first[0];
      filtered = first[1];
    }
  }

  // ---------------------------
  // RENDER QUESTION
  // ---------------------------
  function showQuestion() {
    if (!filtered.length) return;

    const q = filtered[currentIndex];

    els.question.innerHTML = `
      <div class="text-cyan-200 font-semibold">
        Q${q.id}
      </div>
      <div class="mt-2">
        ${q.question}
      </div>
    `;

    els.answers.innerHTML = `
      <div class="text-slate-300 mt-2">
        ${q.answer || "No answer provided"}
      </div>
    `;

    els.scripture.innerHTML = `
      <div class="text-sm text-slate-400">
        Source: ${q.source || "unknown"}
      </div>
    `;

    updateProgress();
  }

  // ---------------------------
  // PROGRESS
  // ---------------------------
  function updateProgress() {
    const total = filtered.length || 1;
    const pct = ((currentIndex + 1) / total) * 100;

    els.progressFill.style.width = pct + "%";

    els.count.innerText = `Question ${currentIndex + 1} / ${total}`;
    els.score.innerText = `Score: ${score}`;
  }

  // ---------------------------
  // NAVIGATION
  // ---------------------------
  function bindNav() {
    els.nextBtn?.addEventListener("click", () => {
      if (currentIndex < filtered.length - 1) {
        currentIndex++;
        showQuestion();
      }
    });

    els.prevBtn?.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        showQuestion();
      }
    });
  }

  // ---------------------------
  // START
  // ---------------------------
  init();
})();
