function extractFirstVerse(ref) {
  if (!ref) return "";
  return ref.includes("-") ? ref.split("-")[0] : ref;
}

async function loadInterlinear() {
  const container = document.getElementById("interlinearContent");
  const meta = document.getElementById("scriptureMeta");

  if (!container) return;

  container.innerHTML = "Loading interlinear...";

  // pull scripture ref from mainstage click
  const storedRef = localStorage.getItem("scriptureSearch") || "Genesis 1:1";
  const firstVerse = extractFirstVerse(storedRef);

  if (meta) {
    meta.textContent = firstVerse;
  }

  try {
    // TEMP: still loading current test json
    const res = await fetch("data/interlinear/week29.json");

    if (!res.ok) {
      throw new Error("Missing interlinear JSON");
    }

    const data = await res.json();

    // TEMP: just use first verse from json
    const v = data.verses?.[0];

    if (!v) {
      throw new Error("No verse data found");
    }

    container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 space-y-4">

        <div class="text-orange-300 font-semibold">
          ${firstVerse}
        </div>

        <div class="text-right text-blue-300 text-xl leading-loose">
          ${v.hebrew
            .split(" ")
            .map(
              (word) => `
                <span
                  class="cursor-pointer hover:text-orange-300 transition"
                  title="${word}"
                >
                  ${word}
                </span>
              `
            )
            .join(" ")}
        </div>

        <div class="text-purple-300 text-lg">
          ${v.greek
            .split(" ")
            .map(
              (word) => `
                <span
                  class="cursor-pointer hover:text-orange-300 transition"
                  title="${word}"
                >
                  ${word}
                </span>
              `
            )
            .join(" ")}
        </div>

        <div class="text-lg text-slate-100">
          ${v.english}
        </div>

      </div>
    `;
  } catch (err) {
    console.error(err);

    container.innerHTML = `
      <div class="text-red-400">
        Failed loading interlinear.
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", loadInterlinear);
