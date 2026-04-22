(async function () {
  const container = document.getElementById("commandmentsList");
  if (!container) return;

  try {
    const res = await fetch("data/commandments/commandments.json");
    const data = await res.json();

    container.innerHTML = data.map(cmd => `
      <div class="bg-slate-900/70 border border-slate-700 rounded-lg p-3">
        <div class="text-xs text-slate-400">
          ${cmd.code} • ${cmd.category}
        </div>

        <div class="font-medium text-white">
          ${cmd.title}
        </div>

        <div class="text-slate-400 text-xs mt-1">
          ${cmd.reference}
        </div>

        <div class="flex gap-2 mt-2">
          <button class="ui-btn" onclick="loadFromReference('${cmd.reference}')">
            📖 Scripture
          </button>

          <button class="ui-btn" onclick="loadFromSefaria('${cmd.reference}')">
            📚 Context
          </button>
        </div>
      </div>
    `).join("");

  } catch (err) {
    container.innerHTML = `<div class="text-red-400">Failed to load</div>`;
    console.error(err);
  }
})();
