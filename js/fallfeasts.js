(function () {

  console.log("fallfeasts.js loaded");

  // =====================================================
  // DATES
  // =====================================================

  const FALL = {
    YOM_TERUAH: new Date(2026, 8, 11),
    YOM_KIPPUR: new Date(2026, 8, 20),
    SUKKOT: new Date(2026, 8, 25),
    SHEMINI: new Date(2026, 9, 3)
  };

  // =====================================================
  // DOM
  // =====================================================

  const el = {
    fallTitle: document.getElementById("fallTitle"),
    fallfeastsMeta: document.getElementById("fallfeastsMeta"),

    fallDetail: document.getElementById("fallDetail"),
    fallHebrew: document.getElementById("fallHebrew"),
    fallDayNumber: document.getElementById("fallDayNumber"),

    fallfeastsOrientationTitle:
      document.getElementById("fallfeastsOrientationTitle"),

    fallfeastsCountdown:
      document.getElementById("fallfeastsCountdown"),

    nextfallfeastsOrientationTitle:
      document.getElementById("nextfallfeastsOrientationTitle"),

    nextfallfeastsCountdown:
      document.getElementById("nextfallfeastsCountdown"),

    fallMeditationTitle:
      document.getElementById("fallMeditationTitle"),

    fallMeditationText:
      document.getElementById("fallMeditationText"),

    fallMeditationPrayer:
      document.getElementById("fallMeditationPrayer"),

    fallMeditationScripture:
      document.getElementById("fallMeditationScripture"),

    fallProgressBar:
      document.getElementById("fallProgressBar"),

    fallConstellation:
      document.getElementById("fallConstellation")
  };

  console.log(el);

  // =====================================================
  // HELPERS
  // =====================================================

  function daysUntil(date) {
    const now = new Date();
    const diff = date - now;
    return Math.ceil(diff / 86400000);
  }

  function getPhase() {

    const now = new Date();

    if (now < FALL.YOM_TERUAH) {
      return "PRE";
    }

    if (now < FALL.YOM_KIPPUR) {
      return "TERUAH";
    }

    if (now < FALL.SUKKOT) {
      return "KIPPUR";
    }

    if (now < FALL.SHEMINI) {
      return "SUKKOT";
    }

    return "COMPLETE";
  }

  // =====================================================
  // PHASE DATA
  // =====================================================

  const PHASES = {

    PRE: {
      title: "Preparing for Yom Teruah",
      meta: "Awakening is approaching",
      detail: "Preparing for the season.",
      hebrew: "עונת החגים",
      meditationTitle: "Prepare",
      meditationText: "The season is approaching.",
      meditationPrayer: "Make my heart ready.",
      meditationScripture: "Be watchful.",
      current: "Yom Teruah",
      next: "Yom Kippur",
      progress: 10
    },

    TERUAH: {
      title: "Yom Teruah",
      meta: "Awakening • Trumpets • Return",
      detail: "The trumpet has sounded.",
      hebrew: "יום תרועה",
      meditationTitle: "Awaken",
      meditationText: "Return begins.",
      meditationPrayer: "Turn my heart toward You.",
      meditationScripture: "Return to Me.",
      current: "Yom Teruah",
      next: "Yom Kippur",
      progress: 35
    },

    KIPPUR: {
      title: "Yom Kippur",
      meta: "Atonement • Cleansing",
      detail: "Cleansing and realignment.",
      hebrew: "יום כפור",
      meditationTitle: "Cleanse",
      meditationText: "Create in me a clean heart.",
      meditationPrayer: "Cleanse me.",
      meditationScripture: "Wash me clean.",
      current: "Yom Kippur",
      next: "Sukkot",
      progress: 60
    },

    SUKKOT: {
      title: "Sukkot",
      meta: "Dwelling • Joy • Presence",
      detail: "Presence becomes near.",
      hebrew: "סוכות",
      meditationTitle: "Dwelling",
      meditationText: "He dwelt among us.",
      meditationPrayer: "Abide with me.",
      meditationScripture: "Remain in Me.",
      current: "Sukkot",
      next: "Shemini Atzeret",
      progress: 85
    },

    COMPLETE: {
      title: "Completion",
      meta: "The cycle is complete",
      detail: "The feast cycle has closed.",
      hebrew: "הושלם",
      meditationTitle: "Completion",
      meditationText: "The cycle has closed.",
      meditationPrayer: "Seal the work.",
      meditationScripture: "It is finished.",
      current: "Complete",
      next: "Next Year",
      progress: 100
    }

  };

  // =====================================================
  // RENDER
  // =====================================================

  function render() {

    const phase = getPhase();
    const data = PHASES[phase];

    console.log("Rendering phase:", phase);

    // HEADER

    if (el.fallTitle) {
      el.fallTitle.textContent = data.title;
    }

    if (el.fallfeastsMeta) {
      el.fallfeastsMeta.textContent = data.meta;
    }

    // DEBUG PANEL

    if (el.fallDetail) {
      el.fallDetail.textContent = data.detail;
    }

    if (el.fallHebrew) {
      el.fallHebrew.textContent = data.hebrew;
    }

    if (el.fallDayNumber) {
      el.fallDayNumber.textContent =
        daysUntil(FALL.YOM_TERUAH);
    }

    // ORIENTATION

    if (el.fallfeastsOrientationTitle) {
      el.fallfeastsOrientationTitle.textContent =
        data.current;
    }

    if (el.fallfeastsCountdown) {
      el.fallfeastsCountdown.textContent =
        daysUntil(FALL.YOM_TERUAH) + " Days";
    }

    if (el.nextfallfeastsOrientationTitle) {
      el.nextfallfeastsOrientationTitle.textContent =
        data.next;
    }

    if (el.nextfallfeastsCountdown) {
      el.nextfallfeastsCountdown.textContent =
        daysUntil(FALL.YOM_KIPPUR) + " Days";
    }

    // MEDITATION

    if (el.fallMeditationTitle) {
      el.fallMeditationTitle.textContent =
        data.meditationTitle;
    }

    if (el.fallMeditationText) {
      el.fallMeditationText.textContent =
        data.meditationText;
    }

    if (el.fallMeditationPrayer) {
      el.fallMeditationPrayer.textContent =
        data.meditationPrayer;
    }

    if (el.fallMeditationScripture) {
      el.fallMeditationScripture.textContent =
        data.meditationScripture;
    }

    // PROGRESS

    if (el.fallProgressBar) {
      el.fallProgressBar.style.width =
        data.progress + "%";
    }

    // CONSTELLATION TEST

    if (el.fallConstellation) {
      el.fallConstellation.innerHTML =
        "● → ● → ● → ●";
    }

  }

  render();

})();
