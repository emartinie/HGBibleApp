(function () {
  const OMER_START = new Date(2026, 3, 2); // Apr 2, 2026
  const OMER_END = new Date(2026, 4, 21);  // May 21, 2026
  const SUNDOWN_HOUR = 19;
  const SUNDOWN_MIN = 30;

  const dayNumberEl = document.getElementById("omerDayNumber");
  const titleEl = document.getElementById("omerTitle");
  const hebrewEl = document.getElementById("omerHebrew");
  const progressBarEl = document.getElementById("omerProgressBar");
  const weekDayEl = document.getElementById("omerWeekDay");
  const sefirahEl = document.getElementById("omerSefirah");
  const detailEl = document.getElementById("omerDetail");
  const constellationEl = document.getElementById("omerConstellation");
  const linesEl = document.getElementById("omerLines");

  const meditationTitleEl = document.getElementById("omerMeditationTitle");
  const meditationTextEl = document.getElementById("omerMeditationText");
  const meditationPrayerEl = document.getElementById("omerMeditationPrayer");
  const meditationScriptureEl = document.getElementById("omerMeditationScripture");

  if (
    !dayNumberEl || !titleEl || !hebrewEl || !progressBarEl ||
    !weekDayEl || !sefirahEl || !detailEl || !constellationEl || !linesEl ||
    !meditationTitleEl || !meditationTextEl || !meditationPrayerEl || !meditationScriptureEl
  ) {
    console.warn(" card elements missing.");
    return;
  }

  const sefirotEn = ["Chesed", "Gevurah", "Tiferet", "Netzach", "Hod", "Yesod", "Malchut"];
  const sefirotHe = ["חסד", "גבורה", "תפארת", "נצח", "הוד", "יסוד", "מלכות"];

  const nodePositions = [
    [10,12],[24,9],[39,13],[55,10],[70,14],[84,11],[91,18],
    [12,28],[25,25],[40,29],[54,25],[69,30],[83,27],[90,34],
    [8,43],[22,40],[37,45],[52,41],[67,46],[82,42],[93,48],
    [11,58],[27,55],[42,60],[57,56],[72,61],[86,58],[94,64],
    [9,72],[24,69],[40,74],[55,70],[69,75],[84,72],[91,78],
    [13,84],[27,82],[42,86],[57,83],[71,88],[84,85],[92,91],
    [18,95],[32,93],[47,97],[62,94],[76,98],[88,95],[96,99]
  ];

  const sefirahThemes = {
    Chesed: {
      title: "Mercy / Lovingkindness",
      meditation: "Where can I become more generous, gentle, and open-hearted today?",
      prayer: "Teach me to give freely without pride, fear, or self-seeking.",
      scripture: "Let all that you do be done in love."
    },
    Gevurah: {
      title: "Strength / Discipline",
      meditation: "What needs restraint, order, honesty, or holy boundaries in my life today?",
      prayer: "Give me courage to say yes to what is right and no to what weakens my soul.",
      scripture: "Be strong and courageous."
    },
    Tiferet: {
      title: "Beauty / Compassion / Harmony",
      meditation: "How can truth and mercy meet in the way I speak, judge, and respond today?",
      prayer: "Balance zeal with tenderness, and conviction with compassion.",
      scripture: "What does the Lord require of you but to do justly, love mercy, and walk humbly?"
    },
    Netzach: {
      title: "Endurance / Victory",
      meditation: "Where must I keep going faithfully, even if progress feels slow?",
      prayer: "Strengthen me to endure with hope, patience, and steadiness.",
      scripture: "Let us not grow weary in well-doing."
    },
    Hod: {
      title: "Humility / Splendor",
      meditation: "Where do I need humility, gratitude, and the grace to listen today?",
      prayer: "Deliver me from vanity and teach me the beauty of surrender.",
      scripture: "God resists the proud, but gives grace to the humble."
    },
    Yesod: {
      title: "Foundation / Bonding",
      meditation: "What relationships, habits, and commitments need to be strengthened at the root?",
      prayer: "Establish me in faithfulness, integrity, and covenant love.",
      scripture: "The righteous shall never be removed."
    },
    Malchut: {
      title: "Kingdom / Presence / Noble Action",
      meditation: "How can what is within me become real in the world through action, leadership, and presence?",
      prayer: "Let what You build in me become fruitful in the world around me.",
      scripture: "Your kingdom come. Your will be done."
    }
  };

  let currentDisplayDay = 0;
  let currentActualDay = 0;

  function startOfLocalDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function getEffectiveDate(now) {
    const sundown = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      SUNDOWN_HOUR,
      SUNDOWN_MIN,
      0,
      0
    );

    if (now >= sundown) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return startOfLocalDay(tomorrow);
    }

    return startOfLocalDay(now);
  }

  function getOmerDay(effectiveDate) {
    const diffMs = effectiveDate - OMER_START;
    return Math.floor(diffMs / 86400000) + 1;
  }

  function formatWeeksDays(dayNumber) {
    const weeks = Math.floor(dayNumber / 7);
    const days = dayNumber % 7;

    if (dayNumber < 7) return `${dayNumber} day${dayNumber === 1 ? "" : "s"}`;
    if (days === 0) return `${dayNumber} days, which is ${weeks} week${weeks === 1 ? "" : "s"}`;
    return `${dayNumber} days, which is ${weeks} week${weeks === 1 ? "" : "s"} and ${days} day${days === 1 ? "" : "s"}`;
  }

  function getWeekDayLabel(dayNumber) {
    const week = Math.ceil(dayNumber / 7);
    const dayInWeek = ((dayNumber - 1) % 7) + 1;
    return `Week ${week}, Day ${dayInWeek}`;
  }

  function getSefirah(dayNumber) {
    const outerIndex = Math.floor((dayNumber - 1) / 7);
    const innerIndex = (dayNumber - 1) % 7;

    return {
      outer: sefirotEn[outerIndex],
      inner: sefirotEn[innerIndex],
      en: `${sefirotEn[innerIndex]} within ${sefirotEn[outerIndex]}`,
      he: `${sefirotHe[innerIndex]} שב${sefirotHe[outerIndex]}`
    };
  }

  function simpleHebrewDay(dayNumber) {
    return `הַיּוֹם ${dayNumber} לָעוֹמֶר`;
  }

  function percentToViewbox(value) {
    return (value / 100) * 700;
  }

  function updateMeditation(dayNumber) {
    if (dayNumber < 1) {
      meditationTitleEl.textContent = "Prepare Your Heart";
      meditationTextEl.textContent = "The count has not yet begun. Use this time to quiet your heart, make room, and prepare for the journey.";
      meditationPrayerEl.textContent = "Prayer: Ready me for the discipline, beauty, and transformation of these coming days.";
      meditationScriptureEl.textContent = "Watch and be ready.";
      return;
    }

    if (dayNumber > 49) {
      meditationTitleEl.textContent = "Completion";
      meditationTextEl.textContent = "The Omer journey is complete. Look back over the path, remember what was purified, strengthened, and revealed.";
      meditationPrayerEl.textContent = "Prayer: Seal in me what You have grown during these days, and let it bear fruit beyond this season.";
      meditationScriptureEl.textContent = "He who began a good work in you will carry it on to completion.";
      return;
    }

    const s = getSefirah(dayNumber);
    const inner = sefirahThemes[s.inner];
    const outer = sefirahThemes[s.outer];

    meditationTitleEl.textContent = `${s.en} — ${inner.title} within ${outer.title}`;
    meditationTextEl.textContent =
      `${inner.meditation} How should ${inner.title.toLowerCase()} be shaped by ${outer.title.toLowerCase()} today?`;

    meditationPrayerEl.textContent =
      `Prayer: ${inner.prayer} Let ${s.inner.toLowerCase()} be rightly formed within ${s.outer.toLowerCase()}.`;

    meditationScriptureEl.textContent = `Scripture thought: ${inner.scripture}`;
  }

  function buildConstellation(currentDay, selectedDay) {
    constellationEl.innerHTML = "";
    linesEl.innerHTML = "";

    for (let i = 0; i < nodePositions.length; i++) {
      const [x1p, y1p] = nodePositions[i];
      const currentIndex = i + 1;

      if (i < nodePositions.length - 1) {
        const [x2p, y2p] = nodePositions[i + 1];
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", percentToViewbox(x1p));
        line.setAttribute("y1", percentToViewbox(y1p));
        line.setAttribute("x2", percentToViewbox(x2p));
        line.setAttribute("y2", percentToViewbox(y2p));
        line.setAttribute("class", "omer-line");

        if (currentDay > 49 || currentIndex < currentDay) {
          line.classList.add("done");
        } else if (currentIndex === currentDay) {
          line.classList.add("today");
        }

        linesEl.appendChild(line);
      }

      const node = document.createElement("button");
      node.type = "button";
      node.className = "omer-node";
      node.style.left = x1p + "%";
      node.style.top = y1p + "%";
      node.textContent = currentIndex;

      if ((currentIndex - 1) % 7 === 0) node.classList.add("week-start");

      if (currentDay > 49 || currentIndex < currentDay) {
        node.classList.add("done");
      } else if (currentIndex === currentDay) {
        node.classList.add("today");
      } else {
        node.classList.add("future");
      }

      if (currentIndex === selectedDay) {
        node.style.boxShadow = "0 0 0 2px rgba(124,199,255,.30), 0 0 18px rgba(124,199,255,.28)";
      }

      const s = getSefirah(currentIndex);

      const tooltip = document.createElement("span");
      tooltip.className = "omer-tooltip";
      tooltip.innerHTML = `
        Day ${currentIndex}<br>
        ${s.en}
        <span class="he">${s.he}</span>
      `;
      node.appendChild(tooltip);
      node.title = `Day ${currentIndex} — ${s.en}`;

      node.addEventListener("click", () => {
        currentDisplayDay = currentIndex;
        renderDisplayedDay(currentDisplayDay, currentActualDay);
      });

      constellationEl.appendChild(node);
    }
  }

  function renderDisplayedDay(displayDay, actualDay) {
    if (displayDay < 1) {
      dayNumberEl.textContent = "0";
      titleEl.textContent = "Omer has not started yet";
      hebrewEl.textContent = "ספירת העומר טרם התחילה";
      weekDayEl.innerHTML = "<strong>Week / Day of counting:</strong> --";
      sefirahEl.innerHTML = "<strong>Sefirah/ Attribute:</strong> --";
      progressBarEl.style.width = "0%";
      detailEl.innerHTML = "<strong>Details:</strong> Counting begins after sundown.";
      buildConstellation(0, 0);
      updateMeditation(0);
      return;
    }

    if (displayDay > 49 || actualDay > 49) {
      dayNumberEl.textContent = "49";
      titleEl.textContent = "The Omer count is complete";
      hebrewEl.textContent = "נשלמה ספירת העומר";
      weekDayEl.innerHTML = "<strong>Week / Day:</strong> 7 full weeks";
      sefirahEl.innerHTML = `<strong>Sefirah/ Attribute:</strong> Malchut within Malchut<br><span style="opacity:.78;font-weight:500;">מלכות שבמלכות</span>`;
      progressBarEl.style.width = "100%";
      detailEl.innerHTML = "<strong>Details:</strong> Shavuot has arrived or is beginning.";
      buildConstellation(50, 49);
      updateMeditation(50);
      return;
    }

    const sefirah = getSefirah(displayDay);
    const percent = (displayDay / 49) * 100;

    dayNumberEl.textContent = displayDay;
    titleEl.textContent = `Today is ${formatWeeksDays(displayDay)} of the Omer counting`;
    hebrewEl.textContent = simpleHebrewDay(displayDay);
    weekDayEl.innerHTML = `<strong>Week / Day:</strong> ${getWeekDayLabel(displayDay)}`;
    sefirahEl.innerHTML = `<strong>Sefirah/ Attribute:</strong> ${sefirah.en}<br><span style="opacity:.78;font-weight:500;">${sefirah.he}</span>`;
    progressBarEl.style.width = percent + "%";

    if (displayDay !== actualDay) {
      detailEl.innerHTML = `<strong>Details:</strong> Viewing day ${displayDay}. Tap today's constellation node to return to the current count.`;
    } else {
      const now = new Date();
      detailEl.innerHTML =
        `<strong>Details:</strong> ` +
        (
          now.getHours() > SUNDOWN_HOUR ||
          (now.getHours() === SUNDOWN_HOUR && now.getMinutes() >= SUNDOWN_MIN)
            ? "The count has advanced for the evening."
            : "This counter automatically advances after sundown."
        );
    }

    buildConstellation(actualDay, displayDay);
    updateMeditation(displayDay);
  }

  function updateOmerCounter() {
    const now = new Date();
    const effectiveDate = getEffectiveDate(now);
    const actualDay = getOmerDay(effectiveDate);
    currentActualDay = actualDay;

    if (effectiveDate < OMER_START) {
      currentDisplayDay = 0;
      renderDisplayedDay(0, 0);
      return;
    }

    if (effectiveDate > OMER_END || actualDay > 49) {
      currentDisplayDay = 50;
      renderDisplayedDay(50, 50);
      return;
    }

    if (currentDisplayDay < 1 || currentDisplayDay > 49 || currentDisplayDay === currentActualDay - 1 || currentDisplayDay > currentActualDay) {
      currentDisplayDay = actualDay;
    }

    renderDisplayedDay(currentDisplayDay, currentActualDay);
  }

  updateOmerCounter();
  setInterval(updateOmerCounter, 60000);
})();
