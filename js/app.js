(function () {
  const cardsRow = document.getElementById("cardsRow");
  const cardSelector = document.getElementById("cardSelector");
  const prevCardSelect = document.getElementById("prevCardSelect");
  const nextCardSelect = document.getElementById("nextCardSelect");

  let currentCardIndex = 0;
  let currentCardName = null;

  function getCards() {
    return Array.from(document.querySelectorAll(".card"));
  }

  function getCardName(card) {
    return card?.dataset?.card || card?.id || null;
  }

  function getCardIndexByName(cardName) {
    const cards = getCards();
    return cards.findIndex(card => getCardName(card) === cardName);
  }

  function getCardByIndex(index) {
    const cards = getCards();
    return cards[index] || null;
  }

  function setCurrentCard(index) {
    const card = getCardByIndex(index);
    if (!card) return;

    currentCardIndex = index;
    currentCardName = getCardName(card);

    syncSelectorToCard();
    updateUrlForCard(currentCardName);
  }

  function goToCard(index, options = {}) {
    const cards = getCards();
    if (!cardsRow || !cards.length) return;

    const clamped = Math.max(0, Math.min(index, cards.length - 1));
    const target = cards[clamped];
    if (!target) return;

    cardsRow.scrollTo({
      left: target.offsetLeft,
      behavior: options.instant ? "auto" : "smooth"
    });

    setCurrentCard(clamped);
  }

  function openCard(cardName, options = {}) {
    const index = getCardIndexByName(cardName);
    if (index === -1) {
      console.warn("Card not found:", cardName);
      return;
    }
    goToCard(index, options);
  }

  function nextCard() {
    goToCard(currentCardIndex + 1);
  }

  function prevCard() {
    goToCard(currentCardIndex - 1);
  }

  function syncSelectorToCard() {
    if (!cardSelector || !currentCardName) return;
    cardSelector.value = currentCardName;
  }

  function updateUrlForCard(cardName) {
    if (!cardName) return;

    const url = new URL(window.location.href);
    url.searchParams.set("card", cardName);
    window.history.replaceState({}, "", url);
  }

  function readRouteFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return {
      card: params.get("card")
    };
  }

  function applyRoute() {
    const route = readRouteFromUrl();
    if (route.card) {
      openCard(route.card, { instant: true });
    } else {
      goToCard(0, { instant: true });
    }
  }

  function wireCardSelector() {
    if (!cardSelector) return;
    cardSelector.addEventListener("change", () => {
      if (!cardSelector.value) return;
      openCard(cardSelector.value);
    });
  }

  function wireSelectorStepButtons() {
    if (prevCardSelect) prevCardSelect.addEventListener("click", prevCard);
    if (nextCardSelect) nextCardSelect.addEventListener("click", nextCard);
  }

  function wireKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
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

  function syncCurrentCardOnScroll() {
    if (!cardsRow) return;

    let ticking = false;

    cardsRow.addEventListener("scroll", () => {
      if (ticking) return;

      requestAnimationFrame(() => {
        const cards = getCards();
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

        setCurrentCard(nearest);
        ticking = false;
      });

      ticking = true;
    }, { passive: true });
  }

  function init() {
    wireCardSelector();
    wireSelectorStepButtons();
    wireKeyboard();
    wireSwipe();
    syncCurrentCardOnScroll();
    applyRoute();
  }

  document.addEventListener("DOMContentLoaded", init);

  window.openCard = openCard;
})();
