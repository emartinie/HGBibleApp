const INTERLINEAR_VERSES = {
  "Leviticus 21:1": {
    english: "21 And the Lord said unto Moses...",
    hebrew: "וַיֹּאמֶר יְהוָה...",
    transliteration: "Vayomer Adonai...",
    greek: "καὶ εἶπεν κύριος...",
    greekTranslit: "kai eipen kyrios..."
  },

  "Ezekiel 44:15": {
    english: "But the priests the Levites...",
    hebrew: "וְהַכֹּהֲנִים...",
    transliteration: "Veha-kohanim...",
    greek: "οἱ δὲ ἱερεῖς...",
    greekTranslit: "hoi de hiereis..."
  },

  "Matthew 26:2": {
    english: "Ye know that after two days...",
    greek: "Οἴδατε ὅτι μετὰ δύο ἡμέρας...",
    greekTranslit: "Oidate hoti meta duo hemeras..."
  }
};

async function loadInterlinear() {
  const container = document.getElementById("interlinearContent");
  if (!container) return;

const storedRef = localStorage.getItem("scriptureSearch");
const storedPassage = localStorage.getItem("selectedPassage");
const storedCriteria = localStorage.getItem("selectedCriteria");

  const firstVerse =
  storedRef && storedRef.includes("-")
    ? storedRef.split("-")[0]
    : storedRef || "Leviticus 21:1";

const verseData = INTERLINEAR_VERSES[firstVerse];

//      ${verseData.english}
 //     ${verseData.hebrew}
//      ${verseData.transliteration}
//      ${verseData.greek}
//      ${verseData.greekTranslit}

  //helper
  function renderWordMap(text) {
  if (!text) return "No translation available";

  return text
    .split(" ")
    .map(word => `
      <span
        class="cursor-pointer hover:text-orange-300 transition"
        title="${word}"
      >
        ${word}
      </span>
    `)
    .join(" ");
}
  
  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 space-y-5">
            <div class="p-4">
    <div>${storedRef}</div>
    <div>${storedPassage}</div>
    <div>${storedCriteria}</div>
  </div>

      <div class="text-orange-300 font-semibold text-lg border-b border-slate-700 pb-2">
  ${firstVerse}
</div>
<div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Interlinear Study Translations
        </div>
<div class="text-xs text-slate-400">
  Verse Translation File: ${storedPassage || "none"}
</div>

<div class="text-xs text-orange-300 italic">
  ${storedCriteria || "No recognizeable criteria"}
</div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          English
        </div>
        <div class="text-slate-100 text-lg">
        ${verseData?.english || "No translation available"}
      </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Hebrew
        </div>
        <div class="text-right text-blue-300 text-2xl leading-loose">
      ${renderWordMap(verseData?.hebrew)}      
      </div>
      </div>
      
 // ${`א  וַיֹּאמֶר יְהוָה אֶל-מֹשֶׁה, אֱמֹר אֶל-הַכֹּהֲנִים בְּנֵי אַהֲרֹן; וְאָמַרְתָּ אֲלֵהֶם, לְנֶפֶשׁ לֹא-יִטַּמָּא בְּעַמָּיו. `
  //  .split(" ")
  //  .map(word => `
  //    <span
  //      class="cursor-pointer hover:text-orange-300 transition"
  //      title="${word}"
 //     >
   //     ${word}
  //    </span>
 //   `)
 //   .join(" ")}
//</div>
    //  </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Transliteration
        </div>
        <div class="text-purple-300 text-lg italic">
            ${verseData?.greekTranslit || "No translation available"}
      </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Greek Septuagint
        </div>
        <div class="text-emerald-300 text-lg">
        ${renderWordMap(verseData?.greek)}
      </div>

      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Greek Transliteration
        </div>
        <div class="text-amber-200 text-base italic">
          ${verseData?.greektransliteration || "No translation available"}
      </div>
      </div>

    </div>
  `;
}


loadInterlinear();
