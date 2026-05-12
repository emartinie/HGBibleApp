import { initWeeklyScriptureLoader } from "./weeklyScriptureLoader.js";
import { getWeekNumber, TOTAL_WEEKS } from "./weekEngine.js";
// --- DOM Elements ---
let weekSelect, weekInfo, prevBtn, nextBtn, cardsContainer;
let mainStageTitle, mainStageSub, mainStagePlaylist, mainStageChapters, mainStageVideo, mainStageIframe, floatingPlayer;

// --- Config ---
//const START_DATE = new Date("2024-10-19T00:00:00Z");
//const TOTAL_WEEKS = 52;

// --- Helper: Current Week ---
//function getCurrentWeekNumber() {
  //const now = new Date();
  //const diffMs = now - START_DATE;
  //if (diffMs < 0) return 1; // before start date
  //return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) % TOTAL_WEEKS + 1;
//}

  if (typeof renderCards === "function") renderCards(window.weeklyCommentary);

// --- Initialize DOM Elements ---
function cacheDOM() {
    weekSelect = document.getElementById("weekSelect");
    weekInfo = document.getElementById("weekInfo");
    prevBtn = document.getElementById("prevWeek");
    nextBtn = document.getElementById("nextWeek");
    cardsContainer = document.getElementById("cardsContainer");

    mainStageTitle = document.getElementById("mainStageTitle");
    mainStageSub = document.getElementById("mainStageSub");
    mainStagePlaylist = document.getElementById("mainStagePlaylist");
    mainStageChapters = document.getElementById("mainStageChapters");
    mainStageVideo = document.getElementById("mainStageVideo");
}

if (!window.globalAudio) {
    window.globalAudio = new Audio();
}
const audio = window.globalAudio;


// --- Populate week select ---
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

// --- Parse scripture from filename ---
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

    const startBookNum = parseInt(match[1], 10);
    const startChapter = parseInt(match[2], 10);
    const startVerse = parseInt(match[3], 10);

    const endBookNum = parseInt(match[4], 10);
    const endChapter = parseInt(match[5], 10);
    const endVerse = parseInt(match[6], 10);

    const startBookName = bookNames[startBookNum-1] || `Book ${startBookNum}`;
    const endBookName = bookNames[endBookNum-1] || `Book ${endBookNum}`;

    if (startBookNum === endBookNum) {
        return `${startBookName} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
    } else {
        return `${startBookName} ${startChapter}:${startVerse} - ${endBookName} ${endChapter}:${endVerse}`;
    }
}

// --- Generic collapsible card ---
function createCard(title, contentHTML) {
  const card = document.createElement("section");
  card.className = "hg-panel"; // ✅ match your system

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
    content.classList.toggle("max-h-[500px]", open); // smoother than max-h-screen
    icon.textContent = open ? "▲" : "▼";
  });

  card.appendChild(header);
  card.appendChild(content);

  return card;
}

// --- Render other cards ---
function renderWeekCards(data) {
    cardsContainer.innerHTML = "";
    Object.keys(data).forEach(key => {
        if (["week","english","hebrew","transliteration","title","sections","video"].includes(key)) return;
        const contentHTML = renderObject(key, data[key]);
        cardsContainer.appendChild(createCard(key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), contentHTML));
    });

    if (data.sections) {
        Object.keys(data.sections).forEach(sec => {
            if (["audio_playlist","chapter_outlines"].includes(sec)) return;
            const sectionHTML = renderObject(sec, data.sections[sec]);
            cardsContainer.appendChild(createCard(sec.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), sectionHTML));
        });
    }
}

// --- Recursive JSON renderer ---
function renderObject(key, value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return `<p>${value}</p>`;
    if (Array.isArray(value)) return value.map(item => renderObject(key, item)).join("");
    if (typeof value === "object") {
        return Object.keys(value).map(k => `<div class="mb-2"><strong>${k}:</strong> ${renderObject(k, value[k])}</div>`).join("");
    }
    return "";
}

// --- MainStage Renderer ---
async function loadMainStageWeek(weekData) {
    if (!weekData) return;

    mainStageTitle.textContent = weekData.title || `Week ${weekData.week}`;
    mainStageSub.textContent = `${weekData.english || ''} / ${weekData.hebrew || ''} / ${weekData.transliteration || ''}`;

    // --- Playlist ---
    mainStagePlaylist.innerHTML = '';
    const playlist = weekData.sections?.audio_playlist || [];
    // --- Notify floating/main player with normalized playlist (so it doesn't build files itself) ---
    (function(){
    const raw = weekData.sections?.audio_playlist || [];
    const fpPlaylist = (raw || []).map(item => ({
    title: item.label || item.title || item.name || "Untitled",
    
    // floating player likes eng/heb/grk fields, but accept single src too
    eng: item.eng || item.src || "http://audio.esvbible.org/hw/05016018-05021009.mp3",
    heb: item.heb || item.src || "/audio/greek/Matthew01-Greek.mp3",
    grk: item.grk || item.src || "",
    
    // keep backward-compatible single 'src' pointer
    src: item.src || item.eng || item.heb || item.grk || ""
  }));
  
    // Send event to player
    window.dispatchEvent(new CustomEvent("player:updatePlaylist", { detail: { playlist: fpPlaylist } }));
  
    // Optional compatibility: keep a global copy
    window.mainPlaylist = fpPlaylist;
    })();


playlist.forEach(track => {
  const card = document.createElement('div');
  card.className = "flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm";

  const left = document.createElement('div');
  left.className = "flex items-center gap-3 min-w-0";

  const playBtn = document.createElement('button');
  playBtn.className = "flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 transition";
  playBtn.textContent = "▶ Audio Bible";

  const textWrap = document.createElement('div');
  textWrap.className = "flex flex-col min-w-0";

  const label = document.createElement('span');
  label.className = "text-sm font-semibold text-amber-100 truncate";
  label.textContent = track.label;

  const scriptureText = parseScriptureFromFilename(track.src);
  track.scriptureRef = scriptureText;
  
  const scriptureSpan = document.createElement('span');
  scriptureSpan.className = "text-xs text-blue-300 hover:text-blue-200 underline cursor-pointer";
  scriptureSpan.textContent = scriptureText;
  scriptureSpan.dataset.ref = track.scriptureRef;
  scriptureSpan.dataset.file = track.file || "";
  scriptureSpan.dataset.criteria = track.criteria || "";

  scriptureSpan.addEventListener("click", () => {
  localStorage.setItem("scriptureSearch", scriptureSpan.dataset.ref);
  localStorage.setItem("selectedPassage", scriptureSpan.dataset.file);
  localStorage.setItem("selectedCriteria", scriptureSpan.dataset.criteria);

  window.loadCard?.("scripture");
});
  
playBtn.addEventListener('click', () => {
  // If clicking same track → toggle
  if (audio.src === track.src) {
    if (audio.paused) {
      audio.play().catch(err => console.warn("Autoplay prevented:", err));
      playBtn.textContent = "⏸";
    } else {
      audio.pause();
      playBtn.textContent = "▶";
    }
    return;
  }

  // New track → reset all buttons
  document.querySelectorAll("#mainStagePlaylist button").forEach(b => {
    b.textContent = "▶";
  });

  // Load and play new track
  audio.src = track.src;
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

  document.getElementById("mainStagePlaylist").appendChild(card);
});

    if (playlist.length > 0) {
        audio.src = playlist[0].src;
        const nowPlayingLabel = document.getElementById("nowPlaying");
        if(nowPlayingLabel) nowPlayingLabel.textContent = `Now Playing: ${playlist[0].label} — ${parseScriptureFromFilename(playlist[0].src)}`;

    // --- Video ---
    if (weekData.sections?.video) {
    mainStageVideo.classList.remove("hidden");
    let videoURL = weekData.sections.video;

    let embedURL = "";

    // Check for YouTube links
    if (videoURL.includes("youtube.com/watch") || videoURL.includes("youtu.be")) {
        let videoId = "";
        if (videoURL.includes("youtube.com/watch")) {
            const url = new URL(videoURL);
            videoId = url.searchParams.get("v");
        } else if (videoURL.includes("youtu.be")) {
            videoId = videoURL.split("/").pop();
        }
        if (videoId) embedURL = `https://www.youtube.com/embed/${videoId}`;
    }

    // Fallback: if we got a valid embed URL, set iframe, otherwise show clickable link
    if (embedURL) {
        mainStageIframe.src = embedURL;
        mainStageIframe.classList.remove("hidden");
    } else {
        mainStageIframe.classList.add("hidden");
        // Optional: create a clickable link below the video container
        const link = document.createElement("a");
        link.href = videoURL;
        link.textContent = "Watch Video";
        link.target = "_blank";
        mainStageVideo.innerHTML = ""; // clear iframe
        mainStageVideo.appendChild(link);
        mainStageVideo.classList.remove("hidden");
    }
} else {
    mainStageVideo.classList.add("hidden");
}


    }

// --- Chapter Outlines ---
mainStageChapters.innerHTML = '';
const outlines = weekData.sections?.chapter_outlines || {};

Object.keys(outlines).forEach(chap => {
  const p = document.createElement('p');
  p.className = "hg-outline-card";

  const titleSpan = document.createElement('span');
  titleSpan.className = "hg-outline-title";
  titleSpan.textContent = chap;

  const contentUl = document.createElement('ul');
  contentUl.className = "hg-outline-list";

  let items = [];

  if (Array.isArray(outlines[chap])) {
    items = outlines[chap];
  } else if (typeof outlines[chap] === 'string') {
    items = outlines[chap].split(',').map(s => s.trim());
  } else {
    items = [String(outlines[chap])];
  }

  items.forEach(item => {
      const li = document.createElement('li');
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
        mainStageIframe.src = weekData.sections.video;
    } else {
        mainStageVideo.classList.add("hidden");
    }
}

// --- Load Week ---
async function loadWeek(weekNum) {
  try {
    const res = await fetch(`data/week${weekNum}.json`);
    if (!res.ok) throw new Error("Failed to fetch week data");
    const data = await res.json();
    window.currentWeekData = data;

    if (!mainStageTitle || !mainStagePlaylist || !mainStageChapters) {
      console.warn("⚠️ MainStage elements missing, retrying cacheDOM()");
      cacheDOM();
    }

    if (mainStageTitle && mainStagePlaylist && mainStageChapters) {
      await loadMainStageWeek(data);
      // Let weekChanged listeners run first
       requestAnimationFrame(() => {
       renderWeekCards(data);
  });
    } else {
      console.error("❌ Required MainStage elements still missing in DOM.");
    }

  } catch (err) {
    console.error("Error loading week:", err);
  }
}

// --- Initialize ---
function init() {
  cacheDOM();
  populateWeekSelect();
  initWeeklyScriptureLoader();

  // Set initial week globally
  window.currentWeek = parseInt(weekSelect.value, 10);

  // Load main stage safely
  loadWeek(window.currentWeek);

  // Trigger commentary load event
  document.dispatchEvent(
    new CustomEvent("weekChanged", { detail: { week: window.currentWeek } })
  );

  // --- Prev/Next buttons ---
  if (prevBtn && nextBtn && weekSelect) {
    prevBtn.addEventListener("click", () => {
      let val = parseInt(weekSelect.value, 10);
      if (val > 1) weekSelect.value = val - 1;
      window.currentWeek = val - 1;
      loadWeek(window.currentWeek);
      document.dispatchEvent(new CustomEvent("weekChanged", { detail: { week: window.currentWeek } }));
    });

    nextBtn.addEventListener("click", () => {
      let val = parseInt(weekSelect.value, 10);
      if (val < TOTAL_WEEKS) weekSelect.value = val + 1;
      window.currentWeek = val + 1;
      loadWeek(window.currentWeek);
      document.dispatchEvent(new CustomEvent("weekChanged", { detail: { week: window.currentWeek } }));
    });

    weekSelect.addEventListener("change", () => {
      window.currentWeek = parseInt(weekSelect.value, 10);
      loadWeek(window.currentWeek);
      document.dispatchEvent(new CustomEvent("weekChanged", { detail: { week: window.currentWeek } }));
    });
  }

  // Dropdown change
        weekSelect.addEventListener("change", () => {
            window.currentWeek = parseInt(weekSelect.value, 10);
            document.dispatchEvent(new CustomEvent("weekChanged", { detail: { week: window.currentWeek } }));
        });
    }

    // Trigger initial load
    


  // --- Scripture Popup ---
  const openVersePopup = document.getElementById("openVersePopup");
  const verseIframe = document.getElementById("verseIframe");
  const langPopup = document.getElementById("langPopup");

  if (openVersePopup && verseIframe && langPopup) {
    openVersePopup.addEventListener("click", () => {
      verseIframe.src = "";
      langPopup.classList.remove("hidden");
    });
  }

  // --- Language buttons ---
  document.querySelectorAll(".langOption").forEach(btn => {
    btn.addEventListener("click", e => {
      const lang = e.target.dataset.lang;
      if (verseIframe) verseIframe.src = `scripture/${lang}.html`;
    });
  });

  // --- Search setup (optional functions) ---
  if (typeof setupAdvancedSearch === "function") setupAdvancedSearch();
  if (typeof addSearchResetButton === "function") addSearchResetButton();

  function toggleSection(label) {
  const content = label.nextElementSibling;
  if (!content) return;

  const isHidden = content.style.display === "none";

  content.style.display = isHidden ? "" : "none";
  label.textContent = label.textContent.replace(
    isHidden ? "▶" : "▼",
    isHidden ? "▼" : "▶"
  );
}

// --- Start ---
document.addEventListener("DOMContentLoaded", init);

audio.addEventListener("ended", () => {
  document.querySelectorAll("#mainStagePlaylist button").forEach(b => {
    b.textContent = "▶";
  });
});
