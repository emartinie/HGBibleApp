(function () {
  const ARTICLES = [
    { title: "Almost There", file: "almost_there_but_not_quite.html" },
    { title: "Midrash Debate", file: "debating_arguing_discussing_and_disagreeing_midrash.html" },
    { title: "Yeshua Fulfillment", file: "jesus_yeshua_fulfillment_of_prophecy.html" }
  ];

  const listEl = document.getElementById("articleList");
  const viewer = document.getElementById("articleViewer");

  function renderList() {
    if (!listEl) return;

    listEl.innerHTML = ARTICLES.map(a => `
      <button class="ui-btn w-full text-left" data-file="${a.file}">
        ${a.title}
      </button>
    `).join("");
  }

  async function loadArticle(file) {
    if (!viewer) return;

    viewer.innerHTML = "Loading...";

    try {
      const res = await fetch(`articles/${file}`);
      if (!res.ok) throw new Error();

      const html = await res.text();
      viewer.innerHTML = html;

    } catch {
      viewer.innerHTML = `<div class="text-red-400">Failed to load article</div>`;
    }
  }

  function wire() {
    listEl?.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      loadArticle(btn.dataset.file);
    });
  }

  function init() {
    renderList();
    wire();
  }

  init();
})();
