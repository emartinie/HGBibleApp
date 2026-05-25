(function () {

  const SUNDOWN_HOUR = 19;
  const SUNDOWN_MIN = 30;

  const FESTIVAL_START = new Date(2026, 8, 25); // Sept 25 2026
  const FESTIVAL_END = new Date(2026, 9, 3);   // Oct 3 2026

  const dayNumberEl = document.getElementById("omerDayNumber");
  const titleEl = document.getElementById("omerTitle");
  const hebrewEl = document.getElementById("omerHebrew");
  const progressBarEl = document.getElementById("omerProgressBar");

  const weekDayEl = document.getElementById("omerWeekDay");
  const sefirahEl = document.getElementById("omerSefirah");
  const detailEl = document.getElementById("omerDetail");

  const meditationTitleEl = document.getElementById("omerMeditationTitle");
  const meditationTextEl = document.getElementById("omerMeditationText");
  const meditationPrayerEl = document.getElementById("omerMeditationPrayer");
  const meditationScriptureEl = document.getElementById("omerMeditationScripture");

  const constellationEl = document.getElementById("omerConstellation");
  const linesEl = document.getElementById("omerLines");

  if (!dayNumberEl) return;

  const journey = [
    {
      title: "Pesach",
      hebrew: "פסח",
      meditation: "Freedom begins with leaving bondage behind.",
      prayer: "Lead me out from slavery into freedom.",
      scripture: "Let my people go."
    },
    {
      title: "Shavuot",
      hebrew: "שבועות",
      meditation: "Revelation follows deliverance.",
      prayer: "Write Your instruction upon my heart.",
      scripture: "We will do and we will hear."
    },
    {
      title: "Summer Preparation",
      hebrew: "הכנה",
      meditation: "Growth often happens in hidden seasons.",
      prayer: "Teach me faithfulness in ordinary days.",
      scripture: "Be steadfast and immovable."
    },
    {
      title: "Yom Teruah",
      hebrew: "יום תרועה",
      meditation: "Wake up. The King is calling.",
      prayer: "Open my ears to hear the trumpet.",
      scripture: "Awake, sleeper."
    },
    {
      title: "Yom Kippur",
      hebrew: "יום כפור",
      meditation: "Mercy and repentance restore what sin damages.",
      prayer: "Search me and cleanse me.",
      scripture: "Create in me a clean heart."
    },
    {
      title: "Sukkot",
      hebrew: "סוכות",
      meditation: "God dwells with His people.",
      prayer: "Teach me to abide in Your presence.",
      scripture: "He tabernacled among us."
    },
    {
      title: "Shemini Atzeret",
      hebrew: "שמיני עצרת",
      meditation: "Remain one more day.",
      prayer: "Keep me near Your presence.",
      scripture: "Do not leave quickly."
    }
  ];

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
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return startOfDay(tomorrow);
    }

    return startOfDay(now);
  }

  function daysBetween(a, b) {
    return Math.floor((b - a) / 86400000);
  }

  function buildConstellation(progressIndex) {

    constellationEl.innerHTML = "";
    linesEl.innerHTML = "";

    const positions = [
      [10,50],[24,30],[40,60],[56,25],[72,58],[86,32],[95,50]
    ];

    for (let i = 0; i < positions.length; i++) {

      const [x, y] = positions[i];

      if (i < positions.length - 1) {

        const [x2, y2] = positions[i + 1];

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

        line.setAttribute("x1", x * 7);
        line.setAttribute("y1", y * 7);

        line.setAttribute("x2", x2 * 7);
        line.setAttribute("y2", y2 * 7);

        line.setAttribute("class", "omer-line");

        if (i < progressIndex) {
          line.classList.add("done");
        }

        linesEl.appendChild(line);
      }

      const node = document.createElement("div");

      node.className = "omer-node";

      if (i < progressIndex) {
        node.classList.add("done");
      }

      if (i === progressIndex) {
        node.classList.add("today");
      }

      node.style.left = x + "%";
      node.style.top = y + "%";

      node.innerHTML = `
        ${i + 1}
        <span class="omer-tooltip">
          ${journey[i].title}
          <span class="he">${journey[i].hebrew}</span>
        </span>
      `;

      constellationEl.appendChild(node);
    }
  }

  function render() {

    const now = new Date();
    const today = getEffectiveDate(now);

    const totalJourneyDays = daysBetween(
      startOfDay(new Date(2026, 2, 30)),
      FESTIVAL_END
    );

    const currentJourneyDay = daysBetween(
      startOfDay(new Date(2026, 2, 30)),
      today
    );

    const daysUntilSukkot = daysBetween(today, FESTIVAL_START);

    const percent = Math.max(
      0,
      Math.min(100, (currentJourneyDay / totalJourneyDays) * 100)
    );

    progressBarEl.style.width = percent + "%";

    if (today < FESTIVAL_START) {

      dayNumberEl.textContent = daysUntilSukkot;

      titleEl.textContent =
        `${daysUntilSukkot} days until Sukkot`;

      hebrewEl.textContent = "סוכות";

      weekDayEl.innerHTML =
        `<strong>Current Season:</strong> Preparation Journey`;

      sefirahEl.innerHTML =
        `<strong>Next Appointed Time:</strong> Sukkot`;

      detailEl.innerHTML =
        `<strong>Details:</strong> Journeying toward the Fall Feasts and the dwelling season.`;

      meditationTitleEl.textContent =
        "Prepare the Dwelling Place";

      meditationTextEl.textContent =
        "Sukkot reminds us that life is temporary, but God's presence is eternal.";

      meditationPrayerEl.textContent =
        "Prayer: Prepare my heart to become a dwelling place of peace and holiness.";

      meditationScriptureEl.textContent =
        "Scripture Thought: 'The Word became flesh and dwelt among us.'";

      buildConstellation(4);

      return;
    }

    const festivalDay = daysBetween(FESTIVAL_START, today) + 1;

    dayNumberEl.textContent = festivalDay;

    hebrewEl.textContent = "חג הסוכות";

    if (festivalDay <= 7) {

      titleEl.textContent =
        `Day ${festivalDay} of Sukkot`;

      weekDayEl.innerHTML =
        `<strong>Festival Phase:</strong> Sukkot`;

      sefirahEl.innerHTML =
        `<strong>Theme:</strong> Dwelling • Joy • Harvest`;

      detailEl.innerHTML =
        `<strong>Details:</strong> Celebrating the Feast of Booths.`;

      meditationTitleEl.textContent =
        "Dwelling Together";

      meditationTextEl.textContent =
        "Sukkot teaches us dependence, joy, hospitality, and remembrance.";

      meditationPrayerEl.textContent =
        "Prayer: Let my life become a shelter of peace and welcome.";

      meditationScriptureEl.textContent =
        "Scripture Thought: 'You shall rejoice before the Lord seven days.'";

      buildConstellation(5);

      return;
    }

    titleEl.textContent = "Shemini Atzeret";

    weekDayEl.innerHTML =
      `<strong>Festival Phase:</strong> Sacred Assembly`;

    sefirahEl.innerHTML =
      `<strong>Theme:</strong> Remain With Me`;

    detailEl.innerHTML =
      `<strong>Details:</strong> The concluding sacred gathering.`;

    meditationTitleEl.textContent =
      "One More Day";

    meditationTextEl.textContent =
      "The festival concludes slowly, lingering in divine presence.";

    meditationPrayerEl.textContent =
      "Prayer: Keep me near even after the celebration ends.";

    meditationScriptureEl.textContent =
      "Scripture Thought: 'Abide in Me.'";

    buildConstellation(6);
  }

  render();

  setInterval(render, 60000);

})();
