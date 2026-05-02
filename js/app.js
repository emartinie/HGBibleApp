// =====================
// GLOBAL STATE
// =====================
const cardsRow = document.getElementById("cardsRow");
const cards = Array.from(document.querySelectorAll(".card"));
const cardSelector = document.getElementById("cardSelector");
const loadedCardHost = document.getElementById("loadedCardHost");
const prevCardSelect = document.getElementById("prevCardSelect");
const nextCardSelect = document.getElementById("nextCardSelect");

let currentCardIndex = 0;

// =====================
// CARD NAVIGATION
// =====================
function goToCard(index) {
  if (!cardsRow || !cards.length) return;

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
  document.querySelectorAll(".next-card-btn")
    .forEach(btn => btn.addEventListener("click", nextCard));

  document.querySelectorAll(".prev-card-btn")
    .forEach(btn => btn.addEventListener("click", prevCard));
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
    deltaX < 0 ? nextCard() : prevCard();
  });
}

function wireKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextCard();
    if (e.key === "ArrowLeft") prevCard();
  });
}

// =====================
// SELECTOR
// =====================
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

  let index = options.findIndex(opt => opt.value === cardSelector.value);

  if (index === -1) {
    index = direction > 0 ? 0 : options.length - 1;
  } else {
    index = (index + direction + options.length) % options.length;
  }

  cardSelector.value = options[index].value;
  cardSelector.dispatchEvent(new Event("change", { bubbles: true }));
}

function wireCardSelectorStepButtons() {
  prevCardSelect?.addEventListener("click", () => stepCardSelector(-1));
  nextCardSelect?.addEventListener("click", () => stepCardSelector(1));
}

// =====================
// SCRIPT LOADER (UNIFIED)
// =====================
const MODULE_CARDS = new Set([
  "prayermap"
]);

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const clean = src.split("?")[0];

    const existing = Array.from(document.querySelectorAll("script"))
      .find(s => s.src.includes(clean));

    if (existing) return resolve();

    const script = document.createElement("script");
    script.src = `${src}?v=${Date.now()}`;
    script.defer = true;

    if (MODULE_CARDS.has(clean.split("/").pop())) {
      script.type = "module";
    }

    script.onload = resolve;
    script.onerror = reject;

    document.body.appendChild(script);
  });
}

// =====================
// URL LOAD
// =====================
function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const card = params.get("card");

  if (!card) return;

  console.log("🌐 Loading from URL:", card);

  if (cardSelector) {
    cardSelector.value = card;
  }

  loadCard(card);
}

// =====================
// MAIN CARD LOADER
// =====================
async function loadCard(cardName) {
  if (!loadedCardHost || !cardName) return;

  try {
    loadedCardHost.innerHTML =
      `<div class="empty-state">Loading ${cardName}...</div>`;

    const res = await fetch(`cards/${cardName}.html`);
    if (!res.ok) throw new Error(`Could not load cards/${cardName}.html`);

    const html = await res.text();
    loadedCardHost.innerHTML = html;

    if (cardName !== "prayermap") {
      window.prayerMapInitialized = false;
    }

    if (cardName === "today") {
      initTodayCard?.();
    }

    await loadScript(`js/${cconst script = document.createElement("script");
script.src = `js/${cardName}.js?v=${Date.now()}`;
script.type = "module";
document.body.appendChild(script);ardName}.js`);

  } catch (err) {
    console.error("Card load failed:", err);
    loadedCardHost.innerHTML = `
      <div class="empty-state">
        Could not load <strong>${cardName}</strong>.
      </div>
    `;
  }
}

// =====================
// SCROLL SYNC
// =====================
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
// INIT
// =====================
function init() {
  wireCardNavButtons();
  wireSwipe();
  wireKeyboard();
  wireCardSelector();
  wireCardSelectorStepButtons();
  syncCurrentCardOnScroll();

  loadFromUrl();

  if (!window.location.search.includes("card=")) {
    goToCard(0);
  }
}

document.addEventListener("DOMContentLoaded", init);

// expose globally
window.loadCard = loadCard;
