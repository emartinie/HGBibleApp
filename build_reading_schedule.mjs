import fs from "node:fs/promises";
import path from "node:path";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const app = "C:/Users/eddie/Documents/Codex/Sandbox/HGBibleApp-main";
const out = "C:/Users/eddie/Documents/Codex/2026-07-03/w/outputs";

const portions = [
  ["Bereshit","בראשית","In the Beginning"],["Noach","נח","Noah"],["Lech-Lecha","לך לך","Go Forth"],["Vayera","וירא","He Appeared"],
  ["Chayei Sara","חיי שרה","Life of Sarah"],["Toldot","תולדות","Generations"],["Vayetzei","ויצא","He Went Out"],["Vayishlach","וישלח","He Sent"],
  ["Vayeshev","וישב","He Settled"],["Miketz","מקץ","At the End"],["Vayigash","ויגש","He Drew Near"],["Vayechi","ויחי","He Lived"],
  ["Shemot","שמות","Names"],["Vaera","וארא","I Appeared"],["Bo","בא","Come"],["Beshalach","בשלח","When He Sent"],["Yitro","יתרו","Jethro"],
  ["Mishpatim","משפטים","Judgments"],["Terumah","תרומה","Contribution"],["Tetzaveh","תצוה","You Shall Command"],["Ki Tisa","כי תשא","When You Lift"],
  ["Vayakhel","ויקהל","He Assembled"],["Pekudei","פקודי","Accounts"],["Vayikra","ויקרא","And He Called"],["Tzav","צו","Command"],
  ["Shmini","שמיני","Eighth"],["Tazria","תזריע","She Will Conceive"],["Metzora","מצורע","Leper"],["Achrei Mot","אחרי מות","After the Death"],
  ["Kedoshim","קדושים","Holy Ones"],["Emor","אמר","Say"],["Behar","בהר","On the Mount"],["Bechukotai","בחוקותי","By My Decrees"],
  ["Bamidbar","במדבר","In the Wilderness"],["Nasso","נשא","Lift Up"],["Beha’alotcha","בהעלתך","When You Light"],["Sh’lach","שלח","Send"],
  ["Korach","קרח","Korah"],["Chukat","חקת","Statute"],["Balak","בלק","Balak"],["Pinchas","פינחס","Phinehas"],["Matot","מטות","Tribes"],
  ["Masei","מסעי","Journeys"],["Devarim","דברים","Words"],["Vaetchanan","ואתחנן","I Pleaded"],["Eikev","עקב","Because"],["Re’eh","ראה","See"],
  ["Shoftim","שופטים","Judges"],["Ki Teitzei","כי תצא","When You Go Out"],["Ki Tavo","כי תבוא","When You Come In"],["Nitzavim","נצבים","Standing"],
  ["Vayeilech","וילך","And He Went"],["Ha’azinu","האזינו","Listen"],["Vezot Haberakhah","וזאת הברכה","This Is the Blessing"]
];

function csvParse(text) {
  const rows=[]; let row=[], cell="", q=false;
  for (let i=0;i<text.length;i++) { const c=text[i], n=text[i+1];
    if (q && c==='"' && n==='"') { cell+='"'; i++; }
    else if (c==='"') q=!q;
    else if (!q && c===',') { row.push(cell); cell=""; }
    else if (!q && (c==='\n'||c==='\r')) { if(c==='\r'&&n==='\n')i++; row.push(cell); if(row.some(x=>x!==""))rows.push(row); row=[]; cell=""; }
    else cell+=c;
  }
  if(cell||row.length){row.push(cell);rows.push(row);} return rows;
}

function csvEscape(v) { const s=String(v??""); return /[",\r\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s; }
function csvString(headers, rows) { return "\uFEFF"+[headers,...rows.map(r=>headers.map(h=>r[h]??""))].map(r=>r.map(csvEscape).join(",")).join("\r\n")+"\r\n"; }
function clean(s="") { return s.replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/&#39;/g,"'").replace(/\s+/g," ").trim(); }
function sefaria(ref) { return ref ? `https://www.sefaria.org/${encodeURIComponent(ref.replace(/ – /g,"-"))}?lang=bi` : ""; }
function colName(n){let s="";while(n>=0){s=String.fromCharCode(n%26+65)+s;n=Math.floor(n/26)-1;}return s;}

const aliyot = new Map();
const canonicalName=s=>String(s).replace(/[’‘]/g,"'");
for (const year of [5787,5788,5789,5790,5791,5792,5793,5794,5795,5796,5797]) {
  const txt=await (await fetch(`https://www.hebcal.com/sedrot/fullkriyah-${year}.csv`)).text();
  for (const r of csvParse(txt).slice(1)) {
    const [date,name,aliyah,rawReading]=r;
    const reading=String(rawReading||"").split(" | ")[0].trim();
    const normalized=name==="Simchat Torah"?"Vezot Haberakhah":canonicalName(name);
    if (/^[1-7]$/.test(aliyah) && portions.some(p=>canonicalName(p[0])===normalized)) {
      const key=`${normalized}|${aliyah}`; if(!aliyot.has(key)) aliyot.set(key,{reading,date});
    }
  }
}
for(const [portion] of portions){for(let d=1;d<=7;d++){const hit=aliyot.get(`${canonicalName(portion)}|${d}`);if(hit)aliyot.set(`${portion}|${d}`,hit);}}

async function localWeek(week) {
  const candidates=[`week${week}.html`,`week${String(week).padStart(2,"0")}.html`]; let html="", rel="";
  for(const f of candidates){try{html=await fs.readFile(path.join(app,"scripture/english",f),"utf8");rel=f;break}catch{}}
  const reads={};
  for(const m of html.matchAll(/<li><strong>([^<]+)<\/strong>\s*([^<]+)<\/li>/gi)) reads[clean(m[1]).replace(/:$/,'')]=clean(m[2]);
  if(!Object.keys(reads).length){try{const fallback=await fs.readFile(path.join(app,"scripture/greek",`week${String(week).padStart(2,"0")}.html`),"utf8");for(const m of fallback.matchAll(/<li><strong>([^<]+)<\/strong>\s*([^<]+)<\/li>/gi))reads[clean(m[1]).replace(/:$/,'')]=clean(m[2]);}catch{}}
  const links={};
  for(const m of html.matchAll(/href="([^"]+)"[^>]*>([^<]+)<\/a>/gi)){const label=clean(m[2]); if(/TLV/i.test(label))links.tlv=m[1]; else if(/KJV/i.test(label))links.kjv=m[1]; else if(/WLC/i.test(label))links.wlc=m[1]; else if(/SBLGNT/i.test(label))links.sblgnt=m[1]; else if(/Apocrypha/i.test(label))links.apocrypha=m[1];}
  let json=""; try{json=await fs.readFile(path.join(app,"data",`week${week}.json`),"utf8")}catch{}
  const audios={}; const block=json.match(/"audio_playlist"\s*:\s*\[([\s\S]*?)\]\s*,\s*"chapter_outlines"/)?.[1]||"";
  for(const obj of block.matchAll(/\{([\s\S]*?)\}/g)){const body=obj[1], get=k=>body.match(new RegExp(`"${k}"\\s*:\\s*"([^"]*)"`))?.[1]||""; const label=get("label"); if(label&&!audios[label])audios[label]={eng:get("src"),heb:get("heb"),grk:get("grk")};}
  return {reads,links,audios,rel};
}

const weekly=[]; const daily=[]; const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
for(let i=1;i<=54;i++){
  const [portion,hebrew,meaning]=portions[i-1]; const local=i<=52?await localWeek(i):{reads:{},links:{},audios:{},rel:""};
  const getRead=(re)=>Object.entries(local.reads).find(([k])=>re.test(k))?.[1]||"";
  const torah=(getRead(/Torah|Pent/i)||Array.from({length:7},(_,j)=>aliyot.get(`${canonicalName(portion)}|${j+1}`)?.reading).filter(Boolean).join("; ")).replace(/^([A-Za-z ]+?)(\d+:)/,"$1 $2");
  const companion={
    52:{haftarah:"None — intentional in PWA generated page",nt:"None — intentional in PWA generated page"},
    53:{haftarah:"2 Samuel 22:1-51; Hosea 14:1-9",nt:"John 21:1-25; Romans 10:14-11:12; 12:14-21"},
    54:{haftarah:"Joshua 1:1-18",nt:"Matthew 17:1-9; Luke 9:28-36; 24:44-53; 1 Thessalonians 5:1-11; Jude 1:3-10"}
  };
  const haftarah=getRead(/Haftarah|Prophets/i)||companion[i]?.haftarah||"";
  const nt=getRead(/Brit|New Test/i)||companion[i]?.nt||"";
  const metadataNotes={5:"Transliteration standardized from PWA Chayei Sarah to Hebcal Chayei Sara",6:"Transliteration standardized from Toledot to Toldot; Hebrew niqqud removed",25:"Corrected erroneous PWA Hebrew בחוקותי to צו",26:"Transliteration standardized from Shemini to Hebcal Shmini",29:"Transliteration standardized from Acharei Mot to Hebcal Achrei Mot",50:"Corrected erroneous PWA Hebrew בחוקותי to כי תבוא",52:"Transliteration standardized from Vayelech to Hebcal Vayeilech"};
  const row={week:i,portion_transliteration:portion,title_english:meaning,title_hebrew:hebrew,torah_reading:torah,haftarah_prophets_writings:haftarah,new_testament:nt,
    english_week_page:local.rel?`scripture/english/${local.rel}`:"",hebrew_week_page:i<=52?`scripture/hebrew/week${String(i).padStart(2,"0")}.html`:"",greek_week_page:i<=52?`scripture/greek/week${String(i).padStart(2,"0")}.html` : "",
    tlv_link:local.links.tlv||"",kjv_link:local.links.kjv||"",wlc_hebrew_link:local.links.wlc||"",sblgnt_greek_link:local.links.sblgnt||"",apocrypha_link:local.links.apocrypha||"",
    companion_reading_source_url:i===53?"https://www.119ministries.com/resources/torah-portion/t53-haazinu/":i===54?"https://www.119ministries.com/resources/torah-portion/t54-vzot-habrachah/":i===52?"scripture/greek/week52.html":"",
    source_note:[i<=52?"Recovered from HomeGroupsApp PWA; daily aliyot from Hebcal":"Added canonical missing portion; daily aliyot from Hebcal and companion readings from 119 Ministries",metadataNotes[i]].filter(Boolean).join("; ")};
  for(const label of ["Torah","Prophets","Writings","Gospels","Letters","Revelation"]){const a=local.audios[label]||{}; const k=label.toLowerCase();row[`${k}_audio_english`]=a.eng||"";row[`${k}_audio_hebrew`]=a.heb||"";row[`${k}_audio_greek`]=a.grk||"";}
  for(let d=1;d<=7;d++){const reading=aliyot.get(`${portion}|${d}`)?.reading||""; row[`day${d}_${days[d-1].toLowerCase()}_reading`]=reading;row[`day${d}_sefaria_link`]=sefaria(reading);daily.push({week:i,day_number:d,day_name:days[d-1],portion_transliteration:portion,title_english:meaning,title_hebrew:hebrew,torah_daily_reading:reading,sefaria_bilingual_link:sefaria(reading),weekly_torah_reading:torah,haftarah_prophets_writings:haftarah,new_testament:nt,source_note:row.source_note});}
  weekly.push(row);
}

const weeklyHeaders=Object.keys(weekly[0]), dailyHeaders=Object.keys(daily[0]); await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,"homegroups_weekly_reading_schedule.csv"),csvString(weeklyHeaders,weekly),"utf8");
await fs.writeFile(path.join(out,"homegroups_daily_reading_schedule.csv"),csvString(dailyHeaders,daily),"utf8");

const wb=Workbook.create();
for(const [name,headers,rows] of [["Weekly Schedule",weeklyHeaders,weekly],["Daily Readings",dailyHeaders,daily]]){
  const sh=wb.worksheets.add(name); sh.showGridLines=false; sh.getRangeByIndexes(0,0,rows.length+1,headers.length).values=[headers,...rows.map(r=>headers.map(h=>r[h]??""))];
  const head=sh.getRangeByIndexes(0,0,1,headers.length); head.format={fill:"#17324D",font:{bold:true,color:"#FFFFFF"},wrapText:true}; head.format.rowHeight=34;
  const body=sh.getRangeByIndexes(1,0,rows.length,headers.length); body.format={font:{color:"#1F2937"},verticalAlignment:"top"}; body.format.rowHeight=30;
  sh.freezePanes.freezeRows(1); sh.freezePanes.freezeColumns(name==="Weekly Schedule"?4:6);
  sh.getRangeByIndexes(0,0,rows.length+1,headers.length).format.autofitColumns();
  for(let c=0;c<headers.length;c++){const col=sh.getRangeByIndexes(0,c,rows.length+1,1); if(/link|audio|reading|source/.test(headers[c])){col.format.columnWidth=34;col.format.wrapText=true;} else if(/title|portion/.test(headers[c]))col.format.columnWidth=18; else col.format.columnWidth=Math.min(16,Math.max(8,headers[c].length+2));}
  sh.tables.add(`A1:${colName(headers.length-1)}${rows.length+1}`,true,`${name.replace(/\s/g,"")}Table`);
}
const xlsx=await SpreadsheetFile.exportXlsx(wb); await xlsx.save(path.join(out,"homegroups_weekly_reading_schedule.xlsx"));
const preview=await wb.render({sheetName:"Daily Readings",range:"A1:L12",scale:1.2,format:"png"});
await fs.writeFile("C:/Users/eddie/Documents/Codex/2026-07-03/w/work/reading_schedule_preview.png",new Uint8Array(await preview.arrayBuffer()));
console.log(JSON.stringify({weeklyRows:weekly.length,dailyRows:daily.length,aliyot:aliyot.size,outputs:3}));
