(function () {
  const DATA_PATH = "data/quiz.json"; // 👈 change this to your file
  const els = {};

  let questions = [];
  let index = 0;
  let correct = 0;

  // -------------------------
  // INIT
  // -------------------------
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheElements();
    bindNavButtons();
    await loadQuizData();
    render();
  }

  function cacheElements() {
    els.categoryList = document.getElementById("quizCategoryList");
    els.question = document.getElementById("quizQuestion");
    els.answers = document.getElementById("quizAnswers");
    els.meta = document.getElementById("quizMeta");

    els.progressFill = document.getElementById("quizProgressFill");
    els.score = document.getElementById("quizScore");
    els.count = document.getElementById("quizCount");
  }

  function bindNavButtons() {
    document.querySelector(".prev-card-btn")?.addEventListener("click", prev);
    document.querySelector(".next-card-btn")?.addEventListener("click", next);
  }

  // -------------------------
  // DATA LOADING
  // -------------------------
  async function loadQuizData() {
    try {
      const res = await fetch(DATA_PATH);
      const data = await res.json();

      // supports either:
      // 1) flat array
      // 2) grouped sets
      if (Array.isArray(data)) {
        questions = data;
      } else if (typeof data === "object") {
        questions = Object.values(data).flat();
      }

      if (!questions.length) {
        els.question.textContent = "No questions found.";
      }
    } catch (err) {
      console.error(err);
      els.question.textContent = "Failed to load quiz data.";
    }
  }

  // -------------------------
  // RENDER
  // -------------------------
  function render() {
    renderQuestion();
    renderProgress();
    renderMeta();
  }

  function renderQuestion() {
    const q = questions[index];
    if (!q) return;

    els.question.innerHTML = `
      <div class="text-lg font-semibold">
        Q${q.id}: ${escape(q.question)}
      </div>
    `;

    els.answers.innerHTML = `
      <div class="mt-2 text-green-300">
        ${q.answer ? escape(q.answer) : "No answer yet"}
      </div>
    `;

    renderScriptureContext(q);
  }

  function renderScriptureContext(q) {
    const el = document.getElementById("quizScripture");
    if (!el) return;

    el.innerHTML = q.scripture
      ? `<p>${escape(q.scripture)}</p>`
      : `<p class="text-slate-500">No scripture context provided.</p>`;
  }

  function renderProgress() {
    const percent = questions.length
      ? ((index + 1) / questions.length) * 100
      : 0;

    els.progressFill.style.width = percent + "%";

    els.count.textContent = `${index + 1} / ${questions.length}`;
    els.score.textContent = `Correct: ${correct}`;
  }

  function renderMeta() {
    const q = questions[index];
    if (!q) return;

    els.meta.innerHTML = `
      <div class="text-xs text-slate-400 mt-2">
        Source: ${q.source || "unknown"}
      </div>
    `;
  }

  // -------------------------
  // NAVIGATION
  // -------------------------
  function next() {
    if (index < questions.length - 1) {
      index++;
      render();
    }
  }

  function prev() {
    if (index > 0) {
      index--;
      render();
    }
  }

  // -------------------------
  // HELPERS
  // -------------------------
  function escape(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
