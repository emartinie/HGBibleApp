(async function () {
  const container = document.getElementById("commandmentsList");
  if (!container) return;

  function groupByCategory(items) {
    return items.reduce((acc, item) => {
      const key = item.category || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  function renderCommandment(cmd) {
    return `
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

          <button class="ui-btn"
            onclick="loadFromSefaria('${(cmd.sefaria_links && cmd.sefaria_links[0]) || cmd.reference}')">
            📚 Context
          </button>
        </div>
      </div>
    `;
  }

  function renderCategory(categoryName, items, index) {
    const sectionId = `cmd-category-${index}`;

    return `
      <section class="rounded-2xl border border-slate-700 bg-slate-950/40 overflow-hidden">
        <button
          class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50"
          type="button"
          data-toggle="${sectionId}"
          aria-expanded="${index === 0 ? "true" : "false"}"
        >
          <span class="font-semibold text-cyan-200">
            ${categoryName}
          </span>

          <span class="text-xs text-slate-400">
            ${items.length} item${items.length === 1 ? "" : "s"}
          </span>
        </button>

        <div
          id="${sectionId}"
          class="${index === 0 ? "" : "hidden"} px-4 pb-4 space-y-3"
        >
          ${items.map(renderCommandment).join("")}
        </div>
      </section>
    `;
  }

  try {
    const res = await fetch("data/commandments/commandments.json");
    const data = await res.json();

    const grouped = groupByCategory(data);
    const categories = Object.entries(grouped);

    container.innerHTML = `
      <div class="space-y-4">
        ${categories.map(([categoryName, items], index) =>
          renderCategory(categoryName, items, index)
        ).join("")}
      </div>
    `;

    container.querySelectorAll("[data-toggle]").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-toggle");
        const panel = document.getElementById(targetId);
        if (!panel) return;

        const isHidden = panel.classList.contains("hidden");
        panel.classList.toggle("hidden", !isHidden);
        btn.setAttribute("aria-expanded", isHidden ? "true" : "false");
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="text-red-400">Failed to load</div>`;
    console.error(err);
  }
})();
