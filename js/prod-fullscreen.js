(function () {
  function resizeLeafletMapsInside(card) {
    if (!card || typeof window.L === "undefined") return;

    setTimeout(() => {
      card.querySelectorAll(".leaflet-container").forEach((el) => {
        if (el._leaflet_map && typeof el._leaflet_map.invalidateSize === "function") {
          el._leaflet_map.invalidateSize();
        }
      });
    }, 180);
  }

  function setFullscreen(card, shouldFullscreen) {
    const cardsRow = document.getElementById("cardsRow");
    const body = document.body;

    if (!card) return;

    // clear any other fullscreen cards first
    document.querySelectorAll(".card.card-fullscreen").forEach((c) => {
      if (c !== card) c.classList.remove("card-fullscreen");
    });

    card.classList.toggle("card-fullscreen", shouldFullscreen);

    const hasAnyFullscreen = !!document.querySelector(".card.card-fullscreen");
    body.classList.toggle("has-fullscreen-card", hasAnyFullscreen);
    cardsRow?.classList.toggle("has-fullscreen-card", hasAnyFullscreen);

    const btn = card.querySelector(".card-fullscreen-btn");
    if (btn) {
      btn.setAttribute("aria-pressed", shouldFullscreen ? "true" : "false");
      btn.setAttribute("title", shouldFullscreen ? "Exit fullscreen" : "Expand");
      btn.textContent = shouldFullscreen ? "✕" : "⛶";
    }

    resizeLeafletMapsInside(card);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".card-fullscreen-btn");
    if (!btn) return;

    const card = btn.closest(".card");
    if (!card) return;

    const willOpen = !card.classList.contains("card-fullscreen");
    setFullscreen(card, willOpen);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    const active = document.querySelector(".card.card-fullscreen");
    if (active) setFullscreen(active, false);
  });

  window.setCardFullscreen = setFullscreen;
})();
