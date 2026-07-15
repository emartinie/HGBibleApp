(function () {
  "use strict";

  var currentCalendarType = "Hillel";
  var currentNextHolyDayKey = null;
  var countdownInterval = null;
  var activeRoot = null;

  var CALENDAR_MODELS = {
    Hillel: "The calculated Jewish calendar used for shared observance today. Its months are lunar and leap months keep the year aligned with the seasons.",
    Enochian: "A 364-day solar model associated with 1 Enoch and calendar traditions represented among the Dead Sea Scrolls. This card presents one project reference schedule.",
    Zedokian: "A project label for priestly-calendar reconstructions associated with Zadok traditions. There is no single agreed modern reconstruction."
  };

  var EVENT_INFO = {
    passover: {
      title: "Passover",
      scripture: "Exodus 12:1â€“14; Leviticus 23:4â€“5",
      body: "Passover remembers deliverance from bondage in Egypt. Scripture centers remembrance, retelling, and the marking of deliverance."
    },
    unleavened_bread: {
      title: "Feast of Unleavened Bread",
      scripture: "Exodus 12:15â€“20; Leviticus 23:6â€“8",
      body: "This feast follows Passover, remembering Israel's hurried departure and the removal of leaven."
    },
    first_fruits: {
      title: "First Fruits",
      scripture: "Leviticus 23:9â€“14",
      body: "First Fruits marks the beginning of harvest through gratitude, offering, and the promise of more to come."
    },
    pentecost: {
      title: "Pentecost / Shavuot",
      scripture: "Leviticus 23:15â€“22; Acts 2:1â€“4",
      body: "Shavuot comes after the counting of weeks and is associated with harvest; Acts connects Pentecost with the giving of the Spirit."
    },
    trumpets: {
      title: "Trumpets / Yom Teruah",
      scripture: "Leviticus 23:23â€“25; Numbers 29:1â€“6",
      body: "Scripture appoints a day of rest and trumpet blasts, calling the assembly to attention and remembrance."
    },
    atonement: {
      title: "Day of Atonement / Yom Kippur",
      scripture: "Leviticus 16; Leviticus 23:26â€“32",
      body: "A solemn appointed day centered on atonement, humility, cleansing, and rest."
    },
    tabernacles: {
      title: "Tabernacles / Sukkot",
      scripture: "Leviticus 23:33â€“43; Deuteronomy 16:13â€“15",
      body: "Sukkot remembers dwelling in temporary shelters and carries themes of joy, provision, dependence, and God dwelling with His people."
    }
  };

  var BASE_EVENTS = [
    ["passover", "Passover", "A night of remembrance, deliverance, and freedom."],
    ["unleavened_bread", "Feast of Unleavened Bread", "Leaving bondage behind and walking in a new way."],
    ["first_fruits", "First Fruits", "The beginning of harvest and the promise of more to come."],
    ["pentecost", "Pentecost / Shavuot", "Weeks counted, harvest celebrated, and the Spirit given in Acts."],
    ["trumpets", "Trumpets / Yom Teruah", "A day of rest, trumpet blasts, remembrance, and gathering."],
    ["atonement", "Day of Atonement / Yom Kippur", "Atonement, humility, cleansing, mercy, and rest."],
    ["tabernacles", "Tabernacles / Sukkot", "Dwelling, joy, provision, and wilderness remembrance."]
  ];

  var MODEL_DATES = {
    Hillel: [
      ["2026-04-01T19:00:00", "Begins at sundown on April 1, 2026"],
      ["2026-04-02T19:00:00", "April 2â€“8, 2026"],
      ["2026-04-05T09:00:00", "April 4â€“5, 2026 (sunset to sunset)"],
      ["2026-05-24T09:00:00", "Spring / Summer 2026"],
      ["2026-09-12T19:00:00", "September 12, 2026"],
      ["2026-09-21T19:00:00", "Autumn 2026"],
      ["2026-09-26T19:00:00", "Autumn 2026"]
    ],
    Enochian: [
      ["2026-03-29T19:00:00", "Begins at sundown on March 29, 2026"],
      ["2026-03-30T19:00:00", "March 30â€“April 5, 2026"],
      ["2026-04-02T09:00:00", "April 2, 2026"],
      ["2026-05-20T09:00:00", "May 20, 2026"],
      ["2026-09-10T19:00:00", "Begins at sundown on September 10, 2026"],
      ["2026-09-19T19:00:00", "Begins at sundown on September 19, 2026"],
      ["2026-09-24T19:00:00", "Begins at sundown on September 24, 2026"]
    ],
    Zedokian: [
      ["2026-04-03T19:00:00", "Begins at sundown on April 3, 2026"],
      ["2026-04-04T19:00:00", "April 4â€“10, 2026"],
      ["2026-04-07T09:00:00", "April 7, 2026"],
      ["2026-05-26T09:00:00", "May 26, 2026"],
      ["2026-09-14T19:00:00", "Begins at sundown on September 14, 2026"],
      ["2026-09-23T19:00:00", "Begins at sundown on September 23, 2026"],
      ["2026-09-28T19:00:00", "Begins at sundown on September 28, 2026"]
    ]
  };

  function eventsFor(type) {
    return BASE_EVENTS.map(function (base, index) {
      var date = MODEL_DATES[type][index];
      return { key: base[0], title: base[1], summary: base[2], start: date[0], displayDate: date[1] };
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getUpcomingHolyDay(type) {
    var now = Date.now();
    return eventsFor(type).find(function (item) { return new Date(item.start).getTime() > now; }) || null;
  }

  function formatCountdown(target) {
    var diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return "This appointed time has begun";
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return days + " day" + (days === 1 ? "" : "s") + ", " + hours + " hour" + (hours === 1 ? "" : "s") + " away";
    var minutes = Math.max(0, Math.floor((diff % 3600000) / 60000));
    return hours + " hour" + (hours === 1 ? "" : "s") + ", " + minutes + " minute" + (minutes === 1 ? "" : "s") + " away";
  }

  function renderToday() {
    var today = activeRoot.querySelector("#calendarTodayDate");
    var sabbath = activeRoot.querySelector("#nextSabbathDate");
    var now = new Date();
    if (today) today.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now);
    if (!sabbath) return;
    var daysUntilFriday = (5 - now.getDay() + 7) % 7;
    var afterFridaySunset = now.getDay() === 5 && now.getHours() >= 18;
    if (daysUntilFriday === 0 && afterFridaySunset) daysUntilFriday = 7;
    var friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilFriday);
    sabbath.textContent = "Begins Friday evening, " + new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(friday) + ", at local sunset.";
  }

  function renderHolyDayList(type) {
    var list = activeRoot.querySelector("#holyDayList");
    if (!list) return;
    list.innerHTML = eventsFor(type).map(function (item) {
      var isNext = item.key === currentNextHolyDayKey;
      return '<article class="calendar-event' + (isNext ? ' is-next' : '') + '">' +
        '<div><h4>' + escapeHtml(item.title) + (isNext ? ' <span class="text-xs text-amber-300">NEXT</span>' : '') + '</h4>' +
        '<p class="text-sm text-slate-300">' + escapeHtml(item.displayDate) + '</p>' +
        '<p class="text-sm text-slate-400">' + escapeHtml(item.summary) + '</p></div>' +
        '<button class="hg-btn" type="button" data-calendar-detail="' + escapeHtml(item.key) + '">Details</button>' +
        '</article>';
    }).join("");
  }

  function updateCountdown(target) {
    var output = activeRoot && activeRoot.querySelector("#countdownValue");
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    if (!output || !target) return;
    function tick() { output.textContent = formatCountdown(target); }
    tick();
    countdownInterval = setInterval(tick, 60000);
  }

  function setCalendarType(type) {
    if (!activeRoot || !CALENDAR_MODELS[type]) return;
    currentCalendarType = type;
    try { localStorage.setItem("preferredCalendarType", type); } catch (error) {}
    var next = getUpcomingHolyDay(type);
    currentNextHolyDayKey = next ? next.key : null;

    activeRoot.querySelectorAll("[data-calendar-model]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-calendar-model") === type));
    });
    activeRoot.querySelector("#currentCalendarType").textContent = type;
    activeRoot.querySelector("#calendarModelDescription").textContent = CALENDAR_MODELS[type];

    var title = activeRoot.querySelector("#nextHolyDayTitle");
    var date = activeRoot.querySelector("#nextHolyDayDate");
    var summary = activeRoot.querySelector("#nextHolyDaySummary");
    var detailsButton = activeRoot.querySelector("#nextHolyDayDetailsBtn");
    var countdown = activeRoot.querySelector("#countdownValue");
    if (next) {
      title.textContent = next.title;
      date.textContent = next.displayDate;
      summary.textContent = next.summary;
      detailsButton.hidden = false;
      detailsButton.setAttribute("data-calendar-detail", next.key);
      countdown.hidden = false;
      updateCountdown(next.start);
    } else {
      title.textContent = "2026 reference cycle complete";
      date.textContent = "No later appointed time is stored in this Release 1 schedule.";
      summary.textContent = "The full reference cycle remains available below for study and comparison.";
      detailsButton.hidden = true;
      countdown.hidden = true;
      updateCountdown(null);
    }
    renderHolyDayList(type);
  }

  function openCalendarDetail(key) {
    var info = EVENT_INFO[key];
    if (!activeRoot || !info) return;
    var panel = activeRoot.querySelector("#calendarDetail");
    activeRoot.querySelector("#calendarDetailPrompt").hidden = true;
    activeRoot.querySelector("#calendarDetailTitle").textContent = info.title;
    activeRoot.querySelector("#calendarDetailContent").innerHTML = '<p><strong class="text-slate-100">Scripture:</strong> ' + escapeHtml(info.scripture) + '</p><p>' + escapeHtml(info.body) + '</p>';
    panel.hidden = false;
    panel.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function closeCalendarDetail() {
    if (!activeRoot) return;
    activeRoot.querySelector("#calendarDetail").hidden = true;
    activeRoot.querySelector("#calendarDetailPrompt").hidden = false;
  }

  function handleCalendarClick(event) {
    var modelButton = event.target.closest("[data-calendar-model]");
    if (modelButton && activeRoot.contains(modelButton)) {
      setCalendarType(modelButton.getAttribute("data-calendar-model"));
      return;
    }
    var detailButton = event.target.closest("[data-calendar-detail]");
    if (detailButton && activeRoot.contains(detailButton)) {
      openCalendarDetail(detailButton.getAttribute("data-calendar-detail"));
      return;
    }
    if (event.target.closest("#calendarDetailClose")) closeCalendarDetail();
  }

  function initCalendarCard() {
    destroyCalendarCard();
    activeRoot = document.getElementById("calendarCard");
    if (!activeRoot) return;
    activeRoot.addEventListener("click", handleCalendarClick);
    renderToday();
    var saved = "Hillel";
    try { saved = localStorage.getItem("preferredCalendarType") || "Hillel"; } catch (error) {}
    setCalendarType(CALENDAR_MODELS[saved] ? saved : "Hillel");
  }

  function destroyCalendarCard() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = null;
    if (activeRoot) activeRoot.removeEventListener("click", handleCalendarClick);
    activeRoot = null;
  }

  window.setCalendarType = setCalendarType;
  window.openCalendarInfo = openCalendarDetail;
  window.openHolyDayDetails = openCalendarDetail;
  window.initCalendarCard = initCalendarCard;
  window.destroyCalendarCard = destroyCalendarCard;
})();

