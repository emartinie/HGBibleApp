(function () {

  const DATA_PATH = "data/sukkot/sukkot.json";

  let data = null;

  function el(id) {
    return document.getElementById(id);
  }

  function set(id, value) {
    const node = el(id);
    if (node) node.textContent = value ?? "";
  }

  function setBar(percent) {
    const bar = el("sukkotProgressBar");
    if (bar) bar.style.width = percent + "%";
  }

  async function load() {
    try {
      const res = await fetch(DATA_PATH);
      data = await res.json();

      if (!data) return;

      set("sukkotDayNumber", data.dayNumber);
      set("sukkotTitle", data.title);
      set("sukkotHebrew", data.hebrew);

      set("sukkotPhase", data.phase);
      set("sukkotTheme", data.theme);
      set("sukkotDetail", data.detail);

      if (data.meditation) {
        set("sukkotMeditationTitle", data.meditation.title);
        set("sukkotMeditationText", data.meditation.text);
        set("sukkotMeditationPrayer", data.meditation.prayer);
        set("sukkotMeditationScripture", data.meditation.scripture);
      }

      const pct = data.totalDays
        ? (data.dayNumber / data.totalDays) * 100
        : 0;

      setBar(pct);

    } catch (e) {
      console.error("Sukkot load failed:", e);
      set("sukkotTitle", "Failed to load Sukkot");
    }
  }

  document.addEventListener("DOMContentLoaded", load);

})();
