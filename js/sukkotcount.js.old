(function () {

  // ===== Sukkot window =====
  const SUKKOT_START = new Date(2026, 8, 25); // Sept 25, 2026
  const SUKKOT_END   = new Date(2026, 9, 3);  // Oct 3, 2026

  const SUNDOWN_HOUR = 19;
  const SUNDOWN_MIN = 30;

  // ===== DOM =====
  const dayNumberEl = document.getElementById("sukkotDayNumber");
  const titleEl = document.getElementById("sukkotTitle");
  const hebrewEl = document.getElementById("sukkotHebrew");
  const progressBarEl = document.getElementById("sukkotProgressBar");

  const weekDayEl = document.getElementById("sukkotWeekDay");
  const sefirahEl = document.getElementById("sukkotSefirah");
  const detailEl = document.getElementById("sukkotDetail");

  const meditationTitleEl = document.getElementById("sukkotMeditationTitle");
  const meditationTextEl = document.getElementById("sukkotMeditationText");
  const meditationPrayerEl = document.getElementById("sukkotMeditationPrayer");
  const meditationScriptureEl = document.getElementById("sukkotMeditationScripture");

  const constellationEl = document.getElementById("sukkotConstellation");
  const linesEl = document.getElementById("sukkotLines");

  if (!dayNumberEl || !titleEl) {
    console.warn("Sukkot card missing elements");
    return;
  }

  // ===== helpers =====
  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function getEffectiveDate(now) {
    const sundown = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      SUNDOWN_HOUR,
      SUNDOWN_MIN
    );

    if (now >= sundown) {
      const t = new Date(now);
      t.setDate(t.getDate() + 1);
      return startOfDay(t);
    }

    return startOfDay(now);
  }

  function daysBetween(a, b) {
    return Math.floor((b - a) / 86400000);
  }

  function formatDay(n) {
    return `Day ${n}`;
  }

  // ===== simple constellation =====
  function buildConstellation(activeIndex = 0) {

    if (!constellationEl || !linesEl) return;

    constellationEl.innerHTML = "";
    linesEl.innerHTML = "";

    const positions = [
      [10,50],[25,30],[40,60],[55,25],[70,60],[85,35],[92,55]
    ];

    for (let i = 0; i < positions.length; i++) {

      const [x, y] = positions[i];

      // lines
      if (i < positions.length - 1) {
        const [x2, y2] = positions[i + 1];

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x * 7);
        line.setAttribute("y1", y * 7);
        line.setAttribute("x2", x2 * 7);
        line.setAttribute("y2", y2 * 7);

        line.setAttribute("class", i < activeIndex ? "done" : "");

        linesEl.appendChild(line);
      }

      // nodes
      const node = document.createElement("div");
      node.className = "omer-node";

      if (i < activeIndex) node.classList.add("done");
      if (i === activeIndex) node.classList.add("today");

      node.style.left = x + "%";
      node.style.top = y + "%";
      node.textContent = i + 1;

      constellationEl.appendChild(node);
    }
  }

  // ===== render =====
  function render() {

    const now = new Date();
    const today = getEffectiveDate(now);

    // BEFORE SUKKOT
    if (today < SUKKOT_START) {

      const daysUntil = daysBetween(today, SUKKOT_START);

      dayNumberEl.textContent = daysUntil;
      titleEl.textContent = `${daysUntil} days until Sukkot`;
      hebrewEl.textContent = "סוכות";

      progressBarEl.style.width = "0%";

      weekDayEl.innerHTML = "<strong>Phase:</strong> Preparation";
      sefirahEl.innerHTML = "<strong>Focus:</strong> Anticipation";
      detailEl.innerHTML = "<strong>Details:</strong> Preparing for the Feast";

      meditationTitleEl.textContent = "Prepare the Heart";
      meditationTextEl.textContent = "Sukkot is approaching.";
      meditationPrayerEl.textContent = "Prayer: Prepare me.";
      meditationScriptureEl.textContent = "He will dwell with them.";

      buildConstellation(0);
      return;
    }

    // DURING SUKKOT
    const day = daysBetween(SUKKOT_START, today) + 1;

    dayNumberEl.textContent = day;
    titleEl.textContent = `Day ${day} of Sukkot`;
    hebrewEl.textContent = "חג הסוכות";

    const progress = Math.min(100, (day / 7) * 100);
    progressBarEl.style.width = progress + "%";

    weekDayEl.innerHTML = `<strong>Day:</strong> ${day}`;
    sefirahEl.innerHTML = `<strong>Theme:</strong> Dwelling • Joy • Presence`;
    detailEl.innerHTML = "<strong>Details:</strong> Sukkot in progress";

    meditationTitleEl.textContent = "Dwelling in Joy";
    meditationTextEl.textContent = "God is present among His people.";
    meditationPrayerEl.textContent = "Prayer: Teach me joy.";
    meditationScriptureEl.textContent = "Rejoice before the Lord.";

    buildConstellation(day - 1);
  }

  render();
  setInterval(render, 60000);

})();
