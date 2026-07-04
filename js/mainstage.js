// mainstage.js — stabilized
// Changes from original:
//   1. mainStageIframe added to cacheDOM() — was undefined everywhere it was used
//   2. Duplicate weekSelect change listener removed — was firing weekChanged twice per change
//   3. toggleSection moved to module scope — was trapped inside init(), unreachable as global
//   4. Top-level renderCards call wrapped in DOMContentLoaded guard — was firing during module parse
//   5. prev/next week logic reads weekSelect.value consistently — prevents off-by-one drift
//   6. Scope clarified — audio.ended and DOMContentLoaded listeners explicitly outside init()

import { initWeeklyScriptureLoader } from "./weeklyScriptureLoader.js";
import { getWeekNumber, TOTAL_WEEKS } from "./weekEngine.js";

// --- DOM Elements ---
let weekSelect, weekInfo, prevBtn, nextBtn, cardsContainer;
let mainStageTitle, mainStageSub, mainStagePlaylist, mainStageChapters,
    mainStageVideo, mainStageIframe, floatingPlayer, mainStageEnglish,
    mainStageWhy, beginMainStageBtn, mainStageContinuation,
    mainStageSecondaryNav, mainStageWeekLabel;

// --- Shared audio instance ---
if (!window.globalAudio) {
  window.globalAudio = new Audio();
}
const audio = window.globalAudio;

function cleanAudioSrc(src) {
  return String(src || "")
    .trim()
    .replace(/^ttp:\/\//i, "https://")
    .replace(/^http:\/\//i, "https://");
}

// --- toggleSection (module scope so global onclick="toggleSection(this)" can find it) ---
window.toggleSection = function toggleSection(label) {
  const section = label?.closest(".content-panel");
  const panel = section
    ? Array.from(section.children).find(child => child.classList.contains("mainstage-section-body"))
    : null;
  if (!panel) return;

  const opening = panel.hidden;
  panel.hidden = !opening;
  label.setAttribute("aria-expanded", String(opening));
  label.textContent = label.textContent.replace(
    /[▼▶]$/,
    opening ? "▼" : "▶"
  );

  if (opening) {
    panel.classList.remove("mainstage-enter");
    requestAnimationFrame(() => panel.classList.add("mainstage-enter"));
  }
};

// --- Cache DOM elements ---
function cacheDOM() {
  weekSelect        = document.getElementById("weekSelect");
  weekInfo          = document.getElementById("weekInfo");
  prevBtn           = document.getElementById("prevWeek");
  nextBtn           = document.getElementById("nextWeek");
  cardsContainer    = document.getElementById("cardsContainer");
  mainStageTitle    = document.getElementById("mainStageTitle");
  mainStageSub      = document.getElementById("mainStageSub");
  mainStagePlaylist = document.getElementById("mainStagePlaylist");
  mainStageChapters = document.getElementById("mainStageChapters");
  mainStageVideo    = document.getElementById("mainStageVideo");
  mainStageIframe   = document.getElementById("mainStageIframe"); // FIX: was never cached
  mainStageEnglish  = document.getElementById("mainStageEnglish");
  mainStageWhy      = document.getElementById("mainStageWhy");
  mainStageWeekLabel = document.getElementById("mainStageWeekLabel");
  beginMainStageBtn = document.getElementById("beginMainStageBtn");
  mainStageContinuation = document.getElementById("mainStageContinuation");
  mainStageSecondaryNav = document.getElementById("mainStageSecondaryNav");
}

function prepareMainStageSections() {
  document.querySelectorAll("#mainStageContinuation .content-panel").forEach(section => {
    const label = section.querySelector(".section-label");
    const panel = Array.from(section.children)
      .find(child => child.classList.contains("mainstage-section-body"));

    if (!label || !panel) return;

    panel.hidden = true;
    panel.classList.remove("mainstage-enter");
    label.setAttribute("role", "button");
    label.setAttribute("tabindex", "0");
    label.setAttribute("aria-expanded", "false");
    label.textContent = label.textContent.replace(/[▼▶]$/, "▶");

    if (label.dataset.mainstageKeyboardBound !== "true") {
      label.dataset.mainstageKeyboardBound = "true";
      label.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        window.toggleSection(label);
      });
    }
  });
}

function resetMainStageInvitation(weekData) {
  const transliteration = String(weekData.transliteration || "")
    .split("|")[0]
    .trim();

  const selectedWeek = parseInt(weekSelect?.value, 10) || weekData.week;
  mainStageTitle.textContent = weekData.title || "Weekly Bible Study";
  if (mainStageWeekLabel) {
    mainStageWeekLabel.textContent = `Bible Study • Week ${selectedWeek}`;
  }

  if (mainStageEnglish) {
    mainStageEnglish.textContent = weekData.english || "English meaning pending";
  }

  if (mainStageSub) {
    mainStageSub.textContent = [weekData.hebrew, transliteration]
      .filter(Boolean)
      .join(" / ") || "Hebrew and transliteration pending";
  }

  if (mainStageWhy) {
    mainStageWhy.textContent = weekData.intro?.summary ||
      "An introduction for this week's study is still being prepared.";
  }

  if (mainStageContinuation) mainStageContinuation.hidden = true;
  document.getElementById("mainStageCard")?.classList.remove("mainstage-started");
  if (mainStageSecondaryNav) mainStageSecondaryNav.hidden = true;
  prepareMainStageSections();

  if (beginMainStageBtn) {
    beginMainStageBtn.hidden = false;
    beginMainStageBtn.setAttribute("aria-expanded", "false");
  }
}

function revealMainStageStudy() {
  document.getElementById("mainStageCard")?.classList.add("mainstage-started");
  if (mainStageContinuation) {
    mainStageContinuation.hidden = false;
    mainStageContinuation.classList.remove("mainstage-enter");
    requestAnimationFrame(() => mainStageContinuation.classList.add("mainstage-enter"));
  }

  if (mainStageSecondaryNav) {
    mainStageSecondaryNav.hidden = false;
    mainStageSecondaryNav.classList.remove("mainstage-enter");
    requestAnimationFrame(() => mainStageSecondaryNav.classList.add("mainstage-enter"));
  }

  if (beginMainStageBtn) {
    beginMainStageBtn.hidden = true;
    beginMainStageBtn.setAttribute("aria-expanded", "true");
  }

  mainStageContinuation?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// --- Populate week selector ---
function populateWeekSelect() {
  weekSelect.innerHTML = "";
  for (let i = 1; i <= TOTAL_WEEKS; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Week ${i}`;
    weekSelect.appendChild(opt);
  }
  weekSelect.value = getWeekNumber();
}

// --- Parse scripture reference from audio filename ---
function parseScriptureFromFilename(filename) {
  const bookNames = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
    "Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings",
    "2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah",
    "Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
    "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea",
    "Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk",
    "Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark",
    "Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
    "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians",
    "2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews",
    "James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
  ];

  const match = filename.match(/(\d{2})(\d{3})(\d{3})-(\d{2})(\d{3})(\d{3})/);
  if (!match) return filename;

  const startBookNum  = parseInt(match[1], 10);
  const startChapter  = parseInt(match[2], 10);
  const startVerse    = parseInt(match[3], 10);
  const endBookNum    = parseInt(match[4], 10);
  const endChapter    = parseInt(match[5], 10);
  const endVerse      = parseInt(match[6], 10);

  const startBookName = bookNames[startBookNum - 1] || `Book ${startBookNum}`;
  const endBookName   = bookNames[endBookNum - 1]   || `Book ${endBookNum}`;

  if (startBookNum === endBookNum) {
    return `${startBookName} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
  }
  return `${startBookName} ${startChapter}:${startVerse} - ${endBookName} ${endChapter}:${endVerse}`;
}

// --- Generic collapsible card ---
function createCard(title, contentHTML) {
  const card = document.createElement("section");
  card.className = "hg-panel";

  const header = document.createElement("div");
  header.className = "flex justify-between items-center cursor-pointer";

  const titleEl = document.createElement("div");
  titleEl.className = "text-sm font-semibold text-amber-100";
  titleEl.textContent = title;

  const icon = document.createElement("span");
  icon.className = "text-slate-400 text-sm";
  icon.textContent = "▼";

  const content = document.createElement("div");
  content.className = "overflow-hidden max-h-0 transition-all duration-300";
  content.innerHTML = contentHTML;

  header.appendChild(titleEl);
  header.appendChild(icon);

  header.addEventListener("click", () => {
    const open = content.classList.contains("max-h-0");
    content.classList.toggle("max-h-0", !open);
    content.classList.toggle("max-h-[500px]", open);
    icon.textContent = open ? "▲" : "▼";
  });

  card.appendChild(header);
  card.appendChild(content);
  return card;
}

// --- Render week info cards (arbitrary JSON keys) ---
function renderWeekCards(data) {
  cardsContainer.innerHTML = "";

  Object.keys(data).forEach(key => {
    if (["week","english","hebrew","transliteration","title","sections","video"].includes(key)) return;
    const contentHTML = renderObject(key, data[key]);
    cardsContainer.appendChild(
      createCard(
        key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        contentHTML
      )
    );
  });

  if (data.sections) {
    Object.keys(data.sections).forEach(sec => {
      if (["audio_playlist","chapter_outlines"].includes(sec)) return;
      const sectionHTML = renderObject(sec, data.sections[sec]);
      cardsContainer.appendChild(
        createCard(
          sec.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          sectionHTML
        )
      );
    });
  }
}

// --- Recursive JSON renderer ---
function renderObject(key, value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return `<p>${value}</p>`;
  if (Array.isArray(value)) return value.map(item => renderObject(key, item)).join("");
  if (typeof value === "object") {
    return Object.keys(value)
      .map(k => `<div class="mb-2"><strong>${k}:</strong> ${renderObject(k, value[k])}</div>`)
      .join("");
  }
  return "";
}

// --- Main stage renderer ---
async function loadMainStageWeek(weekData) {
  if (!weekData) return;

  resetMainStageInvitation(weekData);
  // --- Playlist ---
  mainStagePlaylist.innerHTML = "";
  const playlist = weekData.sections?.audio_playlist || [];

  // Normalize and dispatch playlist to floating player
  const fpPlaylist = playlist.map(item => ({
    title: item.label || item.title || item.name || "Untitled",
    eng: cleanAudioSrc(item.eng || item.src || "https://audio.esvbible.org/hw/05016018-05021009.mp3"),
    heb: cleanAudioSrc(item.heb || item.src || "/audio/greek/Matthew01-Greek.mp3"),
    grk: cleanAudioSrc(item.grk || item.src || ""),
    src: cleanAudioSrc(item.src || item.eng || item.heb || item.grk || "")
  }));

  window.dispatchEvent(new CustomEvent("player:updatePlaylist", {
    detail: { playlist: fpPlaylist }
  }));
  window.mainPlaylist = fpPlaylist;

  // Build playlist UI
  playlist.forEach(track => {
    const card = document.createElement("div");
    card.className =
      "flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm";

    const left = document.createElement("div");
    left.className = "flex items-center gap-3 min-w-0";

    const playBtn = document.createElement("button");
    playBtn.className =
      "flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 transition";
    playBtn.textContent = "▶";

    const textWrap = document.createElement("div");
    textWrap.className = "flex flex-col min-w-0";

    const label = document.createElement("span");
    label.className = "text-sm font-semibold text-amber-100 truncate";
    label.textContent = track.label;

    const scriptureText = parseScriptureFromFilename(track.src);
    track.scriptureRef = scriptureText;

    const scriptureSpan = document.createElement("span");
    scriptureSpan.className =
      "text-xs text-blue-300 hover:text-blue-200 underline cursor-pointer";
    scriptureSpan.textContent = scriptureText;
    scriptureSpan.dataset.ref      = track.scriptureRef;
    scriptureSpan.dataset.file     = track.file     || "";
    scriptureSpan.dataset.criteria = track.criteria || "";

    scriptureSpan.addEventListener("click", () => {
      localStorage.setItem("scriptureSearch",    scriptureSpan.dataset.ref);
      localStorage.setItem("selectedPassage",    scriptureSpan.dataset.file);
      localStorage.setItem("selectedCriteria",   scriptureSpan.dataset.criteria);
      window.loadCard?.("scripture");
    });

    playBtn.addEventListener("click", () => {
      // Same track → toggle pause/play
      const trackSrc = cleanAudioSrc(track.src);
      if (!trackSrc) return;
      if (audio.src === new URL(trackSrc, window.location.href).href) {
        if (audio.paused) {
          audio.play().catch(err => console.warn("Autoplay prevented:", err));
          playBtn.textContent = "⏸";
        } else {
          audio.pause();
          playBtn.textContent = "▶";
        }
        return;
      }

      // New track → reset all buttons, load and play
      document.querySelectorAll("#mainStagePlaylist button").forEach(b => {
        b.textContent = "▶";
      });
      audio.src = trackSrc;
      audio.play().catch(err => console.warn("Autoplay prevented:", err));
      playBtn.textContent = "⏸";

      const nowPlayingLabel = document.getElementById("nowPlaying");
      if (nowPlayingLabel) {
        nowPlayingLabel.textContent = `Now Playing: ${track.label} — ${scriptureText}`;
      }
    });

    textWrap.appendChild(label);
    textWrap.appendChild(scriptureSpan);
    left.appendChild(playBtn);
    left.appendChild(textWrap);
    card.appendChild(left);
    mainStagePlaylist.appendChild(card);
  });

  // Set first track as ready (but don't autoplay)
  if (playlist.length > 0) {
    audio.src = cleanAudioSrc(playlist[0].src);
    const nowPlayingLabel = document.getElementById("nowPlaying");
    if (nowPlayingLabel) {
      nowPlayingLabel.textContent =
        `Now Playing: ${playlist[0].label} — ${parseScriptureFromFilename(playlist[0].src)}`;
    }
  }

  // --- Chapter Outlines ---
  mainStageChapters.innerHTML = "";
  const outlines = weekData.sections?.chapter_outlines || {};

  Object.keys(outlines).forEach(chap => {
    const p = document.createElement("p");
    p.className = "hg-outline-card";

    const titleSpan = document.createElement("span");
    titleSpan.className = "hg-outline-title";
    titleSpan.textContent = chap;

    const contentUl = document.createElement("ul");
    contentUl.className = "hg-outline-list";

    let items = [];
    if (Array.isArray(outlines[chap])) {
      items = outlines[chap];
    } else if (typeof outlines[chap] === "string") {
      items = outlines[chap].split(",").map(s => s.trim());
    } else {
      items = [String(outlines[chap])];
    }

    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      contentUl.appendChild(li);
    });

    p.appendChild(titleSpan);
    p.appendChild(contentUl);
    mainStageChapters.appendChild(p);
  });

  // --- Video ---
  if (weekData.sections?.video) {
    mainStageVideo.classList.remove("hidden");
    const videoURL = weekData.sections.video;
    let embedURL = "";

    if (videoURL.includes("youtube.com/watch") || videoURL.includes("youtu.be")) {
      let videoId = "";
      if (videoURL.includes("youtube.com/watch")) {
        videoId = new URL(videoURL).searchParams.get("v") || "";
      } else if (videoURL.includes("youtu.be")) {
        videoId = videoURL.split("/").pop();
      }
      if (videoId) embedURL = `https://www.youtube.com/embed/${videoId}`;
    }

    if (mainStageIframe) {
      if (embedURL) {
        mainStageIframe.src = embedURL;
        mainStageIframe.classList.remove("hidden");
      } else {
        mainStageIframe.classList.add("hidden");
        const link = document.createElement("a");
        link.href      = videoURL;
        link.textContent = "Watch Video";
        link.target    = "_blank";
        mainStageVideo.innerHTML = "";
        mainStageVideo.appendChild(link);
      }
    }
  } else {
    mainStageVideo?.classList.add("hidden");
  }
}

// --- Orientation audio ---
function getOrientationSlug() {
  const text  = document.getElementById("mainStageSub")?.textContent || "";
  const parts = text.split("/");
  if (parts.length >= 2) {
    return parts.at(-1).split("|")[0].trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  return "kedoshim";
}

window.playOrientation = function () {
  const slug        = getOrientationSlug();
  const orientAudio = new Audio(`assets/sounds/voice/orientations/${slug}.mp3`);
  orientAudio.play().catch(err => console.warn("Orientation audio blocked:", err));
};

// --- Load a week by number ---
async function loadWeek(weekNum) {
  try {
    const res = await fetch(`data/week${weekNum}.json`);
    if (!res.ok) throw new Error(`Failed to fetch week ${weekNum} data`);
    const data = await res.json();
    window.currentWeekData = data;

    if (!mainStageTitle || !mainStagePlaylist || !mainStageChapters) {
      console.warn("⚠️ MainStage elements missing — retrying cacheDOM()");
      cacheDOM();
    }

    if (mainStageTitle && mainStagePlaylist && mainStageChapters) {
      await loadMainStageWeek(data);
      requestAnimationFrame(() => renderWeekCards(data));
    } else {
      console.error("❌ Required MainStage elements still missing after cacheDOM() retry.");
    }
  } catch (err) {
    console.error("Error loading week:", err);
  }
}

// --- Dispatch week change (single helper, avoids repetition) ---
function dispatchWeekChanged(week) {
  document.dispatchEvent(new CustomEvent("weekChanged", { detail: { week } }));
}

// --- Initialize ---
function init() {
  cacheDOM();
  populateWeekSelect();
  initWeeklyScriptureLoader();
  prepareMainStageSections();

  beginMainStageBtn?.addEventListener("click", revealMainStageStudy);

  window.currentWeek = parseInt(weekSelect.value, 10);

  loadWeek(window.currentWeek);
  dispatchWeekChanged(window.currentWeek);

  // --- Week navigation ---
  prevBtn?.addEventListener("click", () => {
    const val = parseInt(weekSelect.value, 10);
    if (val <= 1) return;
    const next = val - 1;
    weekSelect.value      = next;
    window.currentWeek    = next;
    loadWeek(next);
    dispatchWeekChanged(next);
  });

  nextBtn?.addEventListener("click", () => {
    const val = parseInt(weekSelect.value, 10);
    if (val >= TOTAL_WEEKS) return;
    const next = val + 1;
    weekSelect.value      = next;
    window.currentWeek    = next;
    loadWeek(next);
    dispatchWeekChanged(next);
  });

  // FIX: single change listener — was registered twice in original
  weekSelect?.addEventListener("change", () => {
    window.currentWeek = parseInt(weekSelect.value, 10);
    loadWeek(window.currentWeek);
    dispatchWeekChanged(window.currentWeek);
  });

  // --- Scripture popup (optional elements) ---
  const openVersePopup = document.getElementById("openVersePopup");
  const verseIframe    = document.getElementById("verseIframe");
  const langPopup      = document.getElementById("langPopup");

  if (openVersePopup && verseIframe && langPopup) {
    openVersePopup.addEventListener("click", () => {
      verseIframe.src = "";
      langPopup.classList.remove("hidden");
    });
  }

  document.querySelectorAll(".langOption").forEach(btn => {
    btn.addEventListener("click", e => {
      const lang = e.target.dataset.lang;
      if (verseIframe) verseIframe.src = `scripture/${lang}.html`;
    });
  });

  if (typeof setupAdvancedSearch   === "function") setupAdvancedSearch();
  if (typeof addSearchResetButton  === "function") addSearchResetButton();
}

// --- Audio ended: reset all play buttons ---
audio.addEventListener("ended", () => {
  document.querySelectorAll("#mainStagePlaylist button").forEach(b => {
    b.textContent = "▶";
  });
});

// --- FIX: renderCards guard — original was at top level, firing during module parse ---
// Only call if the function exists AND the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (typeof renderCards === "function" && window.weeklyCommentary) {
    renderCards(window.weeklyCommentary);
  }
});

// --- Boot ---
document.addEventListener("DOMContentLoaded", init);
