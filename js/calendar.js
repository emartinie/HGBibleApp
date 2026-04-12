let currentCalendarType = "Hillel";
let currentNextHolyDayKey = "passover";
let countdownInterval = null;

const CALENDAR_DATA = {
  Hillel: [
    {
      key: "passover",
      title: "Passover",
      start: "2026-04-01T19:00:00",
      displayDate: "Begins at sundown on April 1, 2026",
      summary: "A night of remembrance, deliverance, and freedom."
    },
    {
      key: "unleavened_bread",
      title: "Feast of Unleavened Bread",
      start: "2026-04-02T19:00:00",
      displayDate: "April 2–8, 2026",
      summary: "Leaving bondage behind and walking cleanly."
    },
    {
      key: "first_fruits",
      title: "First Fruits",
      start: "2026-04-05T09:00:00",
      displayDate: "April 4-5 (sunset to sunset) 2026",
      summary: "The beginning of harvest and the promise of more to come."
    },
    {
      key: "pentecost",
      title: "Pentecost / Shavuot",
      start: "2026-05-24T09:00:00",
      displayDate: "Spring/Summer 2026",
      summary: "Weeks fulfilled, covenant remembered, Spirit given."
    },
    {
      key: "trumpets",
      title: "Trumpets",
      start: "2026-09-12T19:00:00",
      displayDate: "September 12, 2026",
      summary: "A call to awaken, gather, and prepare."
    },
    {
      key: "atonement",
      title: "Day of Atonement",
      start: "2026-09-21T19:00:00",
      displayDate: "Autumn 2026",
      summary: "Repentance, mercy, and the seriousness of judgment."
    },
    {
      key: "tabernacles",
      title: "Tabernacles / Sukkot",
      start: "2026-09-26T19:00:00",
      displayDate: "Autumn 2026",
      summary: "Dwelling, joy, and remembering the wilderness journey."
    }
  ],

  Enochian: [
    {
      key: "passover",
      title: "Passover",
      start: "2026-03-29T19:00:00",
      displayDate: "Begins at sundown on March 29, 2026",
      summary: "A night of remembrance, deliverance, and freedom."
    },
    {
      key: "unleavened_bread",
      title: "Feast of Unleavened Bread",
      start: "2026-03-30T19:00:00",
      displayDate: "March 30–April 5, 2026",
      summary: "Leaving bondage behind and walking cleanly."
    },
    {
      key: "first_fruits",
      title: "First Fruits",
      start: "2026-04-02T09:00:00",
      displayDate: "Spring 2026",
      summary: "The beginning of harvest and the promise of more to come."
    },
    {
      key: "pentecost",
      title: "Pentecost / Shavuot",
      start: "2026-05-20T09:00:00",
      displayDate: "Spring/Summer 2026",
      summary: "Weeks fulfilled, covenant remembered, Spirit given."
    },
    {
      key: "trumpets",
      title: "Trumpets",
      start: "2026-09-10T19:00:00",
      displayDate: "September 10, 2026",
      summary: "A call to awaken, gather, and prepare."
    },
    {
      key: "atonement",
      title: "Day of Atonement",
      start: "2026-09-19T19:00:00",
      displayDate: "Autumn 2026",
      summary: "Repentance, mercy, and the seriousness of judgment."
    },
    {
      key: "tabernacles",
      title: "Tabernacles / Sukkot",
      start: "2026-09-24T19:00:00",
      displayDate: "Autumn 2026",
      summary: "Dwelling, joy, and remembering the wilderness journey."
    }
  ],

  Zedokian: [
    {
      key: "passover",
      title: "Passover",
      start: "2026-04-03T19:00:00",
      displayDate: "Begins at sundown on April 3, 2026",
      summary: "A night of remembrance, deliverance, and freedom."
    },
    {
      key: "unleavened_bread",
      title: "Feast of Unleavened Bread",
      start: "2026-04-04T19:00:00",
      displayDate: "April 4–10, 2026",
      summary: "Leaving bondage behind and walking cleanly."
    },
    {
      key: "first_fruits",
      title: "First Fruits",
      start: "2026-04-07T09:00:00",
      displayDate: "Spring 2026",
      summary: "The beginning of harvest and the promise of more to come."
    },
    {
      key: "pentecost",
      title: "Pentecost / Shavuot",
      start: "2026-05-26T09:00:00",
      displayDate: "Spring/Summer 2026",
      summary: "Weeks fulfilled, covenant remembered, Spirit given."
    },
    {
      key: "trumpets",
      title: "Trumpets",
      start: "2026-09-14T19:00:00",
      displayDate: "September 14, 2026",
      summary: "A call to awaken, gather, and prepare."
    },
    {
      key: "atonement",
      title: "Day of Atonement",
      start: "2026-09-23T19:00:00",
      displayDate: "Autumn 2026",
      summary: "Repentance, mercy, and the seriousness of judgment."
    },
    {
      key: "tabernacles",
      title: "Tabernacles / Sukkot",
      start: "2026-09-28T19:00:00",
      displayDate: "Autumn 2026",
      summary: "Dwelling, joy, and remembering the wilderness journey."
    }
  ]
};

const CALENDAR_INFO = {
  passover: {
    title: "Passover",
    content: `
      <p>Passover remembers deliverance from bondage in Egypt.</p>
      <p>Jewish tradition often observes it with a seder meal, retelling the story and using symbolic foods.</p>
      <p>In Scripture, the central ideas are remembrance, telling the story, and marking deliverance.</p>
    `
  },
  unleavened_bread: {
    title: "Feast of Unleavened Bread",
    content: `
      <p>This feast follows Passover.</p>
      <p>It remembers leaving Egypt in haste and removing leaven.</p>
      <p>It points to leaving bondage behind and walking in a new way.</p>
    `
  },
  first_fruits: {
    title: "First Fruits",
    content: `
      <p>First Fruits marks the beginning of harvest.</p>
      <p>It is associated with gratitude, offering, and the promise of more to come.</p>
    `
  },
  pentecost: {
    title: "Pentecost / Shavuot",
    content: `
      <p>Shavuot, also called Pentecost, comes after the counting of weeks.</p>
      <p>It is associated with covenant, harvest, and later, in Christian understanding, the giving of the Spirit.</p>
    `
  },
  trumpets: {
    title: "Trumpets",
    content: `
      <p>This is a day of blowing trumpets and awakening.</p>
      <p>It is often associated with preparation, gathering, and attention to what is coming.</p>
    `
  },
  atonement: {
    title: "Day of Atonement",
    content: `
      <p>This is the most solemn day of the Biblical calendar.</p>
      <p>It is associated with repentance, mercy, cleansing, and the seriousness of judgment.</p>
    `
  },
  tabernacles: {
    title: "Tabernacles / Sukkot",
    content: `
      <p>This feast remembers dwelling in temporary shelters in the wilderness.</p>
      <p>It carries themes of joy, dependence, provision, and God dwelling with His people.</p>
    `
  },
  hillel: {
    title: "Hillel Calendar",
    content: `
      <p>The traditional Jewish calendar used worldwide today.</p>
      <p>It is a calculated lunar calendar designed for consistency and shared observance.</p>
    `
  },
  enochian: {
    title: "Enochian Calendar",
    content: `
      <p>A solar-based 364-day calendar model associated with ancient traditions like 1 Enoch and some Dead Sea Scroll patterns.</p>
      <p>It emphasizes fixed weekly alignment.</p>
    `
  },
  zedokian: {
    title: "Zedokian Calendar",
    content: `
      <p>A priestly calendar model that seeks to restore Biblical timing associated with Zadok traditions.</p>
      <p>It emphasizes priestly order and restored alignment.</p>
    `
  }
};

function openMiniModal(title, content) {
  const modal = document.getElementById("miniModal");
  const titleEl = document.getElementById("miniModalTitle");
  const contentEl = document.getElementById("miniModalContent");

  if (!modal || !titleEl || !contentEl) return;

  titleEl.textContent = title;
  contentEl.innerHTML = content;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeMiniModal() {
  const modal = document.getElementById("miniModal");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function openCalendarInfo(key) {
  const item = CALENDAR_INFO[key];
  if (!item) return;
  openMiniModal(item.title, item.content);
}

function openHolyDayDetails(key) {
  openCalendarInfo(key);
}

function getUpcomingHolyDay(calendarType) {
  const now = new Date();
  const items = CALENDAR_DATA[calendarType] || [];
  return items.find(item => new Date(item.start) > now) || items[0] || null;
}

function renderHolyDayList(calendarType) {
  const listEl = document.getElementById("holyDayList");
  if (!listEl) return;

  const items = CALENDAR_DATA[calendarType] || [];

  listEl.innerHTML = items.map(item => `
    <div class="rounded-xl bg-gray-900/60 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h4 class="font-semibold text-lg">${item.title}</h4>
        <p class="text-slate-300 text-sm">${item.displayDate}</p>
        <p class="text-slate-400 text-sm">${item.summary}</p>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500" onclick="openHolyDayDetails('${item.key}')">Info</button>
        <button class="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600" onclick="beginHolyDayExperience('${item.key}')">Play</button>
      </div>
    </div>
  `).join("");
}

function updateCountdown(targetDateString) {
  const countdownEl = document.getElementById("countdownValue");
  if (!countdownEl) return;

  if (countdownInterval) clearInterval(countdownInterval);

  function tick() {
    const now = new Date();
    const target = new Date(targetDateString);
    const diff = target - now;

    if (diff <= 0) {
      countdownEl.textContent = "Now";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    countdownEl.textContent = `${days}d ${hours}h ${minutes}m`;
  }

  tick();
  countdownInterval = setInterval(tick, 60000);
}

function setCalendarType(type) {
  currentCalendarType = type;
  localStorage.setItem("preferredCalendarType", type);

  const label = document.getElementById("currentCalendarType");
  if (label) label.textContent = type;

  const next = getUpcomingHolyDay(type);
  if (!next) return;

  currentNextHolyDayKey = next.key;

  const titleEl = document.getElementById("nextHolyDayTitle");
  const dateEl = document.getElementById("nextHolyDayDate");
  const summaryEl = document.getElementById("nextHolyDaySummary");
  const subtextEl = document.getElementById("countdownSubtext");

  if (titleEl) titleEl.textContent = next.title;
  if (dateEl) dateEl.textContent = next.displayDate;
  if (summaryEl) summaryEl.textContent = next.summary;
  if (subtextEl) subtextEl.textContent = `Preparing for ${next.title}.`;

  renderHolyDayList(type);
  updateCountdown(next.start);
}

function beginHolyDayExperience(key) {
  console.log("Begin experience for:", key);
}

function initCalendarCard() {
  const saved = localStorage.getItem("preferredCalendarType");
  setCalendarType(saved || "Hillel");
}

window.setCalendarType = setCalendarType;
window.beginHolyDayExperience = beginHolyDayExperience;
window.openHolyDayDetails = openHolyDayDetails;
window.openCalendarInfo = openCalendarInfo;
window.openMiniModal = openMiniModal;
window.closeMiniModal = closeMiniModal;
window.initCalendarCard = initCalendarCard;


(function () {
  // 2026 Omer: begins evening of Apr 2, ends night before May 20
  // This counter rolls over at local sundown (default 7:30 PM).
  const OMER_START = new Date(2026, 3, 3);   // Apr 2, 2026
  const OMER_END   = new Date(2026, 4, 20);  // May 20, 2026
  const SUNDOWN_HOUR = 19;   // adjust if you want
  const SUNDOWN_MIN  = 30;   // adjust if you want

  const dayEl = document.getElementById("omerDay");
  const textEl = document.getElementById("omerText");
  const detailEl = document.getElementById("omerDetail");

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

    // After sundown, Jewish day advances for counting purposes
    if (now >= sundown) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return startOfLocalDay(tomorrow);
    }

    return startOfLocalDay(now);
  }

  function formatWeeksDays(dayNumber) {
    const weeks = Math.floor(dayNumber / 7);
    const days = dayNumber % 7;

    if (dayNumber < 7) return `${dayNumber} day${dayNumber === 1 ? "" : "s"}`;
    if (days === 0) return `${dayNumber} days, which is ${weeks} week${weeks === 1 ? "" : "s"}`;
    return `${dayNumber} days, which is ${weeks} week${weeks === 1 ? "" : "s"} and ${days} day${days === 1 ? "" : "s"}`;
  }

  function updateOmerCounter() {
    const now = new Date();
    const effectiveDate = getEffectiveDate(now);

    const diffMs = effectiveDate - OMER_START;
    const dayNumber = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    const beforeStart = effectiveDate < OMER_START;
    const afterEnd = effectiveDate > OMER_END;

    if (beforeStart) {
      dayEl.textContent = "0";
      textEl.textContent = "Omer has not started yet";
      detailEl.textContent = "Counting begins after sundown on April 2, 2026.";
      return;
    }

    if (afterEnd || dayNumber > 49) {
      dayEl.textContent = "50";
      textEl.textContent = "Shavuot has arrived";
      detailEl.textContent = "The 49-day Omer count is complete.";
      return;
    }

    dayEl.textContent = dayNumber;
    textEl.textContent = `Today is ${formatWeeksDays(dayNumber)} of the Omer.`;

    if (dayNumber < 49) {
      detailEl.textContent = now.getHours() >= SUNDOWN_HOUR
        ? "Counted after sundown."
        : "This will advance at sundown.";
    } else {
      detailEl.textContent = "Final day of the Omer count.";
    }
  }

  updateOmerCounter();

  // Refresh every minute in case sundown passes while page is open
  setInterval(updateOmerCounter, 60000);
})();
