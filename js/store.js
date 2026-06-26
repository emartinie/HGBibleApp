(function () {
  const STORE_EMAIL = "orders@homegroups.org";

  let activeController = null;
  let selectedItem = null;

  function getRoot(host) {
    return host?.querySelector?.("#simpleStoreCard") || document.getElementById("simpleStoreCard");
  }

  function getEls(root) {
    return {
      root,
      panel: root.querySelector("#storeRequestPanel"),
      title: root.querySelector("#storeRequestTitle"),
      meta: root.querySelector("#storeRequestMeta"),
      name: root.querySelector("#storeName"),
      contact: root.querySelector("#storeContact"),
      notes: root.querySelector("#storeNotes"),
      email: root.querySelector("#storeEmailBtn"),
      close: root.querySelector("#storeCloseBtn"),
      status: root.querySelector("#storeStatus")
    };
  }

  function setStatus(els, message) {
    if (els.status) els.status.textContent = message || "";
  }

  function openRequest(els, productCard) {
    selectedItem = {
      name: productCard.dataset.storeProduct || "Store item",
      price: productCard.dataset.storePrice || "Price pending"
    };

    if (els.title) els.title.textContent = `Request: ${selectedItem.name}`;
    if (els.meta) els.meta.textContent = `${selectedItem.price} • Availability, payment, and shipping are confirmed manually.`;
    if (els.notes && !els.notes.value.trim()) els.notes.value = `I would like to request ${selectedItem.name}.`;

    els.panel?.classList.add("is-open");
    setStatus(els, "Fill in your contact info, then create an email request.");
    els.panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    els.name?.focus();
  }

  function closeRequest(els) {
    els.panel?.classList.remove("is-open");
    setStatus(els, "");
  }

  function createEmail(els) {
    if (!selectedItem) {
      setStatus(els, "Choose an item first.");
      return;
    }

    const name = els.name?.value.trim() || "";
    const contact = els.contact?.value.trim() || "";
    const notes = els.notes?.value.trim() || "";

    const subject = encodeURIComponent(`Store Request: ${selectedItem.name}`);
    const body = encodeURIComponent([
      `Item: ${selectedItem.name}`,
      `Price shown: ${selectedItem.price}`,
      `Name: ${name}`,
      `Contact: ${contact}`,
      "",
      "Notes:",
      notes
    ].join("\n"));

    window.location.href = `mailto:${STORE_EMAIL}?subject=${subject}&body=${body}`;
    setStatus(els, "Opening your email app with the request details.");
  }

  function previewImage(productCard) {
    const img = productCard.querySelector("img");
    if (!img?.src) return;
    window.open(img.src, "_blank", "noopener,noreferrer");
  }

  function initStoreCard(host) {
    destroyStoreCard();

    const root = getRoot(host);
    if (!root) return;

    activeController = new AbortController();
    const els = getEls(root);

    root.querySelectorAll(".store-product").forEach(productCard => {
      productCard.querySelector(".store-request-btn")?.addEventListener("click", event => {
        event.preventDefault();
        openRequest(els, productCard);
      }, { signal: activeController.signal });

      productCard.querySelector(".store-preview-btn")?.addEventListener("click", () => {
        previewImage(productCard);
      }, { signal: activeController.signal });
    });

    els.close?.addEventListener("click", () => closeRequest(els), {
      signal: activeController.signal
    });

    els.email?.addEventListener("click", () => createEmail(els), {
      signal: activeController.signal
    });
  }

  function destroyStoreCard() {
    selectedItem = null;

    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  }

  window.initStoreCard = initStoreCard;
  window.destroyStoreCard = destroyStoreCard;

  document.addEventListener("card:init", event => {
    if (event.detail?.cardName === "store") {
      initStoreCard(event.target);
    }
  });

  queueMicrotask(() => {
    const root = getRoot(document);
    if (root) initStoreCard(root.closest("#loadedCardHost") || document);
  });
})();
