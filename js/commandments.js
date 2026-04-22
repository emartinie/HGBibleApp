(async function () {
  const container = document.getElementById("commandmentsList");
  if (!container) return;

  try {
    const res = await fetch("data/commandments/commandments.json");
    const data = await res.json();

container.innerHTML = data.map(cmd => `
  <div class="bg-slate-900/70 border border-slate-700 rounded-lg p-3 space-y-2">

    <div class="text-xs text-slate-400">
      ${cmd.code} • ${cmd.category}
    </div>

    <div class="font-medium text-white">
      ${cmd.title}
    </div>

    <div class="text-slate-400 text-xs">
      ${cmd.reference}
    </div>

    ${cmd.themes?.length ? `
      <div class="text-xs text-amber-300">
        ${cmd.themes.join(", ")}
      </div>
    ` : ""}

    ${cmd.commentary ? `
      <div class="text-xs text-slate-300 italic">
        ${cmd.commentary}
      </div>
    ` : ""}

    <div class="flex flex-wrap gap-2 mt-2">

      <button class="ui-btn" onclick="loadFromReference('${cmd.reference}')">
        📖 Torah
      </button>

      ${cmd.nt_links?.length ? cmd.nt_links.map(link => `
        <button class="ui-btn" onclick="loadFromReference('${link}')">
          ✝️ ${link}
        </button>
      `).join("") : ""}

      ${cmd.sefaria_links?.length ? cmd.sefaria_links.map(link => `
        <button class="ui-btn" onclick="loadFromSefaria('${link}')">
          📚 Context
        </button>
      `).join("") : ""}

    </div>

  </div>
`).join("");

  } catch (err) {
    container.innerHTML = `<div class="text-red-400">Failed to load</div>`;
    console.error(err);
  }
})();
