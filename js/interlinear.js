async function loadInterlinear() {
  const container = document.getElementById("interlinearContent");

  if (!container) return;

  container.innerHTML = "Loading interlinear...";

  try {
    const res = await fetch("data/interlinear/week29.json");

    if (!res.ok) {
      throw new Error("Missing interlinear JSON");
    }

    const data = await res.json();

    container.innerHTML = data.verses.map(v => `
      <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
        
        <div class="text-orange-300 font-semibold mb-2">
          ${v.ref}
        </div>

        <div class="mb-3 text-lg">
          ${v.english}
        </div>

        <div class="mb-3 text-right text-blue-300 text-xl leading-loose">
          ${v.hebrew}
        </div>

        <div class="text-purple-300 text-lg">
          ${v.greek}
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

document.addEventListener("DOMContentLoaded", loadInterlinear);
