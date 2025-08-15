let allWeeks = {};
let currentWeek = 1;

// Load JSON
fetch('weeks.json')
  .then(r => r.json())
  .then(data => {
    allWeeks = data;
    setupWeekSelector();
    loadWeek(currentWeek);
  });

// Week selector
const weekSelector = document.getElementById("weekSelector");
const prevBtn = document.getElementById("prevWeek");
const nextBtn = document.getElementById("nextWeek");

function setupWeekSelector() {
  Object.keys(allWeeks).forEach(week => {
    const option = document.createElement("option");
    option.value = week;
    option.textContent = `Week ${week}`;
    weekSelector.appendChild(option);
  });
  weekSelector.addEventListener("change", () => loadWeek(weekSelector.value));
  prevBtn.addEventListener("click", () => changeWeek(-1));
  nextBtn.addEventListener("click", () => changeWeek(1));
}

function changeWeek(delta) {
  const weeks = Object.keys(allWeeks).map(Number);
  let idx = weeks.indexOf(Number(currentWeek));
  idx = Math.min(Math.max(idx + delta, 0), weeks.length - 1);
  currentWeek = weeks[idx];
  weekSelector.value = currentWeek;
  loadWeek(currentWeek);
}

// Tabs
const tabsDiv = document.getElementById("tabs");
const panelsDiv = document.getElementById("panels");

function loadWeek(week) {
  currentWeek = week;
  const data = allWeeks[week];

  // Clear old tabs/panels
  tabsDiv.innerHTML = '';
  panelsDiv.innerHTML = '';

  Object.keys(data).forEach((section, i) => {
    // Tab
    const tab = document.createElement("div");
    tab.textContent = section;
    tab.className = "tab-button" + (i === 0 ? " active" : "");
    tab.addEventListener("click", () => activateTab(i));
    tabsDiv.appendChild(tab);

    // Panel
    const panel = document.createElement("div");
    panel.id = section;
    panel.className = "panel" + (i === 0 ? "" : " hidden");
    panel.innerHTML = `<p class="p-4 bg-white dark:bg-gray-800 rounded shadow">${data[section]}</p>`;
    panelsDiv.appendChild(panel);
  });
}

function activateTab(idx) {
  const tabs = tabsDiv.children;
  const panels = panelsDiv.children;
  Array.from(tabs).forEach((t, i) => t.classList.toggle("active", i === idx));
  Array.from(panels).forEach((p, i) => p.classList.toggle("hidden", i !== idx));
}

// Search
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", () => multiWeekSearch(searchInput.value));

function multiWeekSearch(query) {
  const lowerQuery = query.toLowerCase();
  searchResults.innerHTML = '';
  if (!query) {
    searchResults.classList.add('hidden');
    return;
  }

  Object.keys(allWeeks).forEach(week => {
    Object.keys(allWeeks[week]).forEach(section => {
      const content = allWeeks[week][section];
      if (content.toLowerCase().includes(lowerQuery)) {
        const div = document.createElement('div');
        div.className = 'p-2 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer';
        div.innerHTML = `<strong>Week ${week} - ${section}</strong>: ${content.substring(0, 100)}...`;
        div.addEventListener('click', () => {
          weekSelector.value = week;
          loadWeek(week);
          activateTab(Object.keys(allWeeks[week]).indexOf(section));
          searchResults.classList.add('hidden');
        });
        searchResults.appendChild(div);
      }
    });
  });

  searchResults.classList.toggle('hidden', searchResults.children.length === 0);
  if(searchResults.children.length === 0){
    searchResults.innerHTML = '<p class="p-2">No results found.</p>';
  }
}
