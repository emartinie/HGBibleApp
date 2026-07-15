(function () {
  function getScope(root = document) {
    return root && typeof root.querySelector === "function" ? root : document;
  }

  function readText(id) {
    return String(document.getElementById(id)?.textContent || "").trim();
  }

  function usableReference(value) {
    const text = String(value || "").trim();
    if (!text || /loading|pending|being prepared/i.test(text)) return "";
    return text;
  }

  function getStudyContext() {
    const selectedWeek = Number(
      window.currentWeek ||
      document.getElementById("weekSelect")?.value ||
      1
    );

    return {
      week: Number.isFinite(selectedWeek) && selectedWeek > 0 ? selectedWeek : 1,
      portion: readText("mainStageTitle"),
      theme: readText("mainStageThemeTitle"),
      today:
        usableReference(readText("mainStageWeekTodayRef")) ||
        usableReference(readText("mainStageDailyReading")),
      prophets: usableReference(readText("mainStageWeekHaftarahRef")),
      nt: usableReference(readText("mainStageWeekNtRef"))
    };
  }

  function setText(scope, id, value) {
    const target = scope.querySelector(`#${id}`);
    if (target) target.textContent = value || "";
  }

  function setStatus(scope, message) {
    setText(scope, "studyhubStatus", message);
  }

  function openCard(cardName) {
    if (!cardName || typeof window.loadCard !== "function") return;
    window.loadCard(cardName);
  }

  function returnToMainStage(scope) {
    const row = document.getElementById("cardsRow");
    const mainStage = document.getElementById("mainStageCard");

    if (!row || !mainStage) {
      setStatus(scope, "MainStage is unavailable.");
      return;
    }

    row.scrollTo({
      left: mainStage.offsetLeft,
      behavior: "smooth"
    });
    setStatus(scope, "Returned to MainStage.");
  }

  function openToday(scope) {
    const context = getStudyContext();
    if (!context.today) {
      setStatus(scope, "Today’s Tanakh reference is not available yet.");
      return;
    }

    localStorage.setItem("sefariaSearch", context.today);
    setStatus(scope, `Opening ${context.today}.`);
    openCard("sefaria");
  }

  function updateStudyHubContext(scope) {
    const context = getStudyContext();
    const weekTitle = [
      `Week ${context.week}`,
      context.portion
    ].filter(Boolean).join(" · ");

    setText(scope, "studyhubWeekLabel", weekTitle);
    setText(
      scope,
      "studyhubThemeTitle",
      context.theme || "The weekly theme will appear when MainStage finishes loading."
    );
    setText(scope, "studyhubTodayRef", context.today || "Today’s reading is not available yet.");
    setText(scope, "studyhubProphetsRef", context.prophets || "No Prophets/Writings reading is assigned.");
    setText(scope, "studyhubNtRef", context.nt || "No New Testament reading is assigned.");

    const readTodayBtn = scope.querySelector("#studyhubReadTodayBtn");
    if (readTodayBtn) {
      readTodayBtn.disabled = !context.today;
      readTodayBtn.title = context.today
        ? `Open ${context.today} in the Tanakh Interlinear`
        : "Today’s reading reference is unavailable";
    }

    setStatus(scope, `Study context refreshed for Week ${context.week}.`);
  }

  function bindStudyHubRoutes(scope) {
    const card = scope.querySelector("#studyhubCard");
    if (!card) return;

    const refreshBtn = scope.querySelector("#studyhubRefreshBtn");
    if (refreshBtn) refreshBtn.onclick = () => updateStudyHubContext(scope);

    const mainStageBtn = scope.querySelector("#studyhubMainStageBtn");
    if (mainStageBtn) mainStageBtn.onclick = () => returnToMainStage(scope);

    const readTodayBtn = scope.querySelector("#studyhubReadTodayBtn");
    if (readTodayBtn) readTodayBtn.onclick = () => openToday(scope);

    card.onclick = event => {
      const destination = event.target.closest("[data-studyhub-card]");
      if (!destination) return;

      const cardName = destination.dataset.studyhubCard;
      const context = getStudyContext();

      if (cardName === "nt" && context.nt) {
        localStorage.setItem("ntSearch", context.nt);
      }

      setStatus(scope, `Opening ${destination.textContent.trim()}.`);
      openCard(cardName);
    };
  }

  function initStudyHubCard(root = document) {
    const scope = getScope(root);
    if (!scope.querySelector("#studyhubCard")) return;

    bindStudyHubRoutes(scope);
    updateStudyHubContext(scope);
    console.log("[StudyHub] current-study routes ready");
  }

  window.initStudyHubCard = initStudyHubCard;
})();
