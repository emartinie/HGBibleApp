(function () {

  // =========================
  // 1. DATES
  // =========================

  const FALL = {
    YOM_TERUAH: new Date(2026, 8, 11),
    YOM_KIPPUR: new Date(2026, 8, 20),
    SUKKOT: new Date(2026, 8, 25),
    SUKKOT_END: new Date(2026, 9, 3),
    SHEMINI_ATZERET: new Date(2026, 9, 3)
  };

  const SUNDOWN_HOUR = 19;
  const SUNDOWN_MIN = 30;

  // =========================
  // 2. DOM ELEMENTS
  // =========================

  const dayEl = document.getElementById("fallDayNumber");
  const titleEl = document.getElementById("fallTitle");
  const hebrewEl = document.getElementById("fallHebrew");
  const progressEl = document.getElementById("fallProgressBar");
  const detailEl = document.getElementById("fallDetail");

  const meditationTitleEl = document.getElementById("fallMeditationTitle");
  const meditationTextEl = document.getElementById("fallMeditationText");
  const meditationPrayerEl = document.getElementById("fallMeditationPrayer");
  const meditationScriptureEl = document.getElementById("fallMeditationScripture");

  const constellationEl = document.getElementById("fallConstellation");
  const linesEl = document.getElementById("fallLines");

  if (!dayEl) return;

  // =========================
  // 3. HELPERS
  // =========================

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

  function diffDays(a, b) {
    return Math.floor((b - a) / 86400000);
  }

  // =========================
  // 4. PHASE DETECTOR
  // =========================

  function getPhase(now) {
    if (now < FALL.YOM_TERUAH) return "pre";
    if (now < FALL.YOM_KIPPUR) return "awe";
    if (now < FALL.SUKKOT) return "kippur";
    if (now <= FALL.SUKKOT_END) return "sukkot";
    if (now <= FALL.SHEMINI_ATZERET) return "shemini";
    return "done";
  }

  // =========================
  // 5. MEDIATIONS
  // =========================

  const meditations = {
    pre: {
      title: "Prepare",
      text: "The season is approaching.",
      prayer: "Make my heart ready.",
      scripture: "Be watchful."
    },
    awe: {
      title: "Awakening",
      text: "Something is calling you back.",
      prayer: "Turn my heart.",
      scripture: "Return to Me."
    },
    kippur: {
      title: "Atonement",
      text: "Release and cleansing.",
      prayer: "Cleanse me.",
      scripture: "Create in me a clean heart."
    },
    sukkot: {
      title: "Dwelling",
      text: "Presence is near.",
      prayer: "Abide with me.",
      scripture: "He dwelt among us."
    },
    shemini: {
      title: "Stay",
      text: "Do not rush away.",
      prayer: "Keep me near.",
      scripture: "Remain in Me."
    },
    done: {
      title: "Completion",
      text: "The cycle is complete.",
      prayer: "Seal the work.",
      scripture: "It is finished."
    }
  };

  // =========================
  // 6. CONSTELLATION (SIMPLE 6–7 NODES)
  // =========================

  const nodes = [
    "Start",
    "Awake",
    "Return",
    "Cleanse",
    "Dwelling",
    "Joy",
    "Completion"
  ];

  function renderConstellation(activeIndex) {
    constellationEl.innerHTML = "";
    linesEl.innerHTML = "";

    nodes.forEach((label, i) => {

      const node = document.createElement("div");
      node.className = "fall-node";
      node.textContent = i + 1;

      if (i < activeIndex) node.classList.add("done");
      if (i === activeIndex) node.classList.add("today");

      constellationEl.appendChild(node);
    });
  }

  // =========================
  // 7. RENDER
  // =========================

  function render() {

    const now = new Date();
    const effective = getEffectiveDate(now);
    const phase = getPhase(effective);

    const med = meditations[phase];

    // BEFORE SEASON
    if (phase === "pre") {
      const daysUntil = diffDays(effective, FALL.YOM_TERUAH);

      dayEl.textContent = daysUntil;
      titleEl.textContent = `${daysUntil} days until Yom Teruah`;
      hebrewEl.textContent = "עונת החגים";

      progressEl.style.width = "0%";

      meditationTitleEl.textContent = med.title;
      meditationTextEl.textContent = med.text;
      meditationPrayerEl.textContent = med.prayer;
      meditationScriptureEl.textContent = med.scripture;

      renderConstellation(0);
      return;
    }

    // IN SEASON
    dayEl.textContent = phase.toUpperCase();
    titleEl.textContent = med.title;
    hebrewEl.textContent = "מועדי תשרי";

    meditationTitleEl.textContent = med.title;
    meditationTextEl.textContent = med.text;
    meditationPrayerEl.textContent = med.prayer;
    meditationScriptureEl.textContent = med.scripture;

    const indexMap = {
      awe: 1,
      kippur: 3,
      sukkot: 5,
      shemini: 6,
      done: 6
    };

    renderConstellation(indexMap[phase] || 0);
  }

  render();
  setInterval(render, 60000);

})();
