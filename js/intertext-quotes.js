(function () {
  const DATA_URL = "data/intertext/nt_ot_quotes.json";
  let intertextDataPromise = null;

  function getScope(root) {
    return root && typeof root.querySelector === "function" ? root : document;
  }

  function getIntertextData() {
    if (window.intertextData) {
      return Promise.resolve(window.intertextData);
    }

    if (!intertextDataPromise) {
      intertextDataPromise = fetch(DATA_URL)
        .then(r => r.json())
        .then(data => {
          window.intertextData = data;
          return data;
        });
    }

    return intertextDataPromise;
  }

  function renderDatasetSummary(data, root = document) {
    const scope = getScope(root);
    const summary = scope.querySelector("#intertextDatasetSummary");
    const totalEl = scope.querySelector("[data-intertext-total]");
    const ntEl = scope.querySelector("[data-intertext-sample-nt]");
    const lxxEl = scope.querySelector("[data-intertext-sample-lxx]");
    const mtEl = scope.querySelector("[data-intertext-sample-mt]");

    if (!summary && !totalEl && !ntEl && !lxxEl && !mtEl) return;

    const entries = Object.values(data || {});
    const ntWitnessCount = entries.filter(entry => entry?.nt?.text).length;
    const lxxWitnessCount = entries.filter(entry => entry?.ot?.lxx?.text).length;
    const masoreticWitnessCount = entries.filter(entry => entry?.ot?.masoretic?.text).length;
    const ntBooks = new Set();

    entries.forEach(entry => {
      const ntText = String(entry?.nt?.text || "").trim();
      const match = ntText.match(/^([1-3]?\s?[A-Za-z]+)/);
      if (match) ntBooks.add(match[1]);
    });

    if (summary) {
      summary.innerHTML = "";

      const heading = document.createElement("div");
      heading.className = "text-slate-200 font-semibold mb-2";
      heading.textContent = "Intertext Dataset Preview";
      summary.appendChild(heading);

      const groups = document.createElement("div");
      groups.className = "grid gap-2";

      function appendSummaryGroup(title, lines) {
        const group = document.createElement("div");
        group.className = "space-y-1 rounded-lg border border-slate-700 bg-slate-900/70 p-3";

        const label = document.createElement("div");
        label.className = "text-xs font-semibold text-slate-400";
        label.textContent = title;
        group.appendChild(label);

        lines.forEach(line => {
          const item = document.createElement("div");
          item.className = "text-sm text-slate-200";
          item.textContent = line;
          group.appendChild(item);
        });

        groups.appendChild(group);
      }

      appendSummaryGroup("Quotations", [`${entries.length} loaded entries`]);
      appendSummaryGroup("Witnesses", [
        `${ntWitnessCount} NT Witnesses`,
        `${lxxWitnessCount} LXX Witnesses`,
        `${masoreticWitnessCount} Masoretic Witnesses`
      ]);
      appendSummaryGroup("Scope", [`${ntBooks.size} NT Books`]);

      summary.appendChild(groups);
      return;
    }

    if (totalEl) totalEl.textContent = String(entries.length);
    if (ntEl) ntEl.textContent = `${ntWitnessCount} NT Witnesses`;
    if (lxxEl) lxxEl.textContent = `${lxxWitnessCount} LXX Witnesses`;
    if (mtEl) mtEl.textContent = `${masoreticWitnessCount} Masoretic Witnesses`;
  }

  function renderQuotes(data, bookFilter = "", root = document) {
    const scope = getScope(root);
    const quotesRoot = scope.querySelector("#nt-quotes");
    if (!quotesRoot) return;

    quotesRoot.innerHTML = "";

    Object.values(data || {}).forEach(entry => {
      const ntText = entry.nt?.text;
      if (!ntText) return;

      if (bookFilter && !ntText.startsWith(bookFilter)) return;

      const ntWitness = splitWitnessText(ntText);
      const hasNtRef = !!ntWitness.ref;

      const card = document.createElement("div");
      card.className =
        "border border-slate-700 rounded-lg bg-slate-900/40 p-5";

      card.innerHTML = `
        <div class="mb-3">
          <h3 class="text-lg font-semibold text-slate-200">
            ${hasNtRef ? ntWitness.ref : ntText.split(" - ")[0]}
          </h3>
          <div class="flex flex-wrap gap-2 text-xs text-slate-400 mt-2">
            <span>NT Witness</span>
            <span>Hebrew Scripture Witnesses</span>
            <span>Masoretic</span>
            <span>LXX</span>
          </div>
          <p class="text-slate-300 mt-2">${hasNtRef ? ntWitness.body : ntText}</p>
        </div>

        <button class="text-sm text-cyan-400 toggle">
          Show Hebrew Scripture witnesses
        </button>

        <div class="witnesses hidden mt-4 space-y-3">
          ${renderWitness("Masoretic Witness", entry.ot?.masoretic)}
          ${renderWitness("LXX Witness", entry.ot?.lxx)}
        </div>
      `;

      card.querySelector(".toggle").onclick = e => {
        const witnesses = card.querySelector(".witnesses");
        witnesses.classList.toggle("hidden");
        e.target.textContent = witnesses.classList.contains("hidden")
          ? "Show Hebrew Scripture witnesses"
          : "Hide Hebrew Scripture witnesses";
      };

      quotesRoot.appendChild(card);
    });
  }

  function splitWitnessText(text) {
    const value = String(text || "");
    const match = value.match(/^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:-\d+)?)(?:\s+)?(.*)$/);
    return {
      ref: match ? match[1].trim() : "",
      body: match ? match[2].trim() : value
    };
  }

  function renderWitness(label, data) {
    if (!data?.text) return "";

    return `
      <div>
        <h4 class="text-sm uppercase tracking-wide text-slate-400">
          ${label}${data.ref ? " - " + data.ref : ""}
        </h4>
        <p class="text-slate-300">${data.text}</p>
      </div>
    `;
  }

  function populateBookFilter(data, root = document) {
    const scope = getScope(root);
    const select = scope.querySelector("#bookFilter");
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All NT Books";
    select.appendChild(allOption);

    const books = new Set();

    Object.values(data || {}).forEach(entry => {
      if (!entry.nt?.text) return;
      books.add(entry.nt.text.split(" ")[0]);
    });

    [...books].sort().forEach(book => {
      const opt = document.createElement("option");
      opt.value = book;
      opt.textContent = book;
      select.appendChild(opt);
    });

    if ([...select.options].some(option => option.value === currentValue)) {
      select.value = currentValue;
    }
  }

  function bindIntertextControls(data, root = document) {
    const scope = getScope(root);
    const bookFilter = scope.querySelector("#bookFilter");
    const expandAll = scope.querySelector("#expandAll");
    const viewToggle = scope.querySelector("#viewToggle");
    const quotesRoot = scope.querySelector("#nt-quotes");

    if (bookFilter) {
      bookFilter.onchange = e => {
        renderQuotes(data, e.target.value, scope);
      };
    }

    if (expandAll) {
      expandAll.onclick = () => {
        scope
          .querySelectorAll(".witnesses")
          .forEach(w => w.classList.remove("hidden"));

        scope
          .querySelectorAll(".toggle")
          .forEach(button => {
            button.textContent = "Hide Hebrew Scripture witnesses";
          });
      };
    }

    if (viewToggle && quotesRoot) {
      viewToggle.onclick = () => {
        quotesRoot.classList.toggle("side-by-side");
      };
    }
  }

  window.initIntertextQuotes = async function initIntertextQuotes(root = document) {
    const scope = getScope(root);
    const quotesRoot = scope.querySelector("#nt-quotes");
    if (!quotesRoot) return;

    const data = await getIntertextData();
    populateBookFilter(data, scope);
    renderDatasetSummary(data, scope);
    renderQuotes(data, scope.querySelector("#bookFilter")?.value || "", scope);
    bindIntertextControls(data, scope);
  };

  window.initIntertextQuotes(document);
})();
