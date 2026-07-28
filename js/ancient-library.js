(() => {
  const CATEGORY_ORDER = ["second-temple", "historical", "early-christian", "lost-disputed"];
  let catalog = null;
  let activeRoot = null;
  let activeCategory = "all";

  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function buildLibraryUrl(itemId) {
    const url = new URL(window.location.href);
    url.searchParams.set("card", "ancient-library");
    url.searchParams.set("book", itemId);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function categoryById(id) {
    return catalog?.categories?.find(category => category.id === id);
  }

  function itemCard(item) {
    const category = categoryById(item.category);
    const survivalClass = item.survival === "lost" || item.survival === "disputed" ? " lost" : "";
    const sourceLink = item.sourceUrl
      ? `<a class="al-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">View verified external edition ↗</a>`
      : `<span class="al-muted-action">External edition being verified</span>`;

    return `
      <article class="al-item">
        <div class="al-badges">
          <span class="al-badge">${escapeHtml(category?.title || item.category)}</span>
          <span class="al-badge${survivalClass}">${escapeHtml(item.survival)}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="al-actions">
          <a class="al-link" href="${escapeHtml(buildLibraryUrl(item.id))}">About this work</a>
          ${sourceLink}
        </div>
      </article>`;
  }

  function renderCatalog() {
    if (!activeRoot || !catalog) return;
    const host = activeRoot.querySelector("#ancientLibraryCatalog");
    if (!host) return;

    const categories = CATEGORY_ORDER.filter(id => activeCategory === "all" || id === activeCategory);
    host.innerHTML = categories.map(categoryId => {
      const category = categoryById(categoryId);
      const items = catalog.items.filter(item => item.category === categoryId);
      return `
        <section class="al-section" data-category="${escapeHtml(categoryId)}">
          <h2>${escapeHtml(category?.title || categoryId)}</h2>
          <p class="al-section-note">${escapeHtml(category?.notice || "")}</p>
          <div class="al-grid">${items.map(itemCard).join("")}</div>
        </section>`;
    }).join("");
  }

  function renderDetail(itemId) {
    if (!activeRoot || !catalog || !itemId) return;
    const item = catalog.items.find(entry => entry.id === itemId);
    const detail = activeRoot.querySelector("#ancientLibraryDetail");
    const catalogHost = activeRoot.querySelector("#ancientLibraryCatalog");
    if (!item || !detail || !catalogHost) return;

    const category = categoryById(item.category);
    const source = item.sourceUrl
      ? `<p><a class="al-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">View ${escapeHtml(item.edition || "external edition")} at ${escapeHtml(item.sourceName || "the source archive")} ↗</a></p>`
      : `<p class="al-muted-action">A redistribution-safe edition has not yet been selected. No text will be imported until the exact edition and terms are verified.</p>`;

    detail.innerHTML = `
      <a class="al-back" href="?card=ancient-library">← Return to the complete library</a>
      <p class="al-status">${escapeHtml(item.status)}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <div class="al-badges">
        <span class="al-badge">${escapeHtml(category?.title || item.category)}</span>
        <span class="al-badge${item.survival !== "surviving" ? " lost" : ""}">${escapeHtml(item.survival)}</span>
      </div>
      <p>${escapeHtml(item.description)}</p>
      <p><strong>Approximate date:</strong> ${escapeHtml(item.date)}</p>
      ${item.edition ? `<p><strong>Edition under consideration:</strong> ${escapeHtml(item.edition)}</p>` : ""}
      <p class="al-authority">${escapeHtml(category?.notice || "This source is not presented as equal in authority to Scripture.")}</p>
      ${source}`;

    detail.hidden = false;
    catalogHost.hidden = true;
  }

  function wireFilters() {
    activeRoot.querySelectorAll(".al-filter").forEach(button => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category || "all";
        activeRoot.querySelectorAll(".al-filter").forEach(candidate => {
          candidate.setAttribute("aria-pressed", String(candidate === button));
        });
        activeRoot.querySelector("#ancientLibraryDetail").hidden = true;
        activeRoot.querySelector("#ancientLibraryCatalog").hidden = false;
        renderCatalog();
      });
    });
  }

  async function initAncientLibraryCard(root = document) {
    activeRoot = root.querySelector?.("#ancientLibraryCard") || document.querySelector("#ancientLibraryCard");
    if (!activeRoot) return;

    const host = activeRoot.querySelector("#ancientLibraryCatalog");
    try {
      const response = await fetch("data/ancient-library/catalog.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      catalog = await response.json();
      wireFilters();
      renderCatalog();
      renderDetail(new URLSearchParams(window.location.search).get("book"));
    } catch (error) {
      console.error("Ancient Library failed to load", error);
      if (host) host.innerHTML = '<p class="al-empty">The Ancient Library catalog could not be loaded. Please try again.</p>';
    }
  }

  function destroyAncientLibraryCard() {
    activeRoot = null;
    activeCategory = "all";
  }

  window.initAncientLibraryCard = initAncientLibraryCard;
  window.destroyAncientLibraryCard = destroyAncientLibraryCard;

  document.addEventListener("card:init", event => {
    if (event.detail?.cardName === "ancient-library") initAncientLibraryCard(event.target);
  });

  document.addEventListener("card:cleanup", event => {
    if (event.detail?.cardName === "ancient-library") destroyAncientLibraryCard();
  });
})();
