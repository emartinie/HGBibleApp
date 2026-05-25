(function () {

  const DATA_PATH = "data/sukkot/sukkot.json";

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "";
  }

  function setBar(percent) {
    const el = document.getElementById("sukkotProgressBar");
    if (el) el.style.width = percent + "%";
  }

  async function loadSukkot() {
    try {

      const res = await fetch(DATA_PATH);
      const data = await res.json();

      if (!data) throw new Error("No data");

      set("sukkotDayNumber", data.dayNumber);
      set("sukkotTitle", data.title);
      set("sukkotHebrew", data.hebrew);

      set("sukkotPhase", data.phase);
      set("sukkotTheme", data.theme);
      set("sukkotDetail", data.detail);

      set("sukkotMeditationTitle", data.meditation?.title);
      set("sukkotMeditationText", data.meditation?.text);
      set("sukkotMeditationPrayer", data.meditation?.prayer);
      set("sukkotMeditationScripture", data.meditation?.scripture);

      const pct = (data.dayNumber / data.totalDays) * 100;
      setBar(pct);

    } catch (err) {
      console.error(err);

      set("sukkotTitle", "Failed to load Sukkot data");
    }
  }

  document.addEventListener("DOMContentLoaded", loadSukkot);

})();
