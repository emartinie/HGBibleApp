async function loadInterlinear() {
  const container = document.getElementById("interlinearContent");

  if (!container) return;

  container.innerHTML = "Loading interlinear...";
  const storedRef = localStorage.getItem("scriptureSearch");

const firstVerse =
  storedRef && storedRef.includes("-")
    ? storedRef.split("-")[0]
    : storedRef;

  try {
    const res = await fetch("data/interlinear/week29.json");

    if (!res.ok) {
      throw new Error("Missing interlinear JSON");
    }

    const data = await res.json();

    container.innerHTML = data.verses.map(v => `
      <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
        
        <div class="text-orange-300 font-semibold mb-2">
          ${firstVerse || v.ref}
        </div>

        <div class="mb-3 text-lg">
          ${v.english}
        </div>

        <div class="mb-3 text-right text-blue-300 text-xl leading-loose">
  ${v.hebrew.split(" ").map(word => `
    <span
      class="cursor-pointer hover:text-orange-300 transition"
      title="${word}"
    >
      ${word}
    </span>
  `).join(" ")}
</div>

        <div class="text-purple-300 text-lg">
  ${v.greek.split(" ").map(word => `
    <span
      class="cursor-pointer hover:text-orange-300 transition"
      title="${word}"
    >
      ${word}
    </span>
  `).join(" ")}
</div>

      </div>
    `).join("");

  } catch (err) {
    console.error(err);

    container.innerHTML = `
      <div class="text-red-400">
        Failed loading interlinear.
      </div>
    `;
  }
}

//document.addEventListener("DOMContentLoaded", loadInterlinear);

loadInterlinear();
