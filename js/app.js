console.log("🔥 app.js START");

//import { initializeTimeSystem } from "./firebaseTimeLoader.js";
import { TimeStore } from "./timeStore.js";
//import { initializeCardRenderer } from "./cardRenderer.js";

console.time("BOOT TRACE");

//await initializeTimeSystem();
console.log("✔ time system ready");

//initializeCardRenderer();
console.log("✔ card renderer init");

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

  document.querySelectorAll(".next-card-btn").forEach(btn => {
    btn.addEventListener("click", nextCard);
  });

  document.querySelectorAll(".prev-card-btn").forEach(btn => {
    btn.addEventListener("click", prevCard);
  });
}

  function wireSwipe() {
    if (!cardsRow) return;

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

  // =====================
// SCRIPT LOADER (UNIFIED)
// =====================
  async function loadCard(cardName) {
    if (!loadedCardHost || !cardName) return;

    try {
      loadedCardHost.innerHTML = `<div class="empty-state">Loading ${cardName}...</div>`;

      const res = await fetch(`cards/${cardName}.html`);
      if (!res.ok) throw new Error(`Could not load cards/${cardName}.html`);

      const html = await res.text();
      loadedCardHost.innerHTML = html;

      requestAnimationFrame(() => {
        wireCardNavButtons();
        syncCurrentCardOnScroll();
      });

      if (cardName !== "prayermap") {
  window.prayerMapInitialized = false;
}

      if (cardName === "prayermap") {
  await loadExtraScript("js/prayerStore.dev.js");
}

      const existing = document.querySelector(
  `script[src*="js/${cardName}.js"]`
);

if (!existing) {
  const script = document.createElement("script");
  script.src = `js/${cardName}.js?v=${Date.now()}`;
  script.defer = true;

  if (cardName === "prayermap") {
    script.type = "module";
  }

  document.body.appendChild(script);
}
console.log("loadCard exists?", typeof window.loadCard);
      goToCard(1);
    } catch (err) {
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
    if (prevCardSelect) {
      prevCardSelect.addEventListener("click", () => stepCardSelector(-1));
    }

    if (nextCardSelect) {
      nextCardSelect.addEventListener("click", () => stepCardSelector(1));
    }
  }

  function syncCurrentCardOnScroll() {
    if (!cardsRow || !cards.length) return;

    let ticking = false;
    cardsRow.addEventListener("scroll", () => {
      if (ticking) return;

      requestAnimationFrame(() => {
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

      ticking = true;
    }, { passive: true });
  }
  

  // =====================
// URL LOAD
// =====================
  function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const card = params.get("card");

  if (card) {
    console.log("🌐 Loading from URL:", card);

    // set dropdown so UI stays in sync
    if (cardSelector) {
      cardSelector.value = card;
    }

    loadCard(card);
  }
}
console.log("🔥 before card renderer init");
function init() {
  wireSwipe();
  wireKeyboard();
  wireCardSelector();
  wireCardSelectorStepButtons();

  loadFromUrl();

  if (!window.location.search.includes("card=")) {
    goToCard(0);
  }
}

  document.addEventListener("DOMContentLoaded", init);

window.loadCard = loadCard;
  
})();
