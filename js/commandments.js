(function () {
  const DATA_URL = "data/commandments/commandments.json";
  const COVENANT_ENGINE_URL = "js/covenant-engine.js";
  let covenantEnginePromise = null;
  let covenantRenderRequestId = 0;
  let lastRenderedCovenantContainer = null;
  let commandmentsPromise = null;
  let lastRenderedContainer = null;
  let activeFilter = "All";
  let searchQuery = "";
  let renderRequestId = 0;
  const initialRoute = window.HGRoute?.read?.();
  let activeCommandmentId = initialRoute?.card === "commandments" && initialRoute.id
    ? String(initialRoute.id)
    : "";
  const FILTERS = [
    "All",
    "Positive",
    "Negative",
    "Sacrifices",
    "Justice",
    "Temple",
    "Priests",
    "Agriculture",
    "Dietary",
    "Business"
  ];

  function loadCommandments() {
    if (!commandmentsPromise) {
      commandmentsPromise = fetch(DATA_URL).then((res) => {
        if (!res.ok) {
          throw new Error(`Could not load ${DATA_URL}`);
        }
        return res.json();
      });
    }

    return commandmentsPromise;
  }

  function appendText(parent, tagName, text, className) {
    const el = document.createElement(tagName);
    if (className) el.className = className;
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  function countWithList(items, key) {
    return items.filter((item) => Array.isArray(item[key]) && item[key].length > 0).length;
  }

  function countUniqueFromList(items, key) {
    const values = new Set();

    items.forEach((item) => {
      if (!Array.isArray(item[key])) return;
      item[key].forEach((value) => {
        if (value) values.add(value);
      });
    });

    return values.size;
  }

  function filterCommandments(commandments, filterName) {
    if (filterName === "Positive") {
      return commandments.filter((cmd) => cmd.type === "positive");
    }

    if (filterName === "Negative") {
      return commandments.filter((cmd) => cmd.type === "negative");
    }

    if (filterName === "Business") {
      return commandments.filter((cmd) => {
        const category = String(cmd.category || "");
        return category.includes("Loans") || category.includes("Business");
      });
    }

    if (filterName === "Priests") {
      return commandments.filter((cmd) => String(cmd.category || "").includes("Priest"));
    }

    if (filterName === "All") {
      return commandments;
    }

    return commandments.filter((cmd) => String(cmd.category || "").includes(filterName));
  }

  function getFilterDescription(filterName) {
    if (filterName === "All") return "loaded";
    if (filterName === "Positive") return "positive";
    if (filterName === "Negative") return "negative";
    return filterName;
  }

  function setFilterButtonClass(button, isActive) {
    button.className = isActive
      ? "rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-white"
      : "rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-400";
  }

  function searchCommandments(commandments, query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return commandments;

    return commandments.filter((cmd) => {
      const searchableText = [
        cmd.code,
        cmd.title,
        cmd.reference,
        cmd.category,
        Array.isArray(cmd.themes) ? cmd.themes.join(" ") : ""
      ].join(" ").toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }

  function loadCovenantEngine() {
    if (window.HGCovenants) return Promise.resolve(window.HGCovenants);
    if (covenantEnginePromise) return covenantEnginePromise;

    covenantEnginePromise = new Promise((resolve) => {
      const existing = document.querySelector('script[data-hg-covenant-engine="true"]');
      const finish = () => resolve(window.HGCovenants || null);

      if (existing) {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => resolve(null), { once: true });
        window.setTimeout(finish, 3000);
        return;
      }

      const script = document.createElement("script");
      script.src = COVENANT_ENGINE_URL;
      script.dataset.hgCovenantEngine = "true";
      script.onload = finish;
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });

    return covenantEnginePromise;
  }

  function firstReference(covenant) {
    const references = covenant.scriptureRange?.[0]?.references;
    return Array.isArray(references) && references.length ? references[0] : "References being prepared";
  }

  function renderCovenantOverview(container, covenant) {
    container.textContent = "";
    container.hidden = false;
    appendText(container, "p", covenant.classification?.status || "unclassified", "text-xs font-semibold uppercase tracking-wider text-amber-300");
    appendText(container, "h4", covenant.title, "mt-1 text-lg font-semibold text-orange-200");
    appendText(container, "p", covenant.summary || "", "mt-2 text-sm leading-relaxed text-slate-300");

    const facts = document.createElement("div");
    facts.className = "mt-3 grid gap-2 text-sm";

    const addFact = (label, value) => {
      if (!value) return;
      const row = document.createElement("p");
      row.className = "text-slate-300";
      const strong = document.createElement("strong");
      strong.className = "text-sky-200";
      strong.textContent = label + ": ";
      row.append(strong, document.createTextNode(value));
      facts.appendChild(row);
    };

    const references = (covenant.scriptureRange || [])
      .flatMap(item => Array.isArray(item.references) ? item.references : [])
      .join("; ");
    const signs = (covenant.covenantSign || []).map(item => item.summary).filter(Boolean).join("; ");

    addFact("Biblical references", references);
    addFact("Parties", (covenant.parties || []).join(", "));
    addFact("Mediator", covenant.mediator || "None identified in this record");
    addFact("Sign", signs || "No explicit sign identified in this record");
    container.appendChild(facts);
  }

  async function renderCovenantsIfReady() {
    const requestId = ++covenantRenderRequestId;
    const container = document.getElementById("covenantsLanding");
    const overview = document.getElementById("covenantOverview");
    if (!container || container === lastRenderedCovenantContainer) return;

    try {
      const engine = await loadCovenantEngine();
      const covenants = engine ? await engine.getAll() : [];
      if (requestId !== covenantRenderRequestId || !document.body.contains(container)) return;

      container.textContent = "";
      if (!covenants.length) {
        appendText(container, "p", "The covenant framework is temporarily unavailable. The commandments explorer remains available below.", "text-sm text-slate-400");
        lastRenderedCovenantContainer = container;
        return;
      }

      const grid = document.createElement("div");
      grid.className = "covenant-grid";

      covenants.forEach((covenant) => {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "covenant-tile";
        tile.dataset.covenantId = covenant.id;
        tile.setAttribute("aria-expanded", "false");
        tile.setAttribute("aria-controls", "covenantOverview");

        appendText(tile, "span", covenant.classification?.status || "unclassified", "covenant-status " + (covenant.classification?.status || ""));
        appendText(tile, "strong", covenant.title, "text-base text-amber-100");
        appendText(tile, "span", (covenant.parties || []).join(", "), "text-xs text-slate-300");
        appendText(tile, "span", firstReference(covenant), "text-xs text-sky-300");

        tile.addEventListener("click", () => {
          const wasOpen = tile.getAttribute("aria-expanded") === "true";
          grid.querySelectorAll("button").forEach(button => button.setAttribute("aria-expanded", "false"));
          if (wasOpen) {
            overview.hidden = true;
            overview.textContent = "";
            return;
          }
          tile.setAttribute("aria-expanded", "true");
          renderCovenantOverview(overview, covenant);
        });

        grid.appendChild(tile);
      });

      container.appendChild(grid);
      lastRenderedCovenantContainer = container;
    } catch {
      if (requestId !== covenantRenderRequestId || !document.body.contains(container)) return;
      container.textContent = "";
      appendText(container, "p", "The covenant framework is temporarily unavailable. The commandments explorer remains available below.", "text-sm text-slate-400");
      lastRenderedCovenantContainer = container;
    }
  }

  function renderPreview(container, commandments) {
    const positiveCount = commandments.filter((cmd) => cmd.type === "positive").length;
    const negativeCount = commandments.filter((cmd) => cmd.type === "negative").length;
    const scriptureLinkCount = countWithList(commandments, "nt_links");
    const sefariaLinkCount = countWithList(commandments, "sefaria_links");
    const categoryCount = new Set(commandments.map((cmd) => cmd.category).filter(Boolean)).size;
    const themeCount = countUniqueFromList(commandments, "themes");
    let visibleLimit = 10;

    container.textContent = "";

    const wrapper = document.createElement("div");
    wrapper.className = "space-y-3";

    appendText(wrapper, "h2", "\uD83D\uDCDC 613+ Commandments Dataset Preview", "text-xl font-semibold text-orange-300");

    const stats = document.createElement("div");
    stats.className = "grid gap-2";

    function appendStatGroup(title, lines) {
      const group = document.createElement("div");
      group.className = "space-y-1 rounded-lg border border-slate-700 bg-slate-900/70 p-3";

      appendText(group, "div", title, "text-xs font-semibold text-slate-400");
      lines.forEach((line) => {
        appendText(group, "div", line, "text-sm text-slate-200");
      });

      stats.appendChild(group);
    }

    appendStatGroup("Commandments", [`${commandments.length} loaded`]);
    appendStatGroup("Types", [`${positiveCount} Positive`, `${negativeCount} Negative`]);
    appendStatGroup("Connections", [`${scriptureLinkCount} Scripture Links`, `${sefariaLinkCount} Context References`]);
    appendStatGroup("Topics", [`${categoryCount} Categories`, `${themeCount} Themes`]);
    wrapper.appendChild(stats);

    const filterBar = document.createElement("div");
    filterBar.className = "flex flex-wrap gap-2";

    FILTERS.forEach((filterName) => {
      const button = document.createElement("button");
      button.type = "button";
      setFilterButtonClass(button, filterName === activeFilter);
      button.textContent = filterName;
      button.addEventListener("click", () => {
        activeCommandmentId = "";
        window.HGRoute?.setCardState?.("commandments", { id: null }, {
          announce: false,
          source: "commandment-filter"
        });
        activeFilter = filterName;
        visibleLimit = 10;
        filterBar.querySelectorAll("button").forEach((filterButton) => {
          setFilterButtonClass(filterButton, filterButton.textContent === activeFilter);
        });
        updateResults();
      });
      filterBar.appendChild(button);
    });

    wrapper.appendChild(filterBar);

    const searchRow = document.createElement("div");
    searchRow.className = "flex flex-wrap gap-2";

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "Search loaded commandments";
    searchInput.value = searchQuery;
    searchInput.className = "rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-white";
    searchInput.addEventListener("input", () => {
      activeCommandmentId = "";
      window.HGRoute?.setCardState?.("commandments", { id: null }, {
        replace: true,
        announce: false,
        source: "commandment-search"
      });
      searchQuery = searchInput.value;
      visibleLimit = 10;
      updateResults();
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-400";
    clearButton.textContent = "Clear";
    clearButton.addEventListener("click", () => {
      activeCommandmentId = "";
      window.HGRoute?.setCardState?.("commandments", { id: null }, {
        announce: false,
        source: "commandment-clear"
      });
      searchQuery = "";
      visibleLimit = 10;
      searchInput.value = "";
      searchInput.focus();
      updateResults();
    });

    searchRow.appendChild(searchInput);
    searchRow.appendChild(clearButton);
    wrapper.appendChild(searchRow);

    const countLine = document.createElement("div");
    countLine.className = "font-medium text-white";
    wrapper.appendChild(countLine);

    const list = document.createElement("div");
    list.className = "space-y-2";
    wrapper.appendChild(list);

    function updateResults() {
      const filteredCommandments = filterCommandments(commandments, activeFilter);
      const searchedCommandments = activeCommandmentId
        ? commandments.filter(cmd => String(cmd.id) === activeCommandmentId)
        : searchCommandments(filteredCommandments, searchQuery);
      const visibleCommandments = searchedCommandments.slice(0, visibleLimit);
      const visibleCount = visibleCommandments.length;
      const filterDescription = getFilterDescription(activeFilter);
      const trimmedQuery = searchQuery.trim();

      countLine.textContent = trimmedQuery
        ? `Showing ${visibleCount} of ${searchedCommandments.length} ${filterDescription} commandments matching "${trimmedQuery}".`
        : `Showing ${visibleCount} of ${filteredCommandments.length} ${filterDescription} commandments.`;

      list.textContent = "";

      if (!searchedCommandments.length) {
        appendText(
          list,
          "div",
          trimmedQuery ? "No commandments found for this search." : "No commandments found for this filter.",
          "text-xs text-slate-400"
        );
      }

      visibleCommandments.forEach((cmd) => {
        const row = document.createElement("div");
        row.className = "space-y-1 rounded-lg border border-slate-700 bg-slate-900/70 p-3";
        row.dataset.commandmentId = String(cmd.id);
        row.tabIndex = 0;
        row.setAttribute("role", "link");
        row.setAttribute("aria-label", "Open permanent link for commandment " + cmd.id);

        const selectCommandment = () => {
          activeCommandmentId = String(cmd.id);
          window.HGRoute?.setCardState?.("commandments", { id: activeCommandmentId }, {
            announce: false,
            source: "commandment"
          });
          updateResults();
        };

        row.addEventListener("click", selectCommandment);
        row.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectCommandment();
          }
        });

        appendText(row, "div", cmd.title || "Untitled commandment", "font-semibold text-white");
        appendText(row, "div", cmd.reference || "No reference listed", "text-xs text-slate-300");
        appendText(row, "div", `${cmd.type || "unknown"} • ${cmd.category || "Uncategorized"}`, "text-xs text-slate-400");

        row.lastChild.textContent = `${cmd.code || "No code"} \u2022 ${cmd.type || "unknown"} \u2022 ${cmd.category || "Uncategorized"}`;
        if (Array.isArray(cmd.themes) && cmd.themes.length) {
          const themes = document.createElement("div");
          themes.className = "flex flex-wrap gap-2 pt-1";

          cmd.themes.forEach((theme) => {
            appendText(
              themes,
              "span",
              theme,
              "rounded-lg border border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300"
            );
          });

          row.appendChild(themes);
        }

        if (cmd.commentary) {
          appendText(row, "div", cmd.commentary, "text-xs text-slate-300");
        }

        list.appendChild(row);
      });

      if (visibleCount < searchedCommandments.length) {
        const showMoreButton = document.createElement("button");
        showMoreButton.type = "button";
        showMoreButton.className = "rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-400";
        showMoreButton.textContent = "Show 10 more";
        showMoreButton.addEventListener("click", () => {
          visibleLimit += 10;
          updateResults();
        });
        list.appendChild(showMoreButton);
      }
    }

    updateResults();
    appendText(wrapper, "div", "Full explorer coming soon", "text-xs text-slate-400");
    container.appendChild(wrapper);
    lastRenderedContainer = container;
  }

  async function renderIfReady() {
    const requestId = ++renderRequestId;
    const container = document.getElementById("commandmentsList");
    if (!container || container === lastRenderedContainer) return;

    container.textContent = "Loading commandments dataset...";

    try {
      const commandments = await loadCommandments();
      if (requestId !== renderRequestId) return;
      if (!document.body.contains(container)) return;

      renderPreview(container, Array.isArray(commandments) ? commandments : []);
    } catch (err) {
      if (requestId !== renderRequestId) return;
      container.textContent = "Failed to load commandments dataset.";
      console.error("[commandments] dataset preview failed", err);
    }
  }

  function initCommandmentsCard() {
    renderCovenantsIfReady();
    renderIfReady();
  }

  function destroyCommandmentsCard() {
    renderRequestId++;
    covenantRenderRequestId++;
    lastRenderedContainer = null;
    lastRenderedCovenantContainer = null;
  }

  window.initCommandmentsCard = initCommandmentsCard;
  window.destroyCommandmentsCard = destroyCommandmentsCard;

  window.HGRoute?.registerCard?.("commandments", {
    getState() {
      return activeCommandmentId ? { id: activeCommandmentId } : {};
    },
    async restore(route) {
      activeCommandmentId = route?.card === "commandments" && route.id
        ? String(route.id)
        : "";
      lastRenderedContainer = null;
      await renderIfReady();
    }
  });

  initCommandmentsCard();
})();
