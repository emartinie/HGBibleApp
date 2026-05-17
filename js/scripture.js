const INTERLINEAR_VERSES = {
  "Leviticus 21:1": {
    english: "21 And the Lord said unto Moses, Speak unto the priests the sons of Aaron, and say unto them, There shall none be defiled for the dead among his people:",
    hebrew: "א  וַיֹּאמֶר יְהוָה אֶל-מֹשֶׁה, אֱמֹר אֶל-הַכֹּהֲנִים בְּנֵי אַהֲרֹן; וְאָמַרְתָּ אֲלֵהֶם, לְנֶפֶשׁ לֹא-יִטַּמָּא בְּעַמָּיו.",
    transliteration: "Vayomer Yahweh/adonai el-Moshe emor el-hakhonim bney Aharon ve'amarta alehem lenefesh lo-yitama be'amyv.",
    greek: "21 καὶ εἶπεν κύριος πρὸς Μωυσῆν λέγων εἰπὸν τοῖς ἱερεῦσιν τοῖς υἱοῖς Ααρων καὶ ἐρεῖς πρὸς αὐτούς ἐν ταῖς ψυχαῖς οὐ μιανθήσονται ἐν τῷ ἔθνει αὐτῶν",
    greekTranslit: "21 kai eipen kyrios pros Mōysēn legōn eipon tois iereusin tois hyiois Aaron kai ereis pros autous en tais psychais ou mianthēsontai en tō ethnei autōn"
  },

  "Ezekiel 44:15": {
    english: "15 But the priests the Levites, the sons of Zadok, that kept the charge of My sanctuary when the children of Israel went astray from Me, they shall come near to Me to minister unto Me; and they shall stand before Me to offer unto Me the fat and the blood, saith the Lord GOD;",
    hebrew: "טו  וְהַכֹּהֲנִים הַלְוִיִּם בְּנֵי צָדוֹק, אֲשֶׁר שָׁמְרוּ אֶת-מִשְׁמֶרֶת מִקְדָּשִׁי בִּתְעוֹת בְּנֵי-יִשְׂרָאֵל מֵעָלַי--הֵמָּה יִקְרְבוּ אֵלַי, לְשָׁרְתֵנִי; וְעָמְדוּ לְפָנַי, לְהַקְרִיב לִי חֵלֶב וָדָם--נְאֻם, אֲדֹנָי ",
    transliteration: "Ve-ha-kohanim ha-levi'im, beney Tzadoq, asher shamaru et-mishmeret miqdashy, bi-t'ot bney Yisra'el me'aly, hemah yiqrevu elay le-shar'tani, ve-amadu le-panay le-haqriv li khelev ve-dam, ne'um Adonay YHVH.",
    greek: "οἱ ἱερεῖς οἱ Λευεῖται οἱ υἱοὶ τοῦ Σαδδοὺκ οἵτινες ἐφυλάξαντο τὰς φυλακὰς τῶν ἁγίων μου ἐν τῷ πλανᾶσθαι οἶκον Ἰσραὴλ ἀπ᾽ ἐμοῦ, οὗτοι προσάξουσιν πρὸς μὲ τοῦ λειτουργεῖν μοι, καὶ στήσονται πρὸ προσώπου μου τοῦ προσφέρειν μοι θυσίαν, στέαρ καὶ αἷμα, λέγει Κύριος ὁ θεός.",
    greekTranslit: "hoi hiereis hoi Leučitai, hoi huioi tou Saddouk, hoitines ephulaxanto tas phulakas tōn hagiōn mou en tō planasthai oikon Israēl ap' emou, houtoi prosaxousin pros me tou leitourgein moi, kai stēsontai pro prosōpou mou tou prospherein moi thusian, stear kai haima, legei Kyrios ho theos."
  },

  "Matthew 26:2": {
    english: "Ye know that after two days...",
    hebrew: "אַתֶּם יְדַעְתֶּם כִּי עוֹד יוֹמַיִם וְהַפֶּסַח בָּא וּבֶן־הָאָדָם יִמָּסֵר לְהִצָּלֵב׃",
    greek: "Οἴδατε ὅτι μετὰ δύο ἡμέρας τὸ πάσχα γίνεται, καὶ ὁ υἱὸς τοῦ ἀνθρώπου παραδίδοται εἰς τὸ σταυρωθῆναι.",
    greekTranslit: "Oidate hoti meta dyo hēmeras to pascha ginetai, kai ho huios tou anthrōpou paradidotai eis to staurōthēnai."
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

  const verseData = INTERLINEAR_VERSES[firstVerse] || {};

function renderWordMap(words) {
  if (!words?.length) return "No translation available";

  return words
    .map(
      item => `
        <span
          class="interlinear-word cursor-pointer hover:text-orange-300 transition"
          data-word="${item.word}"
          title="${item.translit || item.word}"
        >
          ${item.word}
        </span>
      `
    )
    .join(" ");
}

  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 space-y-5">

      <div class="p-4">
        <div>${storedRef || ""}</div>
        <div>${storedPassage || ""}</div>
        <div>${storedCriteria || ""}</div>
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
        ${storedCriteria || "No recognizable criteria"}
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          English
        </div>
        <div class="text-slate-100 text-lg">
          ${verseData.english || "No translation available"}
        </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Hebrew
        </div>
        <div class="text-right text-blue-300 text-2xl leading-loose">
          ${renderWordMap(verseData.hebrew)}
        </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Transliteration
        </div>
        <div class="text-purple-300 text-lg italic">
          ${verseData.transliteration || "No translation available"}
        </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Greek Septuagint
        </div>
        <div class="text-emerald-300 text-lg">
          ${renderWordMap(verseData.greek)}
        </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Greek Transliteration
        </div>
        <div class="text-amber-200 text-base italic">
          ${verseData.greekTranslit || "No translation available"}
        </div>
      </div>

    </div>
  `;
}

loadInterlinear();
