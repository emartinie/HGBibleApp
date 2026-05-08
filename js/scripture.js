async function loadInterlinear() {
  const container = document.getElementById("interlinearContent");
  if (!container) return;

  const storedRef = localStorage.getItem("scriptureSearch");

  const firstVerse =
    storedRef && storedRef.includes("-")
      ? storedRef.split("-")[0]
      : storedRef || "Leviticus 16:1";

  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 space-y-5">

      <div class="text-orange-300 font-semibold text-lg border-b border-slate-700 pb-2">
        ${firstVerse}
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          English
        </div>
        <div class="text-slate-100 text-lg">
          19 And the Lord spake unto Moses, saying,
             Speak unto all the congregation of the children of Israel, and say unto them, Ye shall be holy: for I the Lord your God am holy.
        </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Hebrew
        </div>
        <div class="text-right text-blue-300 text-2xl leading-loose">
  ${`וַיְדַבֵּ֥ר יְהוָ֖ה אֶל־מֹשֶׁ֥ה לֵּאמֹֽר
דַּבֵּ֞ר אֶל־כָּל־עֲדַ֧ת בְּנֵי־יִשְׂרָאֵ֛ל וְאָמַרְתָּ֥ אֲלֵהֶ֖ם קְדֹשִׁ֣ים תִּהְי֑וּ כִּ֣י קָד֔וֹשׁ אֲנִ֖י יְהוָ֥ה אֱלֹהֵיכֶֽם׃`
    .split(" ")
    .map(word => `
      <span
        class="cursor-pointer hover:text-orange-300 transition"
        title="${word}"
      >
        ${word}
      </span>
    `)
    .join(" ")}
</div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Transliteration
        </div>
        <div class="text-purple-300 text-lg italic">
          Vayedaber Adonai el-Moshe acharei mot shnei bnei Aharon
        </div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Greek
        </div>
        <div class="text-emerald-300 text-lg">
  ${`καὶ ἐλάλησεν κύριος πρὸς Μωυσῆν λέγων
    λάλησον τῇ συναγωγῇ τῶν υἱῶν Ισραηλ καὶ ἐρεῖς πρὸς αὐτούς ἅγιοι ἔσεσθε ὅτι ἐγὼ ἅγιος κύριος ὁ θεὸς ὑμῶν`
    .split(" ")
    .map(word => `
      <span
        class="cursor-pointer hover:text-orange-300 transition"
        title="${word}"
      >
        ${word}
      </span>
    `)
    .join(" ")}
</div>
      </div>

      <div>
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Greek Transliteration
        </div>
        <div class="text-amber-200 text-base italic">
          Kai elalēsen Kyrios pros Mōusēn meta to teleutēsai tous duo huious Aarōn
        </div>
      </div>

    </div>
  `;
}

loadInterlinear();
