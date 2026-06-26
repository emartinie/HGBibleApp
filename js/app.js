console.log("🔥 app.js START");

import { initializeTimeSystem } from "./firebaseTimeLoader.js";
import { TimeStore } from "./timeStore.js";
//import { initializeCardRenderer } from "./cardRenderer.js";

console.time("BOOT TRACE");

//await initializeTimeSystem();
console.log("✔ time system ready");

//initializeCardRenderer();
//console.log("✔ card renderer init");

TimeStore.start();
console.log("✔ time store started");

console.timeEnd("BOOT TRACE");

console.log("APP JS RUN ID:", Date.now());

// =====================
// GLOBAL STATE
// =====================

(function () {
  const cardsRow = document.getElementById("cardsRow");
  const cardSelector = document.getElementById("cardSelector");
  const loadedCardHost = document.getElementById("loadedCardHost");
  const prevCardSelect = document.getElementById("prevCardSelect");
  const nextCardSelect = document.getElementById("nextCardSelect");

  let currentCardIndex = 0;
  let loadedScript = null;
  let loadCardRequestId = 0;
  let scrollSyncBound = false;
  let activeCardName = null;
  let appInitialized = false;
  let swipeBound = false;
  let cardSelectorBound = false;
  let selectorStepBound = false;
  let sefariaBridgeBound = false;
  let reloadBound = false;

  const SCRIPTLESS_CARDS = new Set([
    "frontporch",
    "landingpage",
    "map2",
    "payment",
    "sefarianew",
    "store2",
    "template",
    "TEMPLATE_complex",
    "TEMPLATE_simple",
    "test"
  ]);

  const MODULE_CARDS = new Set([
    "prayermap",
    "commentary"
  ]);

  const CARD_LIFECYCLE = {
    beready: { init: "initBeReadyCard" },
    calendar: { init: "initCalendarCard", cleanup: "destroyCalendarCard" },
    commandments: { init: "initCommandmentsCard", cleanup: "destroyCommandmentsCard" },
    "intertext-quotes": { init: "initIntertextQuotes" },
    interlinear: { init: "initInterlinearCard" },
    jesus: { init: "initJesusCard" },
    listen: { init: "initListenCard" },
    missler: { init: "initMissler", cleanup: "destroyMissler" },
    nt: { forceReloadScript: true },
    prayermap: { init: "initPrayerMapCard", cleanup: "destroyPrayerMapCard" },
    prezis: { init: "initPrezis", cleanup: "destroyPrezis" },
    radiomap: { init: "initRadioMapCard", cleanup: "destroyRadioMapCard" },
    sources: { init: "initSourcesCard" },
    "stewardship-card": { init: "initStewardshipCard" },
    studyhub: { init: "initStudyHubCard" },
    today: { init: "initTodayCard" }
  };
// =====================
// CARD NAVIGATION
// =====================
function getCards() {
  return Array.from(document.querySelectorAll(".card"));
}

function goToCard(index) {
  const cards = getCards();
  if (!cards.length || !cardsRow) return;

  const clamped = Math.max(0, Math.min(index, cards.length - 1));
  currentCardIndex = clamped;

  cardsRow.scrollTo({
    left: cards[clamped].offsetLeft,
    behavior: "smooth"
  });
}

  function nextCard() {
    goToCard(currentCardIndex + 1);
  }

  function prevCard() {
    goToCard(currentCardIndex - 1);
  }
// =====================
// NAV WIRING
// =====================
function wireCardNavButtons() {
  document.querySelectorAll(".next-card-btn").forEach(btn => {
    btn.onclick = nextCard;
  });

  document.querySelectorAll(".prev-card-btn").forEach(btn => {
    btn.onclick = prevCard;
  });
}

  function wireSwipe() {
    if (!cardsRow) return;
    if (swipeBound) return;
    swipeBound = true;

    let startX = 0;
    let deltaX = 0;

    cardsRow.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      deltaX = 0;
    }, { passive: true });

    cardsRow.addEventListener("touchmove", (e) => {
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });

    cardsRow.addEventListener("touchend", () => {
      if (Math.abs(deltaX) < 50) return;
      if (deltaX < 0) nextCard();
      else prevCard();
    });
  }

let keyboardBound = false;

function wireKeyboard() {
  if (keyboardBound) return;
  keyboardBound = true;

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextCard();
    if (e.key === "ArrowLeft") prevCard();
  });
}
  
// helper functions global
//function scrollScriptureTop() {
 // const el = document.getElementById('scriptureContent');
 // if (el) el.scrollTop = 0;
//}
  
  window.goToNT = function () {
  const ref = localStorage.getItem("scriptureSearch");
  if (ref) {
    localStorage.setItem("ntSearch", ref);
  }
  window.loadCard?.("nt");
};

window.goBackToCommandments = function () {
  window.loadCard?.("commandments");
};

window.loadFromReference = function(ref) {
  localStorage.setItem("scriptureSearch", ref);
  window.loadCard?.("scriptureapi");
};

window.loadFromSefaria = function(ref) {
  localStorage.setItem("sefariaSearch", ref);
  window.loadCard?.("sefaria");
};

async function loadExtraScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src*="${src.replace('./', '')}"]`
    );

    if (existing) {
      console.log(`${src} already loaded`);
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `${src}?v=${Date.now()}`;
    script.defer = true;

    if (src.includes("prayermap.js") || src.includes("firebase-init.js")) {
      script.type = "module";
    }

    script.onload = resolve;
    script.onerror = reject;

    document.body.appendChild(script);
  });
}

function getLifecycle(cardName) {
  return CARD_LIFECYCLE[cardName] || {};
}

function findCardScript(cardName) {
  return document.querySelector(`script[data-card-script="${cardName}"], script[src*="js/${cardName}.js"]`);
}

function removeCardScript(cardName) {
  document
    .querySelectorAll(`script[data-card-script="${cardName}"], script[src*="js/${cardName}.js"]`)
    .forEach(script => {
      script.remove();
      console.log("[CARD] script removed", { cardName, src: script.src });
    });
}

async function loadCardScript(cardName) {
  if (SCRIPTLESS_CARDS.has(cardName)) {
    console.log("[CARD] script skipped for static card", { cardName });
    return;
  }

  const lifecycle = getLifecycle(cardName);

  if (lifecycle.forceReloadScript) {
    removeCardScript(cardName);
  }

  const existing = findCardScript(cardName);

  if (existing) {
    console.log("[CARD] script already present", { cardName, src: existing.src });
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `js/${cardName}.js?v=${Date.now()}`;
    script.defer = true;
    script.dataset.cardScript = cardName;
    script.onload = () => {
      console.log("[CARD] script loaded", { cardName, src: script.src });
      resolve();
    };
    script.onerror = () => {
      console.error("[CARD] script failed", { cardName, src: script.src });
      reject(new Error(`Could not load js/${cardName}.js`));
    };

    if (MODULE_CARDS.has(cardName)) {
      script.type = "module";
    }

    document.body.appendChild(script);
    console.log("[CARD] script injected", { cardName, src: script.src });
  });
}

async function runCardInit(cardName, requestId) {
  const lifecycle = getLifecycle(cardName);

  loadedCardHost?.dispatchEvent(new CustomEvent("card:init", {
    bubbles: true,
    detail: { cardName }
  }));

  if (!lifecycle.init || typeof window[lifecycle.init] !== "function") return;
  if (requestId !== loadCardRequestId) return;

  await window[lifecycle.init](loadedCardHost);
  console.log("[CARD] init complete", { cardName, init: lifecycle.init });
}

function cleanupActiveCard() {
  if (!activeCardName) return;

  const lifecycle = getLifecycle(activeCardName);

  loadedCardHost?.dispatchEvent(new CustomEvent("card:cleanup", {
    bubbles: true,
    detail: { cardName: activeCardName }
  }));

  if (lifecycle.cleanup && typeof window[lifecycle.cleanup] === "function") {
    try {
      window[lifecycle.cleanup](loadedCardHost);
      console.log("[CARD] cleanup complete", { cardName: activeCardName, cleanup: lifecycle.cleanup });
    } catch (err) {
      console.warn("[CARD] cleanup failed", { cardName: activeCardName, err });
    }
  }

  activeCardName = null;
}

  // =====================
// SCRIPT LOADER (UNIFIED)
// =====================
  async function loadCard(cardName) {
    if (!loadedCardHost || !cardName) return;
    const requestId = ++loadCardRequestId;
    console.log("[CARD] render entry", { cardName, requestId });

    try {
      cleanupActiveCard();
      loadedCardHost.innerHTML = `<div class="empty-state">Loading ${cardName}...</div>`;

      const res = await fetch(`cards/${cardName}.html`);
      if (!res.ok) throw new Error(`Could not load cards/${cardName}.html`);

      const html = await res.text();
      if (requestId !== loadCardRequestId) {
        console.log("[CARD] stale render skipped", { cardName, requestId });
        return;
      }
      loadedCardHost.innerHTML = html;
      activeCardName = cardName;
      console.log("[CARD] host replaced", {
        cardName,
        requestId,
        length: loadedCardHost.innerHTML.length
      });

      requestAnimationFrame(() => {
        wireCardNavButtons();
        syncCurrentCardOnScroll();
      });

      if (cardName === "prayermap") {
  await loadExtraScript("js/prayerStore.dev.js");
  if (requestId !== loadCardRequestId) {
    console.log("[CARD] stale render skipped", { cardName, requestId });
    return;
  }
}

      await loadCardScript(cardName);
      if (requestId !== loadCardRequestId) {
        console.log("[CARD] stale init skipped", { cardName, requestId });
        return;
      }

      await runCardInit(cardName, requestId);
  
console.log("loadCard exists?", typeof window.loadCard);
      console.log("[CARD] render completion", { cardName, requestId });
      goToCard(1);
    } catch (err) {
      if (requestId !== loadCardRequestId) {
        console.log("[CARD] stale failure skipped", { cardName, requestId });
        return;
      }
      console.error("Card load failed:", err);
      loadedCardHost.innerHTML = `
        <div class="empty-state">
          Could not load <strong>${cardName}</strong>.
        </div>
      `;
    }
  }

  function wireCardSelector() {
    if (!cardSelector) return;
    if (cardSelectorBound) return;
    cardSelectorBound = true;

    cardSelector.addEventListener("change", () => {
      const value = cardSelector.value;
      if (value) loadCard(value);
    });
  }

  function getSelectableOptions() {
    if (!cardSelector) return [];
    return Array.from(cardSelector.options).filter(opt => opt.value);
  }

  function stepCardSelector(direction) {
    const options = getSelectableOptions();
    if (!options.length || !cardSelector) return;

    const currentValue = cardSelector.value;
    let index = options.findIndex(opt => opt.value === currentValue);

    if (index === -1) {
      index = direction > 0 ? 0 : options.length - 1;
    } else {
      index = (index + direction + options.length) % options.length;
    }

    cardSelector.value = options[index].value;
    cardSelector.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function wireCardSelectorStepButtons() {
    if (selectorStepBound) return;
    selectorStepBound = true;

    if (prevCardSelect) {
      prevCardSelect.addEventListener("click", () => stepCardSelector(-1));
    }

    if (nextCardSelect) {
      nextCardSelect.addEventListener("click", () => stepCardSelector(1));
    }
  }

function syncCurrentCardOnScroll() {
  if (!cardsRow || scrollSyncBound) return;
  scrollSyncBound = true;

  let ticking = false;

  cardsRow.addEventListener("scroll", () => {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(() => {
      const cards = getCards();
      if (!cards.length) {
        ticking = false;
        return;
      }

      const left = cardsRow.scrollLeft;
      let nearest = 0;
      let nearestDist = Infinity;

      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft - left);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      });

      currentCardIndex = nearest;
      ticking = false;
    });
  }, { passive: true });
}
  

  // =====================
// URL LOAD
// =====================
function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const card = params.get("card");
  const file = params.get("file");

  // SET FILE FIRST
  if (file) {
    window.pendingArticleFile = file;
    console.log("📰 Pending article file:", file);
  }

  // LOAD CARD SECOND
  if (card) {
    console.log("🌐 Loading card:", card);
    loadCard(card);
  }
}

  function wireSefariaRoutingBridge() {
  if (sefariaBridgeBound) return;
  sefariaBridgeBound = true;

  window.addEventListener("sefaria:open", (event) => {
    const detail = event.detail || {};
    const book = detail.book;

    if (!book) return;

    localStorage.setItem(
      "sefariaJump",
      JSON.stringify({
        book,
        chapter: detail.chapter || 1
      })
    );

    loadCard("sefaria");
  });
}
  
console.log("🔥 before card renderer init");
function init() {
  if (appInitialized) return;
  appInitialized = true;

  wireSwipe();
  wireKeyboard();
  wireCardSelector();
  wireCardSelectorStepButtons();
  wireSefariaRoutingBridge();

  loadFromUrl();

  if (!window.location.search.includes("card=")) {
    goToCard(0);
  }
}

  document.addEventListener("DOMContentLoaded", init);

window.loadCard = loadCard;

  // =====================
// GLOBAL TOGGLE SECTION
// =====================
window.toggleSection = function (label) {
  let panel = label.nextElementSibling;

  // If next sibling is NOT a panel, search forward safely
  while (panel && !panel.classList.contains("content-panel")) {
    panel = panel.nextElementSibling;
  }

  if (!panel) return;

  const isHidden = panel.style.display === "none";

  panel.style.display = isHidden ? "" : "none";

  // optional arrow flip (safe fallback)
  label.textContent = label.textContent.replace(
    /[▼▶]$/,
    isHidden ? "▼" : "▶"
  );
};

  // =====================
// MANUAL CARD RELOAD
// =====================
function reloadCurrentCard() {
  if (!cardSelector) return;

  const currentCard = cardSelector.value;
  if (!currentCard) return;

  cleanupActiveCard();
  removeCardScript(currentCard);

  console.log("🔄 Reloading card:", currentCard);

  // reload card fresh
  loadCard(currentCard);
}

const reloadCardBtn = document.getElementById("reloadCardBtn");
if (reloadCardBtn && !reloadBound) {
  reloadBound = true;
  reloadCardBtn.addEventListener("click", reloadCurrentCard);
}
  
})();
