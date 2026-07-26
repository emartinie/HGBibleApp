let scholarsAbortController = null;
let scholarsRoot = null;
let scholarsData = [];
let activeScholarId = "";

function scholarElement(id) {
  return scholarsRoot?.querySelector("#" + id) || null;
}

function scholarListSection(title, items, className = "scholar-list") {
  if (!items?.length) return "";
  return `<section class="scholar-section"><h3>${title}</h3><ul class="${className}">${items.map(item => `<li>${item}</li>`).join("")}</ul></section>`;
}

function renderScholarProfile(scholar) {
  const host = scholarElement("scholarProfile");
  if (!host || !scholar) return;
  activeScholarId = scholar.id;
  const sources = (scholar.sources || []).map(source =>
    `<li><a href="${source.url}" target="_blank" rel="noopener">${source.label}</a></li>`
  );
  host.innerHTML = `
    <div class="scholar-label">Scholar profile</div>
    <h2>${scholar.name}</h2>
    <p class="scholar-title">${scholar.title}</p>
    <p><strong>Scholarly setting:</strong> ${scholar.tradition}</p>
    <p>${scholar.overview}</p>
    ${scholarListSection("Areas of expertise", scholar.expertise, "scholar-chips")}
    ${scholarListSection("Languages and textual work", scholar.languages)}
    ${scholarListSection("Research strengths", scholar.strengths)}
    ${scholarListSection("Limitations and cautions", scholar.limitations)}
    ${scholarListSection("Selected primary writings", scholar.writings)}
    ${scholarListSection("Notable contributions", scholar.contributions)}
    <section class="scholar-section"><h3>Influence</h3><p>${scholar.influence}</p></section>
    ${scholarListSection("Where this scholar agrees or differs", scholar.comparisons)}
    <section class="scholar-section scholar-sources"><h3>Sources and further reading</h3><ul class="scholar-list">${sources.join("")}</ul></section>
  `;
  scholarElement("scholarList")?.querySelectorAll("button[data-scholar-id]").forEach(button => {
    button.classList.toggle("active", button.dataset.scholarId === scholar.id);
  });
}

function findScholar(id) {
  return scholarsData.find(scholar => scholar.id === id);
}

function selectScholar(id, options = {}) {
  const scholar = findScholar(id);
  if (!scholar) return;
  renderScholarProfile(scholar);
  if (options.updateUrl !== false) {
    window.HGRoute?.setCardState?.("scholars", { id: scholar.id }, {
      replace: options.replace === true,
      announce: false,
      source: "scholar-profile"
    });
  }
}

function renderScholarList(query = "") {
  const list = scholarElement("scholarList");
  if (!list) return;
  const term = query.trim().toLowerCase();
  const matches = scholarsData.filter(scholar =>
    !term || [
      scholar.name, scholar.title, scholar.tradition, scholar.overview,
      ...(scholar.expertise || []), ...(scholar.writings || [])
    ].join(" ").toLowerCase().includes(term)
  );
  list.replaceChildren();
  matches.forEach(scholar => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.scholarId = scholar.id;
    button.textContent = scholar.name;
    button.classList.toggle("active", scholar.id === activeScholarId);
    list.appendChild(button);
  });
  if (!matches.length) list.innerHTML = '<div class="scholar-empty">No scholars match that search.</div>';
}

async function initScholarsCard(root = document) {
  destroyScholarsCard();
  scholarsRoot = root && typeof root.querySelector === "function" ? root : document;
  if (!scholarElement("scholarsCard")) return;
  scholarsAbortController = new AbortController();
  const { signal } = scholarsAbortController;

  try {
    const response = await fetch("data/scholars.json", { signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    scholarsData = data.scholars || [];
    const note = scholarElement("scholarsEditorialNote");
    if (note) note.textContent = data.editorialNote + " Last reviewed " + data.reviewed + ".";
    renderScholarList();

    scholarElement("scholarSearch")?.addEventListener("input", event => renderScholarList(event.target.value), { signal });
    scholarElement("scholarList")?.addEventListener("click", event => {
      const button = event.target.closest("button[data-scholar-id]");
      if (button) selectScholar(button.dataset.scholarId);
    }, { signal });

    const route = window.HGRoute?.read?.();
    const routed = route?.card === "scholars" ? findScholar(route.id) : null;
    selectScholar(routed?.id || scholarsData[0]?.id, { updateUrl: Boolean(routed), replace: true });
  } catch (error) {
    if (error.name !== "AbortError") {
      const host = scholarElement("scholarProfile");
      if (host) host.innerHTML = '<div class="scholar-empty">Scholar profiles could not be loaded.</div>';
      console.error("Scholar profiles failed to load", error);
    }
  }
}

function destroyScholarsCard() {
  scholarsAbortController?.abort();
  scholarsAbortController = null;
  scholarsRoot = null;
  scholarsData = [];
  activeScholarId = "";
}

window.initScholarsCard = initScholarsCard;
window.destroyScholarsCard = destroyScholarsCard;

window.HGRoute?.registerCard?.("scholars", {
  getState() {
    return activeScholarId ? { id: activeScholarId } : {};
  },
  restore(route) {
    if (route?.id && route.id !== activeScholarId) selectScholar(route.id, { updateUrl: false });
  }
});
