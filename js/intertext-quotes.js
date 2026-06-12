fetch("data/intertext/nt_ot_quotes.json")
  .then(r => r.json())
  .then(data => {
    window.intertextData = data;
    init(data);
  });

function init(data) {
  populateBookFilter(data);
  renderDatasetSummary(data);
  renderQuotes(data);

  const bookFilter = document.getElementById("bookFilter");
  const expandAll = document.getElementById("expandAll");

  if (bookFilter) {
    bookFilter.addEventListener("change", e => {
      renderQuotes(data, e.target.value);
    });
  }

  if (expandAll) {
    expandAll.addEventListener("click", () => {
      document
        .querySelectorAll(".witnesses")
        .forEach(w => w.classList.remove("hidden"));
    });
  }
}

function renderDatasetSummary(data) {
  const summary = document.getElementById("intertextDatasetSummary");
  const totalEl = document.querySelector("[data-intertext-total]");
  const ntEl = document.querySelector("[data-intertext-sample-nt]");
  const lxxEl = document.querySelector("[data-intertext-sample-lxx]");
  const mtEl = document.querySelector("[data-intertext-sample-mt]");

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

function renderQuotes(data, bookFilter = "") {
  const root = document.getElementById("nt-quotes");
  if (!root) return;

  root.innerHTML = "";

  Object.values(data).forEach(entry => {
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
          ${hasNtRef ? ntWitness.ref : ntText.split("—")[0]}
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
      card.querySelector(".witnesses").classList.toggle("hidden");
      e.target.textContent =
        card.querySelector(".witnesses").classList.contains("hidden")
          ? "Show Hebrew Scripture witnesses"
          : "Hide Hebrew Scripture witnesses";
    };

    root.appendChild(card);
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
        ${label}${data.ref ? " — " + data.ref : ""}
      </h4>
      <p class="text-slate-300">${data.text}</p>
    </div>
  `;
}

function populateBookFilter(data) {
  const select = document.getElementById("bookFilter");
  if (!select) return;

  const books = new Set();

  Object.values(data).forEach(entry => {
    if (!entry.nt?.text) return;
    books.add(entry.nt.text.split(" ")[0]);
  });

  [...books].sort().forEach(book => {
    const opt = document.createElement("option");
    opt.value = book;
    opt.textContent = book;
    select.appendChild(opt);
  });
}
