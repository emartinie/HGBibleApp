const phaseOrder = [
  "PRE",
  "TERUAH_TO_KIPPUR",
  "KIPPUR_WINDOW",
  "SUKKOT",
  "SHEMINI",
  "COMPLETE"
];

const indexMap = Object.fromEntries(
  phaseOrder.map((p, i) => [p, i])
);

(function () {

  // =========================================================
  // 1. FALL FEAST CALENDAR MODEL
  // =========================================================

  const FALL = {
    YOM_TERUAH: new Date(2026, 8, 11),
    YOM_KIPPUR: new Date(2026, 8, 20),
    SUKKOT: new Date(2026, 8, 25),
    SUKKOT_END: new Date(2026, 9, 3),
    SHEMINI_ATZERET: new Date(2026, 9, 3)
  };

  const phaseProgress = {
    PRE: 0,
    TERUAH_TO_KIPPUR: 25,
    KIPPUR_WINDOW: 50,
    SUKKOT: 80,
    SHEMINI: 95,
    COMPLETE: 100
  };

  const SUNDOWN_HOUR = 19;
  const SUNDOWN_MIN = 30;

  // =========================================================
  // 2. DOM HOOKS (single responsibility)
  // =========================================================

  const el = {
    day: document.getElementById("fallDayNumber"),
    title: document.getElementById("fallTitle"),
    hebrew: document.getElementById("fallHebrew"),
    progress: document.getElementById("fallProgressBar"),
    detail: document.getElementById("fallDetail"),

    medTitle: document.getElementById("fallMeditationTitle"),
    medText: document.getElementById("fallMeditationText"),
    medPrayer: document.getElementById("fallMeditationPrayer"),
    medScripture: document.getElementById("fallMeditationScripture"),

    constellation: document.getElementById("fallConstellation")
  };

  if (!el.day || !el.title || !el.constellation) {
    console.warn("Fall Feast card missing DOM elements");
    return;
  }

  // =========================================================
  // 3. HELPERS
  // =========================================================

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function diffDays(a, b) {
    return Math.floor((b - a) / 86400000);
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

  function getToday() {
    return getEffectiveDate(new Date());
  }

  // =========================================================
  // 4. STATE SYSTEM (THIS IS THE CORE TRUTH)
  // =========================================================

  function getPhase(date) {

    if (date < FALL.YOM_TERUAH) return "PRE";

    if (date < FALL.YOM_KIPPUR) return "TERUAH_TO_KIPPUR";

    if (date < FALL.SUKKOT) return "KIPPUR_WINDOW";

    if (date <= FALL.SUKKOT_END) return "SUKKOT";

    if (date <= FALL.SHEMINI_ATZERET) return "SHEMINI";

    return "COMPLETE";
  }

  // =========================================================
  // 5. MEDITATION ENGINE (STATE DRIVEN)
  // =========================================================

  const MEDITATION = {
    PRE: {
      title: "Prepare",
      text: "The season is approaching.",
      prayer: "Make my heart ready.",
      scripture: "Be watchful."
    },

    TERUAH_TO_KIPPUR: {
      title: "Awakening",
      text: "The trumpet has sounded. Return begins.",
      prayer: "Turn my heart toward You.",
      scripture: "Return to Me."
    },

    KIPPUR_WINDOW: {
      title: "Atonement",
      text: "Cleansing and realignment.",
      prayer: "Cleanse me.",
      scripture: "Create in me a clean heart."
    },

    SUKKOT: {
      title: "Dwelling",
      text: "Presence becomes near and tangible.",
      prayer: "Abide with me.",
      scripture: "He dwelt among us."
    },

    SHEMINI: {
      title: "Remain",
      text: "Do not rush away from presence.",
      prayer: "Keep me near.",
      scripture: "Remain in Me."
    },

    COMPLETE: {
      title: "Completion",
      text: "The cycle has closed.",
      prayer: "Seal the work.",
      scripture: "It is finished."
    }
  };

  function setMeditation(phase, daysLeft) {
    const m = MEDITATION[phase];

    el.medTitle.textContent = m.title;
    el.medText.textContent = m.text;
    el.medPrayer.textContent = "Prayer: " + m.prayer;
    el.medScripture.textContent = "Scripture: " + m.scripture;
  }

  // =========================================================
  // 6. CONSTELLATION (STATE-BASED, NOT DATE-BASED)
  // =========================================================

  const nodes = [
    "Prepare",
    "Awake",
    "Return",
    "Cleanse",
    "Dwelling",
    "Abide",
    "Completion"
  ];

  function renderConstellation(activeIndex) {

    el.constellation.innerHTML = "";

    nodes.forEach((label, i) => {

      const node = document.createElement("div");
      node.className = "fall-node";
      node.textContent = i + 1;

      if (i < activeIndex) node.classList.add("done");
      if (i === activeIndex) node.classList.add("today");

      el.constellation.appendChild(node);
    });
  }

  // =========================================================
  // 7. MAIN RENDER LOOP
  // =========================================================

  function render() {

    const now = getToday();
    const phase = getPhase(now);
    const med = MEDITATION[phase];

    // -----------------------------------------
    // PRE-SEASON COUNTDOWN
    // -----------------------------------------

    if (phase === "PRE") {

      const daysUntil = diffDays(now, FALL.YOM_TERUAH);

      el.day.textContent = daysUntil;
      el.title.textContent = `${daysUntil} days until Yom Teruah`;
      el.hebrew.textContent = "עונת החגים";

      el.progress.style.width = "0%";

      setMeditation(phase, daysUntil);
      renderConstellation(0);

      el.detail.textContent = "Preparing for the season.";

      return;
    }

    
    // -----------------------------------------
    // IN-SEASON COUNTDOWN (optional anchor)
    // -----------------------------------------

    let anchor = FALL.SUKKOT;
    if (phase === "TERUAH_TO_KIPPUR") anchor = FALL.YOM_KIPPUR;
    if (phase === "SUKKOT" || phase === "SHEMINI") anchor = FALL.SUKKOT_END;

    const daysLeft = diffDays(now, anchor);

    el.day.textContent = daysLeft;
    el.title.textContent = `${med.title}`;
    el.hebrew.textContent = "מועדי תשרי";

    el.progress.style.width = `${phaseProgress[phase]}%`;

    el.detail.textContent = med.text;

    setMeditation(phase, daysLeft);

    const indexMap = {
      TERUAH_TO_KIPPUR: 1,
      KIPPUR_WINDOW: 3,
      SUKKOT: 5,
      SHEMINI: 6,
      COMPLETE: 6
    };

    

    renderConstellation(indexMap[phase] ?? 0);
  }

  render();
  setInterval(render, 60000);

})();
