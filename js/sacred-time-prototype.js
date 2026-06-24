(function () {
  const DATA_URL = "../data/appointed-times-sample.json";

  const state = {
    entries: [],
    filtered: [],
    view: "timeline",
    filters: {
      search: "",
      category: "",
      theme: "",
      certainty: ""
    }
  };

  const els = {
    shell: document.getElementById("sacredTimePrototype"),
    statEntries: document.getElementById("statEntries"),
    statCategories: document.getElementById("statCategories"),
    statThemes: document.getElementById("statThemes"),
    statReview: document.getElementById("statReview"),
    searchInput: document.getElementById("searchInput"),
    categoryFilter: document.getElementById("categoryFilter"),
    themeFilter: document.getElementById("themeFilter"),
    certaintyFilter: document.getElementById("certaintyFilter"),
    timelineViewBtn: document.getElementById("timelineViewBtn"),
    listViewBtn: document.getElementById("listViewBtn"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),
    timelineRail: document.getElementById("timelineRail"),
    entryList: document.getElementById("entryList"),
    resultsCount: document.getElementById("resultsCount")
  };

  const lensLabels = {
    biblical: "Explicit biblical date",
    tradition: "Tradition",
    history: "Historical reconstruction",
    theological: "Theological association",
    review: "Disputed or needs review",
    unknown: "Uncertain or undated"
  };

  function text(value) {
    if (value === null || value === undefined || value === "") return "Not specified";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "None listed";
    return String(value);
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatLabel(value) {
    return text(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  function uniqueFrom(entries, getter) {
    const values = new Set();
    entries.forEach(entry => {
      const result = getter(entry);
      const list = Array.isArray(result) ? result : [result];
      list.filter(Boolean).forEach(value => values.add(value));
    });
    return Array.from(values).sort((a, b) => formatLabel(a).localeCompare(formatLabel(b)));
  }

  function certaintyValues(entry) {
    const values = [
      entry.chronology_confidence,
      entry.hebrew_date && entry.hebrew_date.certainty,
      entry.traditional_year && entry.traditional_year.certainty,
      entry.gregorian_date && entry.gregorian_date.certainty,
      entry.date_type,
      entry.status
    ];

    (entry.traditions || []).forEach(item => values.push(item.certainty));
    (entry.viewpoints || []).forEach(item => values.push(item.certainty));

    return values.filter(Boolean);
  }

  function visualLens(entry) {
    const certainties = new Set(certaintyValues(entry));

    if (entry.status === "needs_review" || entry.date_type === "disputed" || certainties.has("historical_disputed") || certainties.has("uncertain")) {
      return "review";
    }

    if (certainties.has("thematic_association")) return "theological";
    if (entry.date_type === "historical_reconstruction" || certainties.has("historical_consensus")) return "history";
    if (certainties.has("strong_tradition") || certainties.has("traditional") || entry.date_type === "traditional_association") return "tradition";
    if (certainties.has("explicit_biblical_date") || entry.date_type === "fixed_hebrew_date" || entry.date_type === "relative_biblical_date") return "biblical";

    return "unknown";
  }

  function dateSummary(entry) {
    if (entry.hebrew_date && entry.hebrew_date.display) return entry.hebrew_date.display;
    if (entry.gregorian_date && entry.gregorian_date.display) return entry.gregorian_date.display;
    if (entry.traditional_year && entry.traditional_year.label) return entry.traditional_year.label;
    return "Undated";
  }

  function primarySourceNote(entry) {
    const tradition = (entry.traditions || [])[0];
    if (tradition && (tradition.tradition || tradition.source_note)) {
      return {
        label: tradition.name || "Tradition",
        body: tradition.tradition || tradition.source_note,
        source: tradition.source_note
      };
    }

    if (entry.hebrew_date && entry.hebrew_date.source_note) {
      return {
        label: "Date note",
        body: entry.hebrew_date.source_note,
        source: ""
      };
    }

    const source = (entry.source_notes || [])[0];
    if (source) {
      return {
        label: source.label || "Source note",
        body: source.note,
        source: source.url || ""
      };
    }

    return {
      label: "Source note",
      body: "No source note listed yet.",
      source: ""
    };
  }

  function populateSelect(select, values, placeholder) {
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
    values.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = formatLabel(value);
      select.appendChild(option);
    });
  }

  function renderStats() {
    const categories = uniqueFrom(state.entries, entry => entry.category || []);
    const themes = uniqueFrom(state.entries, entry => entry.themes || []);
    const reviewCount = state.entries.filter(entry => visualLens(entry) === "review").length;

    els.statEntries.textContent = state.entries.length;
    els.statCategories.textContent = categories.length;
    els.statThemes.textContent = themes.length;
    els.statReview.textContent = reviewCount;
  }

  function renderFilters() {
    populateSelect(els.categoryFilter, uniqueFrom(state.entries, entry => entry.category || []), "All categories");
    populateSelect(els.themeFilter, uniqueFrom(state.entries, entry => entry.themes || []), "All themes");
    populateSelect(els.certaintyFilter, uniqueFrom(state.entries, certaintyValues), "All certainty labels");
  }

  function matchesEntry(entry) {
    const search = state.filters.search.trim().toLowerCase();
    const searchable = [
      entry.title,
      entry.description,
      entry.id,
      ...(entry.scripture_refs || []),
      ...(entry.themes || []),
      ...(entry.category || []),
      ...(entry.related_events || []),
      ...(entry.related_appointed_times || []),
      ...((entry.traditions || []).map(item => `${item.name} ${item.tradition} ${item.source_note}`)),
      ...((entry.source_notes || []).map(item => `${item.label} ${item.note}`))
    ].join(" ").toLowerCase();

    if (search && !searchable.includes(search)) return false;
    if (state.filters.category && !(entry.category || []).includes(state.filters.category)) return false;
    if (state.filters.theme && !(entry.themes || []).includes(state.filters.theme)) return false;
    if (state.filters.certainty && !certaintyValues(entry).includes(state.filters.certainty)) return false;

    return true;
  }

  function renderPills(items, fallback) {
    const values = items && items.length ? items : [fallback];
    return values.map(item => `<span class="tag">${escapeHtml(item)}</span>`).join("");
  }

  function renderRelations(entry) {
    const related = [
      ...(entry.related_appointed_times || []).map(item => `Time: ${item}`),
      ...(entry.related_events || []).map(item => `Event: ${item}`)
    ];
    return renderPills(related, "No relationships listed");
  }

  function renderEntry(entry) {
    const lens = visualLens(entry);
    const note = primarySourceNote(entry);
    const compact = state.view === "list" ? " compact" : "";
    const traditionSource = note.source ? `<div><strong>Source:</strong> ${escapeHtml(note.source)}</div>` : "";
    const traditionalYear = entry.traditional_year && entry.traditional_year.label
      ? entry.traditional_year.label
      : entry.traditional_year && entry.traditional_year.value
        ? `${entry.traditional_year.system}: ${entry.traditional_year.value}`
        : "Not specified";

    return `
      <article class="entry-card ${lens}${compact}">
        <div class="entry-top">
          <div>
            <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
            <p class="entry-summary">${escapeHtml(entry.description)}</p>
          </div>
          <div class="signal">${escapeHtml(lensLabels[lens] || lensLabels.unknown)}</div>
        </div>

        <div class="fact-grid">
          <div class="fact">
            <span>Hebrew date</span>
            <strong>${escapeHtml(dateSummary(entry))}</strong>
          </div>
          <div class="fact">
            <span>Scripture</span>
            <strong>${escapeHtml(text(entry.scripture_refs))}</strong>
          </div>
          <div class="fact">
            <span>Certainty</span>
            <strong>${escapeHtml(formatLabel(entry.chronology_confidence || "unknown"))}</strong>
          </div>
          <div class="fact">
            <span>Date type</span>
            <strong>${escapeHtml(formatLabel(entry.date_type))}</strong>
          </div>
          <div class="fact">
            <span>Traditional year</span>
            <strong>${escapeHtml(traditionalYear)}</strong>
          </div>
          <div class="fact">
            <span>Status</span>
            <strong>${escapeHtml(formatLabel(entry.status || "draft"))}</strong>
          </div>
        </div>

        <div>
          <div class="pill">Themes</div>
          <div class="tag-row">${renderPills(entry.themes, "No themes listed")}</div>
        </div>

        <div>
          <div class="pill">Categories</div>
          <div class="tag-row">${renderPills(entry.category, "No categories listed")}</div>
        </div>

        <div>
          <div class="pill">Related appointed times and events</div>
          <div class="link-row">${renderRelations(entry)}</div>
        </div>

        <div class="note-panel">
          <div><strong>${escapeHtml(note.label)}:</strong> ${escapeHtml(note.body)}</div>
          ${traditionSource}
        </div>
      </article>
    `;
  }

  function renderRail() {
    if (!state.filtered.length) {
      els.timelineRail.innerHTML = `<div class="empty-state">No entries match the current filters.</div>`;
      return;
    }

    els.timelineRail.innerHTML = state.filtered.map((entry, index) => {
      const lens = visualLens(entry);
      return `
        <div class="rail-item">
          <span class="rail-dot" style="--accent: var(--${lensColorVar(lens)});"></span>
          <span>
            <strong>${index + 1}. ${escapeHtml(entry.title)}</strong>
            ${escapeHtml(dateSummary(entry))}
          </span>
        </div>
      `;
    }).join("");
  }

  function lensColorVar(lens) {
    const map = {
      biblical: "blue",
      tradition: "gold",
      history: "green",
      theological: "violet",
      review: "rose",
      unknown: "muted"
    };
    return map[lens] || "muted";
  }

  function renderResults() {
    state.filtered = state.entries.filter(matchesEntry);
    els.resultsCount.textContent = `${state.filtered.length} of ${state.entries.length} entries`;

    if (!state.filtered.length) {
      els.entryList.innerHTML = `<div class="empty-state">No entries match those filters. Clear one field and the path should open back up.</div>`;
      renderRail();
      return;
    }

    els.entryList.innerHTML = state.filtered.map(renderEntry).join("");
    renderRail();
  }

  function setView(view) {
    state.view = view;
    const timeline = view === "timeline";
    els.shell.classList.toggle("timeline-mode", timeline);
    els.timelineViewBtn.setAttribute("aria-pressed", String(timeline));
    els.listViewBtn.setAttribute("aria-pressed", String(!timeline));
    renderResults();
  }

  function bindEvents() {
    els.searchInput.addEventListener("input", event => {
      state.filters.search = event.target.value;
      renderResults();
    });

    els.categoryFilter.addEventListener("change", event => {
      state.filters.category = event.target.value;
      renderResults();
    });

    els.themeFilter.addEventListener("change", event => {
      state.filters.theme = event.target.value;
      renderResults();
    });

    els.certaintyFilter.addEventListener("change", event => {
      state.filters.certainty = event.target.value;
      renderResults();
    });

    els.timelineViewBtn.addEventListener("click", () => setView("timeline"));
    els.listViewBtn.addEventListener("click", () => setView("list"));

    els.clearFiltersBtn.addEventListener("click", () => {
      state.filters.search = "";
      state.filters.category = "";
      state.filters.theme = "";
      state.filters.certainty = "";
      els.searchInput.value = "";
      els.categoryFilter.value = "";
      els.themeFilter.value = "";
      els.certaintyFilter.value = "";
      renderResults();
    });
  }

  async function loadData() {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load ${DATA_URL}`);
    }
    const data = await response.json();
    state.entries = (data.entries || []).slice(0, 30);
  }

  async function init() {
    bindEvents();

    try {
      await loadData();
      renderStats();
      renderFilters();
      renderResults();
    } catch (error) {
      els.resultsCount.textContent = "Dataset did not load";
      els.entryList.innerHTML = `
        <div class="error-state">
          <strong>Could not load the sample dataset.</strong>
          <div>Open this prototype through a local server from the project root so the browser can fetch ${escapeHtml(DATA_URL)}.</div>
        </div>
      `;
      console.error(error);
    }
  }

  init();
})();
