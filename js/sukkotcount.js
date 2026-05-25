(function () {

  const DATA_PATH = "data/sukkotcount.json";

  const els = {
    dayNumber: document.getElementById("sukkotDayNumber"),
    title: document.getElementById("sukkotTitle"),
    hebrew: document.getElementById("sukkotHebrew"),

    progress: document.getElementById("sukkotProgressBar"),

    weekDay: document.getElementById("sukkotWeekDay"),
    theme: document.getElementById("sukkotTheme"),
    detail: document.getElementById("sukkotDetail"),

    medTitle: document.getElementById("sukkotMeditationTitle"),
    medText: document.getElementById("sukkotMeditationText"),
    medPrayer: document.getElementById("sukkotMeditationPrayer"),
    medScripture: document.getElementById("sukkotMeditationScripture")
  };

  let data = null;

  async function init() {
    try {
      const res = await fetch(DATA_PATH);
      data = await res.json();

      if (!data) return renderError();

      render();
      bindNav();

    } catch (e) {
      console.error(e);
      renderError();
    }
  }

  function render() {

    const today =
      data.current ||
      data.today ||
      data.days?.[0] ||
      data;

    if (!today) return renderError();

    els.dayNumber.textContent = today.day ?? "--";
    els.title.textContent = today.title ?? "Sukkot";
    els.hebrew.textContent = today.hebrew ?? "";

    const total = data.totalDays || 1;
    const percent = (today.day / total) * 100;

    els.progress.style.width = `${percent}%`;

    els.weekDay.textContent = today.weekDay ?? "--";
    els.theme.textContent = today.theme ?? "--";
    els.detail.textContent = today.detail ?? "--";

    els.medTitle.textContent = today.meditation?.title ?? "";
    els.medText.textContent = today.meditation?.text ?? "";
    els.medPrayer.textContent = today.meditation?.prayer ?? "";
    els.medScripture.textContent = today.meditation?.scripture ?? "";
  }

  function renderError() {
    if (els.title) els.title.textContent = "Failed to load Sukkot";
  }

  function bindNav() {
    const home = document.getElementById("sukkotHome");
    const prev = document.getElementById("sukkotPrev");
    const next = document.getElementById("sukkotNext");

    if (home) home.onclick = () => window.loadCard?.("home");

    if (prev) prev.onclick = () => {
      console.log("Sukkot prev");
    };

    if (next) next.onclick = () => {
      console.log("Sukkot next");
    };
  }

  document.addEventListener("DOMContentLoaded", init);

})();
