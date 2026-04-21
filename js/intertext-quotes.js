fetch("data/intertext/nt_ot_quotes.json")
  .then(r => r.json())
  .then(data => init(data));

function init(data) {
  populateBookFilter(data);
  renderQuotes(data);

  document.getElementById("bookFilter").addEventListener("change", e => {
    renderQuotes(data, e.target.value);
  });

  document.getElementById("expandAll").addEventListener("click", () => {
    document
      .querySelectorAll(".witnesses")
      .forEach(w => w.classList.remove("hidden"));
  });
}

function renderQuotes(data, bookFilter = "") {
  const root = document.getElementById("nt-quotes");
  root.innerHTML = "";

  Object.values(data).forEach(entry => {
    const ntText = entry.nt?.text;
    if (!ntText) return;

    if (bookFilter && !ntText.startsWith(bookFilter)) return;

    const card = document.createElement("div");
    card.className =
      "border border-slate-700 rounded-lg bg-slate-900/40 p-5";

    card.innerHTML = `
      <div class="mb-3">
        <h3 class="text-lg font-semibold text-slate-200">
          ${ntText.split("—")[0]}
        </h3>
        <p class="text-slate-300 mt-2">${ntText}</p>
      </div>

      <button class="text-sm text-cyan-400 toggle">
        Show Hebrew Scripture witnesses
      </button>

      <div class="witnesses hidden mt-4 space-y-3">
        ${renderWitness("Masoretic Text", entry.ot?.masoretic)}
        ${renderWitness("Septuagint (LXX)", entry.ot?.lxx)}
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
