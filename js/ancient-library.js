(() => {
  const CATEGORY_ORDER = ["second-temple", "historical", "early-christian", "lost-disputed"];
  const READER_BOOKS = new Set(["1-enoch", "jubilees"]);
  let catalog = null;
  let activeRoot = null;
  let activeCategory = "all";
  let activeBookData = null;

  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function buildLibraryUrl(itemId, chapter) {
    const url = new URL(window.location.href);
    url.searchParams.set("card", "ancient-library");
    if (itemId) url.searchParams.set("book", itemId);
    else url.searchParams.delete("book");
    if (chapter) url.searchParams.set("chapter", String(chapter));
    else url.searchParams.delete("chapter");
    url.searchParams.delete("q");
    url.hash = "";
    return `${url.pathname}${url.search}`;
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
    const readerLink = READER_BOOKS.has(item.id)
      ? `<a class="al-reader-link" href="${escapeHtml(buildLibraryUrl(item.id, 1))}">Read in the app →</a>`
      : `<a class="al-link" href="${escapeHtml(buildLibraryUrl(item.id))}">About this work</a>`;

    return `
      <article class="al-item">
        <div class="al-badges">
          <span class="al-badge">${escapeHtml(category?.title || item.category)}</span>
          <span class="al-badge${survivalClass}">${escapeHtml(item.survival)}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="al-actions">${readerLink}${sourceLink}</div>
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

  function showDetailHost() {
    const detail = activeRoot?.querySelector("#ancientLibraryDetail");
    const catalogHost = activeRoot?.querySelector("#ancientLibraryCatalog");
    if (detail) detail.hidden = false;
    if (catalogHost) catalogHost.hidden = true;
    return detail;
  }

  function renderDetail(itemId) {
    if (!activeRoot || !catalog || !itemId) return;
    const item = catalog.items.find(entry => entry.id === itemId);
    const detail = showDetailHost();
    if (!item || !detail) return;

    const category = categoryById(item.category);
    const source = item.sourceUrl
      ? `<p><a class="al-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">View ${escapeHtml(item.edition || "external edition")} at ${escapeHtml(item.sourceName || "the source archive")} ↗</a></p>`
      : `<p class="al-muted-action">A redistribution-safe edition has not yet been selected. No text will be imported until the exact edition and terms are verified.</p>`;
    const readAction = READER_BOOKS.has(item.id)
      ? `<p><a class="al-reader-link" href="${escapeHtml(buildLibraryUrl(item.id, 1))}">Begin reading chapter 1 →</a></p>`
      : "";

    detail.innerHTML = `
      <a class="al-back" href="${escapeHtml(buildLibraryUrl())}">← Return to the complete library</a>
      <p class="al-status">${escapeHtml(item.status)}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <div class="al-badges">
        <span class="al-badge">${escapeHtml(category?.title || item.category)}</span>
        <span class="al-badge${item.survival !== "surviving" ? " lost" : ""}">${escapeHtml(item.survival)}</span>
      </div>
      <p>${escapeHtml(item.description)}</p>
      <p><strong>Approximate date:</strong> ${escapeHtml(item.date)}</p>
      ${item.edition ? `<p><strong>Edition:</strong> ${escapeHtml(item.edition)}</p>` : ""}
      <p class="al-authority">${escapeHtml(category?.notice || "This source is not presented as equal in authority to Scripture.")}</p>
      ${readAction}${source}`;
  }

  function renderVerses(chapter) {
    return chapter.verses.map(verse => `
      <p class="al-verse" id="al-verse-${escapeHtml(verse.number)}">
        <a class="al-verse-number" href="#al-verse-${escapeHtml(verse.number)}" aria-label="Verse ${escapeHtml(verse.number)}">${escapeHtml(verse.number)}</a>
        <span>${escapeHtml(verse.text)}</span>
      </p>`).join("");
  }

  function renderReaderSearchResults(query) {
    const resultsHost = activeRoot?.querySelector("#alSearchResults");
    if (!resultsHost || !activeBookData) return;
    const term = query.trim().toLocaleLowerCase();
    if (!term) {
      resultsHost.innerHTML = "";
      resultsHost.hidden = true;
      return;
    }

    const matches = [];
    for (const chapter of activeBookData.chapters) {
      for (const verse of chapter.verses) {
        if (verse.text.toLocaleLowerCase().includes(term)) {
          matches.push({ chapter: chapter.number, verse: verse.number, text: verse.text });
          if (matches.length >= 100) break;
        }
      }
      if (matches.length >= 100) break;
    }

    resultsHost.hidden = false;
    resultsHost.innerHTML = `
      <div class="al-search-summary">${matches.length ? `${matches.length}${matches.length === 100 ? "+" : ""} matches` : "No matches"} for “${escapeHtml(query)}”</div>
      ${matches.map(match => `
        <a class="al-search-result" href="${escapeHtml(buildLibraryUrl(activeBookData.id, match.chapter))}#al-verse-${escapeHtml(match.verse)}">
          <strong>${escapeHtml(activeBookData.shortTitle)} ${escapeHtml(match.chapter)}:${escapeHtml(match.verse)}</strong>
          <span>${escapeHtml(match.text.replaceAll("\n", " ").slice(0, 180))}${match.text.length > 180 ? "…" : ""}</span>
        </a>`).join("")}`;
  }

  function wireReader(chapterNumber) {
    const select = activeRoot.querySelector("#alChapterSelect");
    const search = activeRoot.querySelector("#alBookSearch");
    const copy = activeRoot.querySelector("#alCopyChapterLink");

    select?.addEventListener("change", () => {
      window.location.href = buildLibraryUrl(activeBookData.id, Number(select.value));
    });

    search?.addEventListener("input", () => renderReaderSearchResults(search.value));

    copy?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        copy.textContent = "Link copied";
      } catch {
        copy.textContent = "Copy the address above";
      }
      setTimeout(() => { copy.textContent = "Copy chapter link"; }, 1800);
    });

    const pendingQuery = new URLSearchParams(window.location.search).get("q");
    if (pendingQuery && search) {
      search.value = pendingQuery;
      renderReaderSearchResults(pendingQuery);
    }

    requestAnimationFrame(() => {
      const hashTarget = window.location.hash && activeRoot.querySelector(window.location.hash);
      hashTarget?.scrollIntoView({ block: "center" });
    });
  }

  async function renderReader(itemId, requestedChapter) {
    const detail = showDetailHost();
    if (!detail) return;
    const catalogItem = catalog.items.find(entry => entry.id === itemId);
    detail.innerHTML = `<p class="al-empty">Loading ${escapeHtml(catalogItem?.title || "book")}…</p>`;

    const response = await fetch(`data/ancient-library/${itemId}/book.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Book request failed: ${response.status}`);
    activeBookData = await response.json();

    const maximum = activeBookData.chapters.length;
    const chapterNumber = Math.max(1, Math.min(Number(requestedChapter) || 1, maximum));
    const chapter = activeBookData.chapters.find(entry => entry.number === chapterNumber);
    const previous = chapterNumber > 1 ? buildLibraryUrl(itemId, chapterNumber - 1) : null;
    const next = chapterNumber < maximum ? buildLibraryUrl(itemId, chapterNumber + 1) : null;

    detail.innerHTML = `
      <div class="al-reader-heading">
        <a class="al-back" href="${escapeHtml(buildLibraryUrl(itemId))}">← About ${escapeHtml(activeBookData.shortTitle)}</a>
        <p class="al-status">R. H. Charles · 1917 · Public-domain edition</p>
        <h2>${escapeHtml(activeBookData.shortTitle)} — Chapter ${chapterNumber}</h2>
        <p class="al-authority">${escapeHtml(activeBookData.authorityNotice)}</p>
      </div>
      <div class="al-reader-tools" data-swipe-nav="ignore">
        <label>Chapter
          <select id="alChapterSelect" aria-label="Select chapter">
            ${activeBookData.chapters.map(entry => `<option value="${entry.number}"${entry.number === chapterNumber ? " selected" : ""}>${entry.number}</option>`).join("")}
          </select>
        </label>
        <label class="al-search-label">Search this book
          <input id="alBookSearch" type="search" placeholder="Search all ${maximum} chapters" autocomplete="off">
        </label>
        <button id="alCopyChapterLink" type="button">Copy chapter link</button>
      </div>
      <div id="alSearchResults" class="al-search-results" hidden></div>
      <nav class="al-chapter-nav" aria-label="Chapter navigation">
        ${previous ? `<a href="${escapeHtml(previous)}">← Chapter ${chapterNumber - 1}</a>` : "<span></span>"}
        ${next ? `<a href="${escapeHtml(next)}">Chapter ${chapterNumber + 1} →</a>` : "<span></span>"}
      </nav>
      <article class="al-reading-text" aria-label="${escapeHtml(activeBookData.shortTitle)} chapter ${chapterNumber}">${renderVerses(chapter)}</article>
      <nav class="al-chapter-nav" aria-label="Chapter navigation">
        ${previous ? `<a href="${escapeHtml(previous)}">← Chapter ${chapterNumber - 1}</a>` : "<span></span>"}
        ${next ? `<a href="${escapeHtml(next)}">Chapter ${chapterNumber + 1} →</a>` : "<span></span>"}
      </nav>
      <footer class="al-source-note">
        <strong>Text:</strong> R. H. Charles, first published ${escapeHtml(activeBookData.originalPublication)}.
        <a href="${escapeHtml(activeBookData.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(activeBookData.source.name)} ↗</a>
        <a href="${escapeHtml(activeBookData.externalSources[0].url)}" target="_blank" rel="noopener noreferrer">Sacred Texts ↗</a>
      </footer>`;

    wireReader(chapterNumber);
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

      const params = new URLSearchParams(window.location.search);
      const itemId = params.get("book");
      const chapter = params.get("chapter");
      if (itemId && chapter && READER_BOOKS.has(itemId)) await renderReader(itemId, chapter);
      else renderDetail(itemId);
    } catch (error) {
      console.error("Ancient Library failed to load", error);
      if (host) host.innerHTML = '<p class="al-empty">The Ancient Library could not be loaded. Please try again.</p>';
    }
  }

  function destroyAncientLibraryCard() {
    activeRoot = null;
    activeCategory = "all";
    activeBookData = null;
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
