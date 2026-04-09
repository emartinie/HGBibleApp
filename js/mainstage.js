// --- DOM Elements ---
let weekSelect, weekInfo, prevBtn, nextBtn, cardsContainer;
let mainStageTitle, mainStageSub, mainStagePlaylist, mainStageChapters, mainStageVideo, mainStageIframe, floatingPlayer;

// --- Config ---
const START_DATE = new Date("2024-10-19T00:00:00Z");
const TOTAL_WEEKS = 52;

// --- Helper: Current Week ---
function getCurrentWeekNumber() {
  const now = new Date();
  const diffMs = now - START_DATE;
  if (diffMs < 0) return 1; // before start date
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) % TOTAL_WEEKS + 1;
}

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
    weekSelect.value = getCurrentWeekNumber();
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
    card.className = "card border rounded-2xl shadow-lg bg-white dark:bg-gray-800 p-4 transition transform hover:scale-[1.02] hover:shadow-2xl duration-300";

    const header = document.createElement("h2");
    header.className = "text-xl font-bold mb-2 cursor-pointer flex justify-between items-center";
    header.innerHTML = `${title} <span class="text-gray-400">▼</span>`;

    const content = document.createElement("div");
    content.className = "collapse-content max-h-0 overflow-hidden transition-all duration-500";
    content.innerHTML = contentHTML;

    header.addEventListener("click", () => {
        const open = content.classList.contains("max-h-0");
        content.classList.toggle("max-h-0", !open);
        content.classList.toggle("max-h-screen", open);
        header.querySelector("span").textContent = open ? "▲" : "▼";
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
        card.className = "p-2 border rounded shadow-sm bg-gray-100 dark:bg-gray-700 flex items-center justify-between mb-2";

        const playBtn = document.createElement('button');
        playBtn.className = "px-2 py-1 bg-red-600 dark:bg-blue-400 text-white rounded mr-2";
        playBtn.textContent = "▶";

        const label = document.createElement('span');
        label.className = "font-medium text-gray-800 dark:text-gray-200";
        label.textContent = track.label;

        const scriptureText = parseScriptureFromFilename(track.src);
        const scriptureSpan = document.createElement('span');
        scriptureSpan.className = "ml-2 text-sm text-blue-600 dark:text-blue-400 underline cursor-pointer";
        scriptureSpan.textContent = scriptureText;
        scriptureSpan.addEventListener('click', () => window.open(track.src, '_blank'));

        playBtn.addEventListener('click', () => {
            audio.src = track.src;
            audio.play().catch(err => console.warn("Autoplay prevented:", err));
            const nowPlayingLabel = document.getElementById("nowPlaying");
            if(nowPlayingLabel) nowPlayingLabel.textContent = `Now Playing: ${track.label} — ${scriptureText}`;
        });

        card.appendChild(playBtn);
        card.appendChild(label);
        card.appendChild(scriptureSpan);
        mainStagePlaylist.appendChild(card);
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


// --- Start ---
document.addEventListener("DOMContentLoaded", init);
