(function () {
  const DATA_URL = "data/prezis.json";
  let prezisDataPromise = null;
  let prezisData = null;
  const stateByRoot = new WeakMap();

  function getScope(root) {
    return root && typeof root.querySelector === "function" ? root : document;
  }

  function getDom(root) {
    const scope = getScope(root);
    return {
      scope,
      frameHost: scope.querySelector("#preziFrameHost"),
      titleEl: scope.querySelector("#preziTitle"),
      categorySelect: scope.querySelector("#preziCategorySelect"),
      prevBtn: scope.querySelector("#preziPrevBtn"),
      nextBtn: scope.querySelector("#preziNextBtn")
    };
  }

  function getRootKey(dom) {
    return dom.scope === document
      ? document
      : dom.scope.querySelector(".hg-card-module") || dom.scope;
  }

  function getState(dom) {
    const key = getRootKey(dom);
    let state = stateByRoot.get(key);

    if (!state) {
      state = {
        category: "",
        currentIndex: 0,
        filtered: []
      };
      stateByRoot.set(key, state);
    }

    return state;
  }

  function normalizePrezisData(data) {
    return Array.isArray(data?.prezis) ? data.prezis : [];
  }

  function getPrezisData() {
    if (prezisData) {
      return Promise.resolve(prezisData);
    }

    if (!prezisDataPromise) {
      prezisDataPromise = fetch(DATA_URL)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Could not load ${DATA_URL}`);
          }
          return res.json();
        })
        .then(data => {
          prezisData = normalizePrezisData(data);
          return prezisData;
        })
        .catch(err => {
          console.warn("[prezis] data unavailable", err);
          prezisData = [];
          return prezisData;
        });
    }

    return prezisDataPromise;
  }

  function populateCategories(dom, prezis, state) {
    const { categorySelect } = dom;
    if (!categorySelect) return;

    const categories = [...new Set(prezis.map(p => p.category).filter(Boolean))];
    const previousCategory = state.category || categorySelect.value;

    categorySelect.innerHTML = "";

    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    if (categories.includes(previousCategory)) {
      categorySelect.value = previousCategory;
      state.category = previousCategory;
    } else {
      categorySelect.value = categories[0] || "";
      state.category = categorySelect.value;
      state.currentIndex = 0;
    }
  }

  function updateFiltered(prezis, state) {
    state.filtered = prezis.filter(p => p.category === state.category);

    if (state.currentIndex < 0) {
      state.currentIndex = 0;
    }

    if (state.currentIndex >= state.filtered.length) {
      state.currentIndex = Math.max(0, state.filtered.length - 1);
    }
  }

  function renderPrezi(dom, state) {
    const { frameHost, titleEl } = dom;
    if (!frameHost || !titleEl) return;

    const prezi = state.filtered[state.currentIndex];

    frameHost.innerHTML = "";

    if (!prezi) {
      titleEl.textContent = "Prezis";
      return;
    }

    frameHost.innerHTML = prezi.embed || "";
    titleEl.textContent = prezi.title || "Prezis";
  }

  function bindControls(dom, prezis, state) {
    const { categorySelect, prevBtn, nextBtn } = dom;

    if (categorySelect) {
      categorySelect.onchange = () => {
        state.category = categorySelect.value;
        state.currentIndex = 0;
        updateFiltered(prezis, state);
        renderPrezi(dom, state);
      };
    }

    if (prevBtn) {
      prevBtn.onclick = () => {
        if (state.currentIndex > 0) {
          state.currentIndex--;
          renderPrezi(dom, state);
        }
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        if (state.currentIndex < state.filtered.length - 1) {
          state.currentIndex++;
          renderPrezi(dom, state);
        }
      };
    }
  }

  window.initPrezis = async function initPrezis(root = document) {
    const dom = getDom(root);

    if (!dom.frameHost || !dom.titleEl || !dom.categorySelect) {
      return;
    }

    const prezis = await getPrezisData();
    const state = getState(dom);

    populateCategories(dom, prezis, state);
    updateFiltered(prezis, state);
    bindControls(dom, prezis, state);
    renderPrezi(dom, state);
  };

  window.destroyPrezis = function destroyPrezis(root = document) {
    const dom = getDom(root);

    if (dom.frameHost) {
      dom.frameHost.innerHTML = "";
    }

    if (dom.categorySelect) {
      dom.categorySelect.onchange = null;
    }

    if (dom.prevBtn) {
      dom.prevBtn.onclick = null;
    }

    if (dom.nextBtn) {
      dom.nextBtn.onclick = null;
    }

    stateByRoot.delete(getRootKey(dom));
  };

  window.initPrezis(document);
})();
