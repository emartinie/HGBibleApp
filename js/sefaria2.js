window.initSefariaLibraryCard = function initSefariaLibraryCard() {

const grid = document.getElementById("sefariaLibraryGrid");
const searchInput = document.getElementById("sefariaLibrarySearch");
const searchBtn = document.getElementById("sefariaLibrarySearchBtn");
const homeBtn = document.getElementById("sefariaLibraryHomeBtn");
const empty = document.getElementById("sefariaLibraryEmpty");

if (!grid || !searchInput) return;

const categories = [

{
id:"scripture",
icon:"📖",
title:"Scripture",
description:"Tanakh in Hebrew and English, Torah Portions, Haftarah, and daily readings.",
items:[
"Tanakh",
"Torah",
"Prophets",
"Writings",
"Hebrew & English"
],
sefariaPath:"/texts/Tanakh"
},

{
id:"commentary",
icon:"📚",
title:"Classic Commentaries",
description:"Verse-by-verse interpretation from major Jewish commentators.",
items:[
"Rashi",
"Ramban",
"Ibn Ezra",
"Sforno",
"Malbim"
],
sefariaPath:"/texts/Commentary"
},

{
id:"midrash",
icon:"🏛",
title:"Midrash",
description:"Rabbinic interpretation, teaching, storytelling, and textual expansion.",
items:[
"Midrash Rabbah",
"Tanchuma",
"Mekhilta",
"Sifra",
"Sifrei"
],
sefariaPath:"/texts/Midrash"
},

{
id:"mishnah",
icon:"⚖",
title:"Mishnah",
description:"The foundational compilation of the Oral Torah.",
items:[
"Zeraim",
"Moed",
"Nashim",
"Nezikin",
"Kodashim",
"Tohorot"
],
sefariaPath:"/texts/Mishnah"
},

{
id:"talmud",
icon:"📜",
title:"Talmud",
description:"Browse the Babylonian and Jerusalem Talmuds.",
items:[
"Babylonian Talmud",
"Jerusalem Talmud",
"Daf",
"Tractates"
],
sefariaPath:"/texts/Talmud"
},

{
id:"tosefta",
icon:"🗂",
title:"Tosefta",
description:"Rabbinic material closely related to the Mishnah.",
items:[
"Orders",
"Tractates",
"Parallel Traditions"
],
sefariaPath:"/texts/Tosefta"
},

{
id:"halakhah",
icon:"⚖️",
title:"Jewish Law",
description:"Major legal codes and works on commandments.",
items:[
"Mishneh Torah",
"Shulchan Arukh",
"Sefer HaChinukh",
"Sefer HaMitzvot"
],
sefariaPath:"/texts/Halakhah"
},

{
id:"philosophy",
icon:"🧠",
title:"Jewish Thought",
description:"Philosophy, ethics and theology.",
items:[
"Guide for the Perplexed",
"Kuzari",
"Duties of the Heart",
"Eight Chapters"
],
sefariaPath:"/texts/Jewish%20Thought"
},

{
id:"kabbalah",
icon:"✨",
title:"Kabbalah",
description:"Mystical Jewish writings.",
items:[
"Zohar",
"Sefer Yetzirah",
"Bahir",
"Pri Etz Chaim"
],
sefariaPath:"/texts/Kabbalah"
},

{
id:"chasidut",
icon:"🔥",
title:"Chasidut",
description:"Hasidic teachings and devotional works.",
items:[
"Tanya",
"Likutei Moharan",
"Sefat Emet",
"Mei HaShiloach"
],
sefariaPath:"/texts/Chasidut"
},

{
id:"liturgy",
icon:"🙏",
title:"Liturgy",
description:"Prayer books and blessings.",
items:[
"Siddur",
"Machzor",
"Holiday Prayers",
"Blessings"
],
sefariaPath:"/texts/Liturgy"
},

{
id:"second-temple",
icon:"📚",
title:"Second Temple Writings",
description:"Selected Jewish works outside the Tanakh.",
items:[
"Ben Sira",
"Tobit",
"Judith",
"Maccabees"
],
sefariaPath:"/texts/Second%20Temple"
},

{
id:"topics",
icon:"🌍",
title:"Topics",
description:"People, places, themes and festivals.",
items:[
"People",
"Places",
"Themes",
"Festivals",
"Laws"
],
sefariaPath:"/topics"
},

{
id:"connections",
icon:"🔗",
title:"Connections",
description:"Trace related passages and commentary.",
items:[
"Commentary",
"Midrash",
"Talmud",
"Cross References"
],
sefariaPath:"/texts"
},

{
id:"calendar",
icon:"📅",
title:"Calendar",
description:"Weekly portions and daily study.",
items:[
"Parashah",
"Haftarah",
"Holidays",
"Daily Study"
],
sefariaPath:"/calendars"
},

{
id:"sheets",
icon:"📝",
title:"Source Sheets",
description:"Curated studies combining Scripture and commentary.",
items:[
"Study Sheets",
"Collections",
"Discussion",
"Teaching"
],
sefariaPath:"/sheets"
}

];

function escapeHtml(value){
return String(value||"")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}

function openSefaria(path){

const cleanPath =
String(path||"/texts").startsWith("/")
? path
: "/" + path;

window.open(
"https://www.sefaria.org"+cleanPath,
"_blank",
"noopener,noreferrer"
);

}

function render(items = categories){

grid.innerHTML = items.map(category => `

<article
class="hg-panel p-4 flex flex-col gap-3"
data-library-category="${escapeHtml(category.id)}">

<div class="flex items-start gap-3">

<div class="text-2xl">
${category.icon}
</div>

<div>

<h3 class="text-lg font-semibold text-amber-300">
${escapeHtml(category.title)}
</h3>

<p class="text-sm text-slate-300 mt-1">
${escapeHtml(category.description)}
</p>

</div>

</div>

<ul class="text-sm text-slate-400 space-y-1">

${category.items.map(item=>`

<li>• ${escapeHtml(item)}</li>

`).join("")}

</ul>

<div class="mt-auto pt-2">

<button
class="ui-btn sefaria-library-open-btn"
type="button"
data-sefaria-path="${escapeHtml(category.sefariaPath)}">

Open ${escapeHtml(category.title)}

</button>

</div>

</article>

`).join("");

if(empty){
empty.classList.toggle("hidden",items.length>0);
}

grid
.querySelectorAll(".sefaria-library-open-btn")
.forEach(button=>{

button.addEventListener("click",()=>{

openSefaria(
button.dataset.sefariaPath || "/texts"
);

});

});

}

function handleSearch(){

const query =
searchInput.value.trim().toLowerCase();

if(!query){

render(categories);
return;

}

const matches = categories.filter(category=>{

const searchable=[

category.title,
category.description,
...category.items

].join(" ").toLowerCase();

return searchable.includes(query);

});

render(matches);

}

searchBtn?.addEventListener(
"click",
handleSearch
);

searchInput.addEventListener(
"input",
handleSearch
);

searchInput.addEventListener(
"keydown",
event=>{

if(event.key==="Enter"){

handleSearch();

}

}
);

homeBtn?.addEventListener(
"click",
()=>{

searchInput.value="";

render(categories);

grid.scrollIntoView({

behavior:"smooth",
block:"start"

});

}
);

render(categories);

};
