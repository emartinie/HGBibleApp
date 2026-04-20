(async function () {

  const API_KEY = "5sFfxuspfEX8TD9YAODX8";
  const BIBLE_ID = "de4e12af7f28f599-02"; // KJV example

  const root = document.getElementById("scriptureContent");
  if (!root) return;

  async function loadChapter(book = "JHN", chapter = "1") {
    root.innerHTML = "Loading...";

    try {
      const res = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/chapters/${book}.${chapter}`,
        {
          headers: {
            "api-key": API_KEY
          }
        }
      );

      const data = await res.json();

      if (!data?.data?.content) throw new Error();

      root.innerHTML = `
        <div class="prose prose-invert max-w-none">
          ${data.data.content}
        </div>
      `;

    } catch (err) {
      root.innerHTML = `<div class="text-red-400">Failed to load scripture</div>`;
      console.error(err);
    }
  }

  loadChapter(); // default test

})();
