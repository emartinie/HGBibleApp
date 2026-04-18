// --- articles.js ---
console.log("🧾 Articles system online");

const ARTICLE_FOLDER = "articles/";

(function () {
const articles = [
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
  { title: "The Hebrew Roots of Revelation", file: "the_book_of_revelation_hebrew_roots.html" },
  { title: "The Commandments of Jesus", file: "the_commandments_of_jesus.html" },
  { title: "The Hebrew Pages of the New Testament", file: "the_hebrew_pages_of_the_new_testament.html" },
  { title: "The Law is Dead?", file: "the_law_is_dead.html" },
  { title: "The Prodigal Son", file: "the_prodigal_son.html" },
  { title: "The Remnant", file: "the_remnant.html" },
  { title: "Torah Commandments- A List", file: "torah_commandments.html" },
  { title: "The Story", file: "the_story.html" },
  { title: "Understanding Denominations for Unity Sake", file: "understanding_denominations.html" },
  { title: "Where Did the Sabbath Go?", file: "where_did_the_sabbath_go.html" },
  { title: "Who is Q for Christians?", file: "who_is_q_for_christians.html" }
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
