document.addEventListener("DOMContentLoaded", () => {
  const weekSelector = document.getElementById("weekSelector");
  const themeToggle = document.getElementById("themeToggle");
  const searchInput = document.getElementById("searchInput");

  const tabs = document.querySelectorAll(".tab-item");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      panels.forEach(p => p.classList.add("hidden"));
      document.getElementById(tab.dataset.tab).classList.remove("hidden");
      filterContent(searchInput.value); // re-apply search on tab switch
    });
  });

  tabs[0].classList.add("active");

  loadWeek(weekSelector.value);

  weekSelector.addEventListener("change", () => loadWeek(weekSelector.value));

  themeToggle.addEventListener("click", () => document.body.classList.toggle("dark"));

  searchInput.addEventListener("input", () => filterContent(searchInput.value));
});

// Store current week content
let currentWeekContent = {};

function loadWeek(week) {
  // Replace with actual JSON fetch
  const content = `Content for Week ${week}. Add your JSON data here.`;

  currentWeekContent = {
    intro: content,
    study: content,
    audio: content,
    scriptures: content,
    commentary: content
  };

  Object.keys(currentWeekContent).forEach(key => {
    document.getElementById(key).innerHTML = `<div class="accordion"><summary>${key.charAt(0).toUpperCase() + key.slice(1)}</summary><div>${currentWeekContent[key]}</div></div>`;
  });
}

// Filter content based on search input
function filterContent(query) {
  const lowerQuery = query.toLowerCase();
  Object.keys(currentWeekContent).forEach(key => {
    const panel = document.getElementById(key);
    const contentText = currentWeekContent[key].toLowerCase();

    if (contentText.includes(lowerQuery)) {
      panel.classList.remove("hidden");
      // Optionally, highlight matches
      const highlighted = currentWeekContent[key].replace(new RegExp(`(${query})`, "gi"), '<mark>$1</mark>');
      panel.innerHTML = `<div class="accordion"><summary>${key.charAt(0).toUpperCase() + key.slice(1)}</summary><div>${highlighted}</div></div>`;
    } else {
      panel.classList.add("hidden");
    }
  });
}
