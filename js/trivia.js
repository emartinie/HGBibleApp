(function () {
  const QUESTION_PATH = "bible_questions_with_hints.json";

  let questionsPromise = null;
  let activeController = null;
  let activeTimer = null;
  let currentIndex = 0;
  let teams = [];

  function getRoot(host) {
    return host?.querySelector?.("#quizCard") || document.getElementById("quizCard");
  }

  function getEls(root) {
    return {
      root,
      questionText: root.querySelector("#questionText"),
      choices: root.querySelector("#choices"),
      hintCard: root.querySelector("#hintCard"),
      hintText: root.querySelector("#hintText"),
      answerCard: root.querySelector("#answerCard"),
      answerText: root.querySelector("#answerText"),
      qNum: root.querySelector("#qNum"),
      qTotal: root.querySelector("#qTotal"),
      prevBtn: root.querySelector("#prevBtn"),
      nextBtn: root.querySelector("#nextBtn"),
      hintBtn: root.querySelector("#hintBtn"),
      revealBtn: root.querySelector("#revealBtn"),
      board: root.querySelector("#sb-board"),
      addTeamBtn: root.querySelector("#sb-add-team")
    };
  }

  function loadQuestions() {
    if (!questionsPromise) {
      questionsPromise = new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
          reject(new Error(`Timed out loading ${QUESTION_PATH}`));
        }, 8000);

        fetch(QUESTION_PATH, { signal: controller.signal })
          .then(res => {
            if (!res.ok) throw new Error(`Could not load ${QUESTION_PATH}`);
            return res.json();
          })
          .then(data => resolve(Array.isArray(data) ? data : []))
          .catch(reject)
          .finally(() => clearTimeout(timeout));
      }).catch(err => {
        questionsPromise = null;
        throw err;
      });
    }

    return questionsPromise;
  }

  function setPanelVisibility(panel, visible) {
    if (!panel) return;
    panel.classList.toggle("hidden", !visible);
  }

  function renderQuestion(els, questions) {
    if (!questions.length) {
      if (els.questionText) els.questionText.textContent = "No questions found.";
      return;
    }

    const q = questions[currentIndex];
    if (!q) return;

    if (els.root) {
      els.root.style.opacity = "0.96";
      if (activeTimer) clearTimeout(activeTimer);
      activeTimer = setTimeout(() => {
        if (els.root) els.root.style.opacity = "1";
      }, 120);
    }

    if (els.questionText) {
      els.questionText.textContent = `Q${q.id || currentIndex + 1}: ${q.question || "Question unavailable."}`;
    }

    if (els.choices) {
      els.choices.innerHTML = "";
    }

    if (els.hintText) {
      els.hintText.textContent = q.hint || "No hint available.";
    }

    if (els.answerText) {
      els.answerText.textContent = q.answer || "No answer available.";
    }

    setPanelVisibility(els.hintCard, false);
    setPanelVisibility(els.answerCard, false);

    if (els.qNum) els.qNum.textContent = String(currentIndex + 1);
    if (els.qTotal) els.qTotal.textContent = String(questions.length);
  }

  function nextQuestion(els, questions) {
    if (!questions.length) return;
    currentIndex = (currentIndex + 1) % questions.length;
    renderQuestion(els, questions);
  }

  function previousQuestion(els, questions) {
    if (!questions.length) return;
    currentIndex = (currentIndex - 1 + questions.length) % questions.length;
    renderQuestion(els, questions);
  }

  function renderScoreboard(els) {
    if (!els.board) return;

    els.board.innerHTML = "";

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
          <button class="btn-up px-2 py-1 rounded bg-emerald-600 text-white" type="button">+1</button>
          <button class="btn-down px-2 py-1 rounded bg-red-600 text-white" type="button">-1</button>
        </div>
        <button class="remove-team text-xs text-red-400 hover:text-red-300" type="button">Remove</button>
      `;

      card.querySelector("input")?.addEventListener("input", event => {
        team.name = event.target.value;
      }, { signal: activeController.signal });

      card.querySelector(".btn-up")?.addEventListener("click", () => {
        team.score++;
        renderScoreboard(els);
      }, { signal: activeController.signal });

      card.querySelector(".btn-down")?.addEventListener("click", () => {
        team.score--;
        renderScoreboard(els);
      }, { signal: activeController.signal });

      card.querySelector(".remove-team")?.addEventListener("click", () => {
        teams.splice(index, 1);
        renderScoreboard(els);
      }, { signal: activeController.signal });

      els.board.appendChild(card);
    });
  }

  async function initTriviaCard(host) {
    destroyTriviaCard();

    const root = getRoot(host);
    if (!root) return;

    const controller = new AbortController();
    activeController = controller;
    const els = getEls(root);

    teams = [
      { name: "Team A", score: 0 },
      { name: "Team B", score: 0 }
    ];

    if (els.questionText) els.questionText.textContent = "Loading questions...";
    setPanelVisibility(els.hintCard, false);
    setPanelVisibility(els.answerCard, false);

    try {
      const questions = await loadQuestions();
      if (activeController !== controller) return;

      currentIndex = questions.length ? Math.floor(Math.random() * questions.length) : 0;
      renderQuestion(els, questions);

      els.nextBtn?.addEventListener("click", () => nextQuestion(els, questions), {
        signal: activeController.signal
      });

      els.prevBtn?.addEventListener("click", () => previousQuestion(els, questions), {
        signal: activeController.signal
      });

      els.revealBtn?.addEventListener("click", () => {
        if (els.answerCard) setPanelVisibility(els.answerCard, els.answerCard.classList.contains("hidden"));
      }, { signal: activeController.signal });

      els.hintBtn?.addEventListener("click", () => {
        if (els.hintCard) setPanelVisibility(els.hintCard, els.hintCard.classList.contains("hidden"));
      }, { signal: activeController.signal });

      els.addTeamBtn?.addEventListener("click", () => {
        teams.push({ name: `Team ${String.fromCharCode(65 + teams.length)}`, score: 0 });
        renderScoreboard(els);
      }, { signal: activeController.signal });

      renderScoreboard(els);
    } catch (err) {
      console.error("[Trivia] Failed to initialize", err);
      if (els.questionText) els.questionText.textContent = "Failed to load questions.";
    }
  }

  function destroyTriviaCard() {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }

    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  }

  window.initTriviaCard = initTriviaCard;
  window.destroyTriviaCard = destroyTriviaCard;

  document.addEventListener("card:init", event => {
    if (event.detail?.cardName === "trivia") {
      initTriviaCard(event.target);
    }
  });

  queueMicrotask(() => {
    const root = getRoot(document);
    if (root && root.querySelector("#questionText")?.textContent.includes("Loading")) {
      initTriviaCard(root.closest("#loadedCardHost") || document);
    }
  });
})();
