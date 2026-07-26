(function () {
const ARTICLES = [
  { title: "Trust Over Agreement", file: "why-trust-matters-more-than-agreement.html" },  
  { title: "Hanukkah, and What I Believe", file: "a_note_on_trust.html" },  
  { title: "Who was Paul, or Rabbi Shaul?", file: "who_was_paul.html" },
  { title: "Where Did the Sabbath Go?", file: "where_did_the_sabbath_go.html" },  
  { title: "Clean and Unclean Food?", file: "dietary_expectations.html" },
  { title: "Almost There, but Not Quite", file: "almost_there_but_not_quite.html" },
  { title: "Walking in Love", file: "debating_arguing_discussing_and_disagreeing_midrash.html" },
  { title: "First Article", file: "first_blog_post_the_second_commandment_and_the_second_ammendment.html" },
  { title: "Fulfillment of Prophecy", file: "jesus_yeshua_fulfillment_of_prophecy.html" },
  { title: "Kingdom Mindedness", file: "kingdom_mindedness.html" },
  { title: "LTBI24H- Chuck Missler", file: "learn_the_bible_in_24_hours.html" },
  { title: "Letter to a Friend", file: "letter_to_a_friend.html" },
  { title: "List of Sins", file: "list_of_sins.html" },
  { title: "Marriage", file: "marriage.html" },
  { title: "Misconceptions of ekklesia", file: "misconceptions_of_ekklesia.html" },
  { title: "Who is Q [for Christians]", file: "qanon_phenomenon_who_is_q_for_christians.html" },
  { title: "Relational Discipleship 101 Notes", file: "relational_discipleship_101_notes.html" },
  { title: "The holidays- by Wendy Roberts", file: "sola_scriptura_the_holidays.html" },
  { title: "Study Tools", file: "study_tools.html" },
  { title: "Surrendering Anger- by Wendy Roberts", file: "surrendering_anger.html" },
  { title: "Taking Our Country & Churches Back", file: "taking_our_churches_and_our_country_back.html" },
  { title: "The Hebrew Roots of Revelation", file: "the_Book_of_revelation_hebrew_roots.html" },
  { title: "The Commandments of Jesus", file: "the_commandments_of_jesus.html" },
  { title: "The Hebrew Pages of the New Testament", file: "the_hebrew_pages_of_the_new_testament.html" },
  { title: "The Law is Dead?", file: "the_law_is_dead.html" },
  { title: "The Prodigal Son", file: "the_prodigal_son.html" },
  { title: "The Remnant", file: "the_remnant.html" },
  { title: "Torah Commandments- A List", file: "torah_commandments.html" },
  { title: "The Story", file: "the_story.html" },
  { title: "Understanding Denominations for Unity Sake", file: "understanding_denominations.html" },
  { title: "Who is Q for Christians?", file: "who_is_q_for_christians.html" },
  { title: "Who is Jesus?", file: "who_is_jesus.html" }

];

  let activeController = null;
  let activeArticleFile = "";

  function getEls(root = document) {
    const scope = root && typeof root.querySelector === "function" ? root : document;
    return {
      list: scope.querySelector("#articleList"),
      search: scope.querySelector("#articleSearch"),
      viewer: scope.querySelector("#articleViewer")
    };
  }

  function renderList(listEl, query = "") {
    if (!listEl) return;

    const normalized = query.trim().toLowerCase();
    const matches = ARTICLES.filter(article =>
      !normalized || article.title.toLowerCase().includes(normalized)
    );

    listEl.innerHTML = matches.length ? matches.map(article => `
      <button class="ui-btn w-full text-left" data-file="${article.file}">
        ${article.title}
      </button>
    `).join("") : `<div class="hg-empty">No articles match your search.</div>`;
  }

  function buildArticleUrl(file) {
    const url = new URL(window.location.href);
    url.searchParams.set("card", "articles");

    if (file) {
      url.searchParams.set("file", file);
    } else {
      url.searchParams.delete("file");
    }

    url.hash = "";
    return url;
  }

  function syncArticleUrl(file, mode = "push") {
    if (window.HGRoute) {
      window.HGRoute.setCardState("articles", { file }, {
        replace: mode === "replace",
        announce: false,
        source: "article"
      });
      return;
    }

    const url = buildArticleUrl(file);
    const method = mode === "replace" ? "replaceState" : "pushState";
    window.history[method]({ card: "articles", file }, "", url);
  }

  function getArticleTargetFromLink(link) {
    const href = link?.getAttribute("href") || "";
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return null;
    }

    if (href.startsWith("#")) {
      return activeArticleFile ? `${activeArticleFile.split("#", 1)[0]}${href}` : null;
    }

    try {
      const resolved = new URL(href, window.location.href);
      const articlePath = "/articles/";
      const pathIndex = resolved.pathname.lastIndexOf(articlePath);

      if (pathIndex === -1) return null;

      const fileName = resolved.pathname.slice(pathIndex + articlePath.length);
      return fileName ? `${fileName}${resolved.hash || ""}` : null;
    } catch {
      return null;
    }
  }

  async function loadArticle(file, viewer, options = {}) {
    if (!viewer) return;

    const { updateUrl = false, historyMode = "push" } = options;
    const [fileName, anchor = ""] = String(file || "").split("#", 2);
    if (!fileName) return;

    viewer.innerHTML = "Loading...";

    try {
      const res = await fetch(`articles/${fileName}`);
      if (!res.ok) throw new Error();

      const html = await res.text();
      viewer.innerHTML = html;
      activeArticleFile = anchor ? `${fileName}#${anchor}` : fileName;

      if (updateUrl) {
        syncArticleUrl(activeArticleFile, historyMode);
      }

      if (anchor) {
        const target = Array.from(viewer.querySelectorAll("[id]")).find(el => el.id === anchor);
        target?.scrollIntoView({ block: "start" });
      } else {
        viewer.scrollTop = 0;
      }

    } catch {
      viewer.innerHTML = `<div class="text-red-400">Failed to load article</div>`;
    }
  }

  async function initArticlesCard(root = document) {
    destroyArticlesCard();

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
      loadArticle(button.dataset.file, viewer, { updateUrl: true });
    }, { signal });

    viewer.addEventListener("click", event => {
      const link = event.target.closest("a[href]");
      const targetFile = getArticleTargetFromLink(link);
      if (!targetFile) return;

      event.preventDefault();
      loadArticle(targetFile, viewer, { updateUrl: true });
    }, { signal });

    const route = window.HGRoute?.read?.();
    const routedFile = route?.card === "articles" ? route.file : "";
    const pendingFile = routedFile || window.pendingArticleFile;

    if (pendingFile) {
      const pending = pendingFile;
      const fileName = pending.split("#", 1)[0];
      await loadArticle(pending, viewer, { updateUrl: true, historyMode: "replace" });

      const button = Array.from(list.querySelectorAll("button[data-file]"))
        .find(item => item.dataset.file === fileName);

      button?.classList.add("active");
      window.pendingArticleFile = null;
    }
  }

  function destroyArticlesCard() {
    activeController?.abort();
    activeController = null;
    activeArticleFile = "";
  }

  window.initArticlesCard = initArticlesCard;
  window.destroyArticlesCard = destroyArticlesCard;

  window.HGRoute?.registerCard?.("articles", {
    getState() {
      return activeArticleFile ? { file: activeArticleFile } : {};
    }
  });
})();