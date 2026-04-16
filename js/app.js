(function () {
  const cardsRow = document.getElementById("cardsRow");
  const cards = Array.from(document.querySelectorAll(".card"));
  const cardSelector = document.getElementById("cardSelector");
  const loadedCardHost = document.getElementById("loadedCardHost");

  let currentCardIndex = 0;
  let loadedScript = null;

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

  function wireCardNavButtons() {
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

  function wireKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
    });
  }

  async function loadCard(cardName) {
    if (!loadedCardHost || !cardName) return;

    try {
      loadedCardHost.innerHTML = `<div class="empty-state">Loading ${cardName}...</div>`;

      const res = await fetch(`cards/${cardName}.html`);
      if (!res.ok) throw new Error(`Could not load cards/${cardName}.html`);

      const html = await res.text();
      loadedCardHost.innerHTML = html;

      if (loadedScript) {
        loadedScript.remove();
        loadedScript = null;
      }

      const script = document.createElement("script");
      script.src = `cards/${cardName}.js?v=${Date.now()}`;
      script.defer = true;
      document.body.appendChild(script);
      loadedScript = script;

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

  function init() {
    wireCardNavButtons();
    wireSwipe();
    wireKeyboard();
    wireCardSelector();
    syncCurrentCardOnScroll();
    goToCard(0);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
