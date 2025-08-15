document.addEventListener("DOMContentLoaded", () => {
  const weekSelector = document.getElementById("weekSelector");
  const themeToggle = document.getElementById("themeToggle");

  // Tab functionality
  const tabs = document.querySelectorAll(".tab-item");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      panels.forEach(p => p.classList.add("hidden"));
      document.getElementById(tab.dataset.tab).classList.remove("hidden");
    });
  });

  // Set first tab active
  tabs[0].classList.add("active");

  // Load default week
  loadWeek(weekSelector.value);

  weekSelector.addEventListener("change", () => {
    loadWeek(weekSelector.value);
  });

  // Dark mode toggle
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
});

function loadWeek(week) {
  // Placeholder logic for JSON content
  const content = `Week ${week} content goes here. Replace with JSON fetches.`;

  document.getElementById("intro").innerHTML = `<div class="accordion"><summary>Intro Overview</summary><div>${content}</div></div>`;
  document.getElementById("study").innerHTML = `<div class="accordion"><summary>Study Overview</summary><div>${content}</div></div>`;
  document.getElementById("audio").innerHTML = `<div class="accordion"><summary>Audio Scripts</summary><div>${content}</div></div>`;
  document.getElementById("scriptures").innerHTML = `<div class="accordion"><summary>Scripture Verses</summary><div>${content}</div></div>`;
  document.getElementById("commentary").innerHTML = `<div class="accordion"><summary>Commentary</summary><div>${content}</div></div>`;
}
