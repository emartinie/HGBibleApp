function initTodayCard() {
  const now = new Date();

  // safe fallback if week engine not ready
  const weekNumber =
    window.getWeekNumber ? window.getWeekNumber() : null;

  // ===== DATE =====
  const prettyDate = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  setText("todayDatePretty", prettyDate);

  if (weekNumber !== null) {
    setText("todayWeekInfo", `Week ${weekNumber} • Day ${getDayOfWeek()}`);
  }

  // ===== SIMPLE "HOLY DAY" FLAG (hook for calendar later) =====
  setText("todaySpecialDay", getSpecialDayLabel(now));

  // ===== SCRIPTURE (temporary deterministic rotation) =====
  const verses = [
    ["Psalm 23:1", "The LORD is my shepherd; I shall not want."],
    ["John 14:27", "Peace I leave with you; my peace I give you."],
    ["Proverbs 3:5", "Trust in the LORD with all your heart."]
  ];

  const v = verses[now.getDate() % verses.length];

  setText("todayVerseRef", v[0]);
  setText("todayVerseText", `"${v[1]}"`);

  // ===== MEDIATION (placeholder hook for week engine later) =====
  setText(
    "todayMeditation",
    "Let today’s portion be enough. Walk it, don’t rush it."
  );

  // ===== LISTENER =====
  const btn = document.getElementById("todayListenBtn");
  if (btn) {
    btn.onclick = () => {
      alert("Play today's reading (hook into audio system later)");
    };
  }
}

// ---------- helpers ----------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function getDayOfWeek() {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

function getSpecialDayLabel(now) {
  const day = now.getDay();

  if (day === 6) return "🕯 Sabbath approaching";
  if (day === 0) return "🕯 Sabbath day";

  return "";
}

// expose globally (IMPORTANT for your current loader system)
window.initTodayCard = initTodayCard;
