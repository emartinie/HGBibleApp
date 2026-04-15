let prezis = [];
let filtered = [];
let currentIndex = 0;

const frameHost = document.getElementById("preziFrameHost");
const titleEl = document.getElementById("preziTitle");
const categorySelect = document.getElementById("preziCategorySelect");

fetch("data/prezis.json")
  .then(res => res.json())
  .then(data => {
    prezis = data.prezis;
    initCategories();
    loadCategory(categorySelect.value);
  });

function initCategories() {
  const categories = [...new Set(prezis.map(p => p.category))];
  categorySelect.innerHTML = categories
    .map(c => `<option value="${c}">${c}</option>`)
    .join("");
}

categorySelect.addEventListener("change", () => {
  loadCategory(categorySelect.value);
});

function loadCategory(category) {
  filtered = prezis.filter(p => p.category === category);
  currentIndex = 0;
  renderPrezi();
}

function renderPrezi() {
  const prezi = filtered[currentIndex];
  if (!prezi) return;

  // DESTROY previous iframe
  frameHost.innerHTML = "";

  // Inject new iframe
  frameHost.innerHTML = prezi.embed;

  titleEl.textContent = prezi.title;
}

document.getElementById("preziPrevBtn").onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderPrezi();
  }
};

document.getElementById("preziNextBtn").onclick = () => {
  if (currentIndex < filtered.length - 1) {
    currentIndex++;
    renderPrezi();
  }
};
