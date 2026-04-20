(async function () {

  const API_BASE = "https://rest.api.bible";
  const API_KEY = "5sFfxuspfEX8TD9YAODX8";
  const BIBLE_ID = "a6aee10bb058511c-01"; // KJV example

  const root = document.getElementById("scriptureContent");
  if (!root) return;

async function loadChapter(book = "JHN", chapter = "1") {
  root.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE}/v1/bibles/${BIBLE_ID}/chapters/${book}.${chapter}`,
      {
        method: "GET",
        headers: {
          "api-key": API_KEY,
          "accept": "application/json"
        }
      }
    );

    const data = await res.json();
    console.log("API RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data?.message || `HTTP ${res.status}`);
    }

    if (!data?.data?.content) {
      throw new Error("No scripture content returned");
    }

    root.innerHTML = `
      <div class="prose prose-invert max-w-none">
        ${data.data.content}
      </div>
    `;
  } catch (err) {
    root.innerHTML = `
      <div class="text-red-400">
        Failed to load scripture: ${err.message}
      </div>
    `;
    console.error(err);
  }
}
  loadChapter(); // default test

})();
