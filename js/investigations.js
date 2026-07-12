(function () {
const INVESTIGATIONS = [
  { title: "Trust Over Agreement", file: "why-trust-matters-more-than-agreement.html" },
  { title: "Where Did the Sabbath Go?", file: "where_did_the_sabbath_go.html" },
  { title: "Who was Paul, or Rabbi Shaul?", file: "who_was_paul.html" },
  { title: "Clean and Unclean Food?", file: "dietary_expectations.html" },
  { title: "Is the Son the Father?", file: "is-the-son-the-father.html" }
  

];

  let activeController = null;

  function getEls(root = document) {
    const scope = root && typeof root.querySelector === "function" ? root : document;
    return {
      list: scope.querySelector("#investigationList"),
      search: scope.querySelector("#investigationSearch"),
      viewer: scope.querySelector("#investigationViewer")
    };
  }

  function renderList(listEl, query = "") {
    if (!listEl) return;

    const normalized = query.trim().toLowerCase();
    const matches = INVESTIGATIONS.filter(investigation =>
      !normalized || investigation.title.toLowerCase().includes(normalized)
    );

    listEl.innerHTML = matches.length ? matches.map(investigation => `
      <button class="ui-btn w-full text-left" data-file="${investigation.file}">
        ${investigation.title}
      </button>
    `).join("") : `<div class="hg-empty">No Investigations match your search.</div>`;
  }

  //function loadInvestigation(file, viewer) {
  //if (!viewer) return;

  //const safeFile = String(file || "").replace(/^\/+/, "");
  //viewer.src = `investigations/${safeFile}`;
//}

  async function loadInvestigation(file, viewer) {
    if (!viewer) return;

    const [fileName, anchor = ""] = String(file || "").split("#", 2);

    viewer.innerHTML = "Loading...";

    try {
      const res = await fetch(`investigations/${fileName}`);
      if (!res.ok) throw new Error();

      const html = await res.text();
      viewer.innerHTML = html;

      if (anchor) {
        const target = Array.from(viewer.querySelectorAll("[id]")).find(el => el.id === anchor);
        target?.scrollIntoView({ block: "start" });
      } else {
        viewer.scrollTop = 0;
      }

    } catch {
      viewer.innerHTML = `<div class="text-red-400">Failed to load Investigation</div>`;
    }
  }

  async function initInvestigationsCard(root = document) {
    destroyInvestigationsCard();

    const { list, search, viewer } = getEls(root);
    if (!list || !viewer) return;

    activeController = new AbortController();
    const { signal } = activeController;

    renderList(list, search?.value || "");

    search?.addEventListener("input", () => {
      renderList(list, search.value);
    }, { signal });

    list.addEventListener("click", event => {
      const button = event.target.closest("button[data-file]");
      if (!button) return;

      list.querySelectorAll("button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      loadInvestigation(button.dataset.file, viewer);
    }, { signal });

    if (window.pendingInvestigationFile) {
      const pending = window.pendingInvestigationFile;
      const fileName = pending.split("#", 1)[0];
      await loadInvestigation(pending, viewer);

      const button = Array.from(list.querySelectorAll("button[data-file]"))
        .find(item => item.dataset.file === fileName);

      button?.classList.add("active");
      window.pendingInvestigationFile = null;
    }
  }

  function destroyInvestigationsCard() {
    activeController?.abort();
    activeController = null;
  }

  window.initInvestigationsCard = initInvestigationsCard;
  window.destroyInvestigationsCard = destroyInvestigationsCard;
})();
