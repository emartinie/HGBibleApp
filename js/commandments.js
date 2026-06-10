(function () {
  const DATA_URL = "data/commandments/commandments (1).json";
  let commandmentsPromise = null;
  let lastRenderedContainer = null;

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

    const list = document.createElement("div");
    list.className = "space-y-2";

    commandments.slice(0, 3).forEach((cmd) => {
      const row = document.createElement("div");
      row.className = "rounded-lg border border-slate-700 bg-slate-900/70 p-3";

      appendText(row, "div", `${cmd.code || ""} - ${cmd.title || "Untitled commandment"}`, "font-medium text-white");
      appendText(row, "div", cmd.reference || "No reference listed", "text-xs text-slate-400");

      list.appendChild(row);
    });

    wrapper.appendChild(list);
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
