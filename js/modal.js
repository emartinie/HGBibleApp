
      // ---------------------------------
      // MODAL OPEN/CLOSE + FLIP
      // ---------------------------------
function getSelectedWeekNumber() {
  const select = document.getElementById("weekSelect");
  if (!select) return 1;

  const val = parseInt(select.value, 10);
  return isNaN(val) ? 1 : val;
}      

function openDockCModal() {
        const modal = document.getElementById("dockC-modal");
        if (!modal) return;
        modal.classList.remove("hidden");          // ✅ show (Tailwind)
        document.body.style.overflow = "hidden";   // lock background scroll
      }
      window.openDockCModal = openDockCModal;

      function closeDockCModal() {
        const modal = document.getElementById("dockC-modal");
        if (!modal) return;
        modal.classList.add("hidden");             // ✅ hide
        document.body.style.overflow = "";         // restore scroll

        // reset to front when closing
        const flip = document.getElementById("dockC-flipWrapper");
        if (flip) flip.classList.remove("is-flipped");
      }

      function toggleDockCFace() {
        const flip = document.getElementById("dockC-flipWrapper");
        if (!flip) return;
        flip.classList.toggle("is-flipped");
      }

      // Make sure the flip button calls the toggle
      document.getElementById("flipModalBtn")?.addEventListener("click", toggleDockCFace);

      // ---------------------------------
      // SCRIPTURE + COMMENTARY LOADER
      // ---------------------------------
      const SCRIPTURE_DIR = "scripture/english";
      const COMMENTARY_DIR = "commentary";

      async function loadScriptureForCurrentWeek() {
        const week = getSelectedWeekNumber();
        const scripturePath = `${SCRIPTURE_DIR}/week${week}.html`;
        const commentaryPath = `${COMMENTARY_DIR}/week${week}.html`;

        const scriptureBox = document.getElementById("scriptureBox");
        const commentaryBox = document.getElementById("commentaryBox");
        const weekLabel = document.getElementById("modalWeekLabel");

        if (weekLabel) weekLabel.textContent = `Week ${week}`;

        if (scriptureBox) {
          scriptureBox.innerHTML = `<p class="text-orange-300 text-sm">Loading scripture from <code>${scripturePath}</code>...</p>`;
        }
        if (commentaryBox) {
          commentaryBox.innerHTML = `<p class="text-yellow-300 text-sm">Loading commentary from <code>${commentaryPath}</code>...</p>`;
        }

        // Scripture
        if (scriptureBox) {
          try {
            const res = await fetch(scripturePath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            scriptureBox.innerHTML = html;
          } catch (err) {
            console.error("Scripture load failed:", err);
            scriptureBox.innerHTML = `<p class="text-red-400 text-sm">Unable to load scripture file:<br>${scripturePath}</p>`;
          }
        }

        // Commentary (optional – don't fail hard)
        if (commentaryBox) {
          try {
            const res = await fetch(commentaryPath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            commentaryBox.innerHTML = html;
          } catch (err) {
            console.warn("Commentary load failed (this is ok if you don't have files yet):", err);
            commentaryBox.innerHTML = `<p class="text-slate-300 text-sm italic">
            No commentary file found for Week ${week} yet.
          </p>`;
          }
        }
      }

      function loadAndOpenScripture() {
        loadScriptureForCurrentWeek()
          .then(openDockCModal)
          .catch(err => {
            console.error(err);
            openDockCModal();
          });
      }

      document.getElementById("openScriptureBtn")?.addEventListener("click", loadAndOpenScripture);
      document.getElementById("openScriptureHeaderBtn")?.addEventListener("click", loadAndOpenScripture);


      // Auto-refetch scripture when weekSelect changes
      document.getElementById("weekSelect")?.addEventListener("change", () => {
        // If modal is open, update its content when week changes
        const modal = document.getElementById("dockC-modal");
        if (modal && modal.classList.contains("hidden")) {
          loadScriptureForCurrentWeek();
        }
      });
 


      document.addEventListener("DOMContentLoaded", () => {
        const scriptureBox = document.getElementById("scriptureBox");
        if (scriptureBox) {
          scriptureBox.style.minHeight = "45vh";
          scriptureBox.style.overflowY = "auto";
        }
      });

      document.addEventListener("DOMContentLoaded", () => {
        // Select both the front and back h2 elements
        const frontLabel = document.querySelector('.flip-face.front h2');
        const backLabel = document.querySelector('.flip-face.back h2');

        // Apply the centering   style
        [frontLabel, backLabel].forEach(label => {
          if (label) {
            label.style.textAlign = "center";
          }
        });
      });
 
