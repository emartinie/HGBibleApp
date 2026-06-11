(function () {
  const DATA_URL = "data/commandments/commandments.json";
  let commandmentsPromise = null;
  let lastRenderedContainer = null;
  let activeFilter = "All";
  let searchQuery = "";
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

  function renderPreview(container, commandments) {
    const positiveCount = commandments.filter((cmd) => cmd.type === "positive").length;
    const negativeCount = commandments.filter((cmd) => cmd.type === "negative").length;
    const scriptureLinkCount = countWithList(commandments, "nt_links");
    const sefariaLinkCount = countWithList(commandments, "sefaria_links");
    const categoryCount = new Set(commandments.map((cmd) => cmd.category).filter(Boolean)).size;
    const themeCount = countUniqueFromList(commandments, "themes");

    container.textContent = "";

    const wrapper = document.createElement("div");
    wrapper.className = "space-y-3";

    appendText(wrapper, "h2", "Commandments Dataset Preview", "text-xl font-semibold text-orange-300");

    const stats = document.createElement("div");
    stats.className = "space-y-1 text-sm text-slate-200";
    appendText(stats, "div", `${commandments.length} loaded commandments`);
    appendText(stats, "div", `${positiveCount} positive / ${negativeCount} negative`);
    appendText(stats, "div", `${scriptureLinkCount} with related scripture links`);
    appendText(stats, "div", `${sefariaLinkCount} with Sefaria links`);
    appendText(stats, "div", `${categoryCount} categories`);
    appendText(stats, "div", `${themeCount} themes`);
    wrapper.appendChild(stats);

    const filterBar = document.createElement("div");
    filterBar.className = "flex flex-wrap gap-2";

    FILTERS.forEach((filterName) => {
      const button = document.createElement("button");
      button.type = "button";
      setFilterButtonClass(button, filterName === activeFilter);
      button.textContent = filterName;
      button.addEventListener("click", () => {
        activeFilter = filterName;
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
      searchQuery = searchInput.value;
      updateResults();
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-400";
    clearButton.textContent = "Clear";
    clearButton.addEventListener("click", () => {
      searchQuery = "";
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
      const searchedCommandments = searchCommandments(filteredCommandments, searchQuery);
      const visibleCommandments = searchedCommandments.slice(0, 10);
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
        row.className = "rounded-lg border border-slate-700 bg-slate-900/70 p-3";

        appendText(row, "div", `${cmd.code || ""} - ${cmd.title || "Untitled commandment"}`, "font-medium text-white");
        appendText(row, "div", cmd.reference || "No reference listed", "text-xs text-slate-400");
        appendText(row, "div", `${cmd.type || "unknown"} • ${cmd.category || "Uncategorized"}`, "text-xs text-slate-400");

        list.appendChild(row);
      });
    }

    updateResults();
    appendText(wrapper, "div", "Full explorer coming soon", "text-xs text-slate-400");
    container.appendChild(wrapper);
    lastRenderedContainer = container;
  }

  async function renderIfReady() {
    const container = document.getElementById("commandmentsList");
    if (!container || container === lastRenderedContainer) return;

    container.textContent = "Loading commandments dataset...";

    try {
      const commandments = await loadCommandments();
      renderPreview(container, Array.isArray(commandments) ? commandments : []);
    } catch (err) {
      container.textContent = "Failed to load commandments dataset.";
      console.error("[commandments] dataset preview failed", err);
    }
  }

  renderIfReady();

  const observer = new MutationObserver(() => {
    renderIfReady();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
