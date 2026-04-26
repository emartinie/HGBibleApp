  <!-- today JS -->
    document.addEventListener("DOMContentLoaded", () => {

      // ===== DATE =====
      const now = new Date();
      const prettyDate = now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric"
      });

      document.getElementById("todayDatePretty").textContent = prettyDate;

      // ===== VERSE (placeholder logic) =====
      const verses = [
        {
          ref: "Psalm 23:1",
          text: "The LORD is my shepherd; I shall not want."
        },
        {
          ref: "John 14:27",
          text: "Peace I leave with you; my peace I give you."
        },
        {
          ref: "Proverbs 3:5",
          text: "Trust in the LORD with all your heart."
        }
      ];

      // rotate by day
      const index = now.getDate() % verses.length;
      const verse = verses[index];

      document.getElementById("todayVerseRef").textContent = verse.ref;
      document.getElementById("todayVerseText").textContent = `"${verse.text}"`;

      // ===== UPCOMING EVENT (placeholder) =====
      const upcomingEl = document.getElementById("upcomingEvent");

      // simple example (replace later with calendar / firestore)
      const day = now.getDay();

      if (day === 5) {
        upcomingEl.textContent = "Sabbath begins at sunset.";
      } else if (day === 6) {
        upcomingEl.textContent = "Sabbath is today.";
      } else {
        upcomingEl.textContent = "";
      }

      // ===== ACTION BUTTON =====
      document.getElementById("todayActionBtn").addEventListener("click", () => {
        alert("Play / meditate / continue flow here.");
      });

    });
