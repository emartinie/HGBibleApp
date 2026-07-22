(function () {
  let controller = null;
  let cleanup = [];
  let currentRef = "Genesis 1";

  const API_ROOT = "https://www.sefaria.org/api";
  const CATEGORY_FILTERS = {
    Commentary: ["Tanakh Commentary", "Mishnah Commentary", "Talmud Commentary"]
  };

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function stripHtml(value) {
    const div = document.createElement("div");
    div.innerHTML = String(value ?? "");
    return div.textContent || "";
  }

  function sefariaUrl(ref) {
    return `https://www.sefaria.org/${encodeURIComponent(ref).replace(/%20/g, "_")}`;
  }

  function bind(element, event, handler) {
    element?.addEventListener(event, handler);
    if (element) cleanup.push(() => element.removeEventListener(event, handler));
  }

  function normalizeHits(data) {
    if (Array.isArray(data?.hits?.hits)) return data.hits.hits;
    if (Array.isArray(data?.hits)) return data.hits;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }

  function resultSource(hit) {
    return hit?._source || hit?.source || hit || {};
  }

  function resultSnippet(hit) {
    const highlighted = hit?.highlight && Object.values(hit.highlight).flat().find(Boolean);
    if (highlighted) return stripHtml(highlighted);
    const source = resultSource(hit);
    return stripHtml(source.content || source.exact || source.naive_lemmatizer || source.text || "");
  }

  function renderMessage(root, message, tone = "text-slate-300") {
    root.innerHTML = `<div class="${tone}">${escapeHtml(message)}</div>`;
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, { ...options, signal: controller?.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || data?.detail || `Sefaria returned HTTP ${response.status}`);
    return data;
  }

  function renderSearchResults(root, hits, query, language) {
    const filtered = hits.filter((hit) => {
      if (language === "both") return true;
      const source = resultSource(hit);
      const lang = String(source.lang || source.language || "").toLowerCase();
      if (!lang) return true;
      return language === "hebrew" ? lang.startsWith("he") : lang.startsWith("en");
    });

    if (!filtered.length) {
      renderMessage(root, `No matching results for “${query}” in this collection.`, "text-amber-200");
      return;
    }

    root.innerHTML = `<div class="space-y-3">${filtered.map((hit) => {
      const source = resultSource(hit);
      const ref = source.ref || source.heRef || source.title || hit.ref || "Sefaria result";
      const heRef = source.heRef && source.heRef !== ref ? source.heRef : "";
      const snippet = resultSnippet(hit);
      const category = source.path || source.categories?.join(" › ") || source.category || "Jewish Library";
      const sheetUrl = source.sheetId ? `https://www.sefaria.org/sheets/${source.sheetId}` : "";
      return `<article class="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
        ${sheetUrl
          ? `<a class="text-amber-200 font-semibold hover:underline" href="${sheetUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref)}</a>`
          : `<button class="sefaria-result-ref text-left text-amber-200 font-semibold hover:underline" type="button" data-ref="${escapeHtml(ref)}">${escapeHtml(ref)}</button>`}
        ${heRef ? `<div class="text-right text-cyan-200 mt-1" dir="rtl" lang="he">${escapeHtml(heRef)}</div>` : ""}
        <div class="text-xs text-slate-500 mt-1">${escapeHtml(category)}</div>
        ${snippet ? `<p class="text-slate-300 mt-2">${escapeHtml(snippet.slice(0, 420))}</p>` : ""}
        <a class="text-xs text-cyan-300 hover:underline inline-block mt-2" href="${sheetUrl || sefariaUrl(ref)}" target="_blank" rel="noopener noreferrer">Open in Sefaria ↗</a>
      </article>`;
    }).join("")}</div>`;
  }

  async function searchLibrary(elements) {
    const query = elements.query.value.trim();
    if (!query) {
      renderMessage(elements.content, "Enter a word, phrase, topic, person, or place.", "text-amber-200");
      elements.query.focus();
      return;
    }

    controller?.abort();
    controller = new AbortController();
    renderMessage(elements.content, "Searching Sefaria’s Jewish library…");
    elements.meta.textContent = "Searching…";

    const category = elements.category.value;
    const isSheets = category === "Sheets";
    const body = {
      query,
      type: isSheets ? "sheet" : "text",
      field: isSheets ? "content" : (elements.exact.checked ? "exact" : "naive_lemmatizer"),
      filters: category && !isSheets ? (CATEGORY_FILTERS[category] || [category]) : [],
      filter_fields: [],
      aggs: [isSheets ? "topics" : "path"],
      size: 24,
      slop: elements.exact.checked ? 0 : 10,
      sort_method: "score",
      sort_fields: [isSheets ? "views" : "pagesheetrank"],
      source_proj: true
    };

    try {
      const data = await requestJson(`${API_ROOT}/search-wrapper`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const hits = normalizeHits(data);
      elements.meta.textContent = `${hits.length} result${hits.length === 1 ? "" : "s"} shown • ${category || "Entire Jewish Library"}`;
      renderSearchResults(elements.content, hits, query, elements.language.value);
      localStorage.setItem("jewishLibrarySearch", JSON.stringify({ query, category, language: elements.language.value, exact: elements.exact.checked }));
    } catch (error) {
      if (error.name === "AbortError") return;
      elements.meta.textContent = "Search unavailable";
      elements.content.innerHTML = `<div class="text-red-300">${escapeHtml(error.message)}</div>
        <a class="ui-btn inline-block mt-3" href="https://www.sefaria.org/search?q=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer">Continue search in Sefaria ↗</a>`;
    }
  }

  function textSegments(data, language) {
    const english = Array.isArray(data?.text) ? data.text : [];
    const hebrew = Array.isArray(data?.he) ? data.he : [];
    const length = Math.max(english.length, hebrew.length);
    return Array.from({ length }, (_, index) => ({
      number: index + 1,
      english: stripHtml(english[index] || ""),
      hebrew: stripHtml(hebrew[index] || ""),
      language
    }));
  }

  async function loadReference(elements, ref = elements.reference.value.trim()) {
    if (!ref) return;
    controller?.abort();
    controller = new AbortController();
    renderMessage(elements.content, `Loading ${ref}…`);
    elements.meta.textContent = "Loading reference…";

    try {
      const data = await requestJson(`${API_ROOT}/texts/${encodeURIComponent(ref).replace(/%20/g, ".")}?lang=bi&commentary=0&context=0`);
      const segments = textSegments(data, elements.language.value);
      if (!segments.length) throw new Error("No text was returned for that reference.");
      currentRef = data.ref || ref;
      elements.reference.value = currentRef;
      elements.open.href = sefariaUrl(currentRef);
      elements.meta.textContent = currentRef;
      elements.content.innerHTML = `<div class="space-y-3">${segments.map((segment) => `<article class="rounded-md border-b border-slate-800 pb-3">
        <span class="text-slate-500 mr-2">${segment.number}</span>
        ${segment.language !== "hebrew" && segment.english ? `<div class="text-slate-200">${escapeHtml(segment.english)}</div>` : ""}
        ${segment.language !== "english" && segment.hebrew ? `<div class="text-cyan-100 text-right text-lg mt-2" dir="rtl" lang="he">${escapeHtml(segment.hebrew)}</div>` : ""}
      </article>`).join("")}</div>`;
      localStorage.setItem("sefariaLastRef", currentRef);
    } catch (error) {
      if (error.name === "AbortError") return;
      elements.meta.textContent = "Reference unavailable";
      renderMessage(elements.content, error.message, "text-red-300");
    }
  }

  async function loadConnections(elements) {
    const ref = elements.reference.value.trim() || currentRef;
    controller?.abort();
    controller = new AbortController();
    renderMessage(elements.content, `Finding Jewish commentary, Midrash, Talmud, and related texts for ${ref}…`);
    elements.meta.textContent = "Exploring connections…";

    try {
      const links = await requestJson(`${API_ROOT}/links/${encodeURIComponent(ref)}?with_text=1&with_sheet_links=0`);
      const results = Array.isArray(links) ? links : [];
      if (!results.length) {
        renderMessage(elements.content, "Sefaria has no linked texts for this reference.", "text-amber-200");
        elements.meta.textContent = ref;
        return;
      }
      const groups = results.reduce((map, link) => {
        const category = link.category || link.type || "Related Texts";
        (map[category] ||= []).push(link);
        return map;
      }, {});
      elements.meta.textContent = `${results.length} connections • ${ref}`;
      elements.content.innerHTML = Object.entries(groups).map(([category, items]) => `<section class="mb-5">
        <h3 class="text-amber-200 font-semibold mb-2">${escapeHtml(category)} <span class="text-slate-500">(${items.length})</span></h3>
        <div class="space-y-2">${items.slice(0, 20).map((link) => {
          const linkedRef = link.ref || link.sourceRef || "Related text";
          const text = stripHtml(Array.isArray(link.text) ? link.text.join(" ") : link.text || "");
          return `<article class="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <button class="sefaria-result-ref text-left text-cyan-200 hover:underline" type="button" data-ref="${escapeHtml(linkedRef)}">${escapeHtml(linkedRef)}</button>
            ${text ? `<p class="text-slate-300 mt-2">${escapeHtml(text.slice(0, 360))}</p>` : ""}
          </article>`;
        }).join("")}</div>
      </section>`).join("");
    } catch (error) {
      if (error.name === "AbortError") return;
      elements.meta.textContent = "Connections unavailable";
      renderMessage(elements.content, error.message, "text-red-300");
    }
  }

  function stepChapter(elements, direction) {
    const match = elements.reference.value.trim().match(/^(.+?)\s+(\d+)$/);
    if (!match) {
      renderMessage(elements.content, "Previous/next works with chapter references such as Genesis 1.", "text-amber-200");
      return;
    }
    loadReference(elements, `${match[1]} ${Math.max(1, Number(match[2]) + direction)}`);
  }

  function initSefariaCard(host = document) {
    window.destroySefariaCard();
    const elements = {
      searchForm: host.querySelector("#jewishLibrarySearchForm"),
      query: host.querySelector("#jewishLibraryQuery"),
      category: host.querySelector("#jewishLibraryCategory"),
      language: host.querySelector("#jewishLibraryLanguage"),
      exact: host.querySelector("#jewishLibraryExact"),
      referenceForm: host.querySelector("#sefariaReferenceForm"),
      reference: host.querySelector("#sefariaReference"),
      prev: host.querySelector("#sefariaPrevBtn"),
      next: host.querySelector("#sefariaNextBtn"),
      connections: host.querySelector("#sefariaConnectionsBtn"),
      open: host.querySelector("#sefariaOpenBtn"),
      meta: host.querySelector("#sefariaMeta"),
      content: host.querySelector("#sefariaContent")
    };
    if (!elements.searchForm || !elements.content) return;

    bind(elements.searchForm, "submit", (event) => { event.preventDefault(); searchLibrary(elements); });
    bind(elements.referenceForm, "submit", (event) => { event.preventDefault(); loadReference(elements); });
    bind(elements.prev, "click", () => stepChapter(elements, -1));
    bind(elements.next, "click", () => stepChapter(elements, 1));
    bind(elements.connections, "click", () => loadConnections(elements));
    bind(elements.content, "click", (event) => {
      const button = event.target.closest(".sefaria-result-ref");
      if (button?.dataset.ref) loadReference(elements, button.dataset.ref);
    });

    try {
      const saved = JSON.parse(localStorage.getItem("jewishLibrarySearch") || "null");
      if (saved) {
        elements.query.value = saved.query || "";
        elements.category.value = saved.category || "";
        elements.language.value = saved.language || "both";
        elements.exact.checked = Boolean(saved.exact);
      }
    } catch { /* Ignore malformed saved preferences. */ }

    const routedRef = localStorage.getItem("sefariaSearch");
    let jump = null;
    try { jump = JSON.parse(localStorage.getItem("sefariaJump") || "null"); } catch { /* Ignore malformed route. */ }
    localStorage.removeItem("sefariaSearch");
    localStorage.removeItem("sefariaJump");
    const initialRef = routedRef || (jump?.book ? `${jump.book} ${jump.chapter || 1}` : "") || localStorage.getItem("sefariaLastRef");
    if (initialRef) loadReference(elements, initialRef);
  }

  window.initSefariaCard = initSefariaCard;
  window.destroySefariaCard = function () {
    controller?.abort();
    controller = null;
    cleanup.forEach((remove) => remove());
    cleanup = [];
  };
})();
