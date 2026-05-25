(function () {

  function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "";
  }

  function setBar(percent) {
    const bar = document.getElementById("omerProgressBar");
    if (bar) bar.style.width = percent + "%";
  }

  function loadSukkot() {

    // TEMP DATA (replace later with JSON if needed)
    const data = {
      day: 1,
      total: 7,
      title: "Sukkot Cycle",
      hebrew: "סוכות",
      phase: "Day 1 / Dwelling",
      theme: "Presence / Shelter",
      detail: "Entering the festival cycle.",
      meditationTitle: "Dwelling in Awareness",
      meditation: "Sukkot reflects impermanence and divine shelter.",
      prayer: "Let me dwell with awareness.",
      scripture: "Leviticus 23:42"
    };

    set("omerDayNumber", data.day);
    set("omerTitle", data.title);
    set("omerHebrew", data.hebrew);

    set("omerWeekDay", `Day ${data.day} / ${data.total}`);
    set("omerSefirah", data.theme);
    set("omerDetail", data.detail);

    set("omerMeditationTitle", data.meditationTitle);
    set("omerMeditationText", data.meditation);
    set("omerMeditationPrayer", data.prayer);
    set("omerMeditationScripture", data.scripture);

    setBar((data.day / data.total) * 100);
  }

  document.addEventListener("DOMContentLoaded", loadSukkot);

})();
