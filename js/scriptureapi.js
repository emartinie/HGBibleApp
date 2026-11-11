window.mountHomeGroupsScriptureReader = function mountReader(host = document, embeddedRoute) {
  let dispose = () => {};
  const ready = (async function () {
  const API_BASE = "https://rest.api.bible";
  const API_KEY = "5sFfxuspfEX8TD9YAODX8";

  const BIBLE_IDS = {
    KJV: "a6aee10bb058511c-01",
    AMP: "a81b73293d3080c9-01",
    NASB: "b8ee27bcd1cae43a-01"
  };

  const root = host.querySelector("#scriptureContent");
  const cardRoot = root?.closest(".hg-panel");
  // MainStage and the hidden legacy toolbar also contain these IDs. Bind only this card’s form controls.
  const control=id=>Array.from(cardRoot?.querySelectorAll('[id="'+id+'"]')||[]).at(-1);
  const meta = control("scriptureMeta");
  const versionSelect = control("scriptureVersion");
  const bookSelect = control("scriptureBook");
  const chapterInput = control("scriptureChapter");
  const loadBtn = control("scriptureLoadBtn");
  const prevBtn = control("scripturePrevBtn");
  const nextBtn = control("scriptureNextBtn");
  const searchInput = control("scriptureSearch");
  const searchBtn = control("scriptureSearchBtn");
  const postLoadControls = cardRoot
    ? Array.from(cardRoot.querySelectorAll("[data-scripture-hide-after-load]"))
    : [];

  if (!root || !versionSelect || !bookSelect || !chapterInput) return;

  let disposed=false,requestRevision=0,requestController=null,unregister=null,loadedRef=null,loadedVersion=null;
  const cleanups=[];
  root.setAttribute("role","region");root.setAttribute("aria-label","Scripture reading");root.tabIndex=-1;
  const readerStatus=document.createElement("p");readerStatus.className="hg-reading-status";readerStatus.setAttribute("role","status");readerStatus.setAttribute("aria-live","polite");readerStatus.setAttribute("aria-atomic","true");root.before(readerStatus);
  dispose=()=>{disposed=true;requestRevision++;requestController?.abort();unregister?.();for(const stop of cleanups)stop();};
  const journey=await import('./fellowship-context.js');
  if(disposed||!root.isConnected)return;
  journey.ensureContext();
  const scrollHost=root.closest('dialog, .card')||document.scrollingElement;
  function verseOf(element){return element?.getAttribute('data-number')||element?.id?.match(/[.-](\d+)$/)?.[1]||null;}
  function snapshot(){
    if(disposed||!root.isConnected||!loadedRef)return null;
    const top=scrollHost.getBoundingClientRect().top;
    const verses=[...root.querySelectorAll('[data-number], [id]')].filter(el=>/^\d{1,3}$/.test(verseOf(el)||''));
    const visible=verses.filter(el=>el.getBoundingClientRect().bottom>top&&el.getBoundingClientRect().top<innerHeight);
    const anchor=visible.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-top)-Math.abs(b.getBoundingClientRect().top-top))[0];
    return {ref:loadedRef,version:loadedVersion,anchor:verseOf(anchor),offset:anchor?anchor.getBoundingClientRect().top-top:0,scrollTop:scrollHost.scrollTop};
  }
  function capture(){if(embeddedRoute)return;const value=snapshot();if(value)journey.rememberReading(value);}
  window.addEventListener('pagehide',capture);cleanups.push(()=>window.removeEventListener('pagehide',capture));
  const bar=document.createElement('nav');bar.className='hg-reading-context';bar.setAttribute('aria-label','Fellowship reading links');
  const returnButton=document.createElement('button');returnButton.type='button';returnButton.dataset.discussionLink='';
  const linkStatus=document.createElement('small');linkStatus.setAttribute('role','status');bar.append(returnButton,linkStatus);root.before(bar);
  function updateLinks(){
    if(embeddedRoute){bar.hidden=true;return;}
    if(disposed)return;const associated=journey.associatedDiscussion(loadedRef||selectedReference());const origin=journey.discussionReturn();
    returnButton.hidden=!associated&&!origin;returnButton.textContent=origin?'Return to discussion':'Open linked discussion';
    linkStatus.textContent=associated?'Explicit Scripture link for this visit.':origin?'Return to your previous discussion; no association is established for this passage.':'No linked discussion for this passage in this visit.';
  }
  returnButton.onclick=()=>{const target=journey.associatedDiscussion(loadedRef||selectedReference())||journey.discussionReturn();if(target){capture();window.HGRoute?.navigate('fellowship-live',target);}};
  window.addEventListener('hg:fellowship-context',updateLinks);cleanups.push(()=>window.removeEventListener('hg:fellowship-context',updateLinks));
  updateLinks();

  function setPostLoadControlsHidden(hidden) {
    postLoadControls.forEach(control => {
      control.hidden = hidden;
    });
  }

  const { BOOK_MAP } = await import("./scripture-books.js");
  if(disposed||!root.isConnected)return;

  const TOPIC_MAP = {
  "ROM 8": ["Isaiah 40", "Psalms 23"],
  "JHN 1": ["Genesis 1", "Proverbs 8"],
  "MAT 5": ["Exodus 20", "Deuteronomy 6"],
  "HEB 8": ["Jeremiah 31"]
};

  function normalizeBookName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, " ");
  }

  function syncScriptureRoute(reference, options = {}) {
    const ref = String(reference || "").trim();
    if (!ref || embeddedRoute) return;

    window.HGRoute?.setCardState?.("scriptureapi", { ref, version:versionSelect.value }, {
      replace: options.replace === true,
      announce: false,
      source: "scripture-reference"
    });
  }

  function selectedReference(verse = null) {
    const bookName = bookSelect.selectedOptions?.[0]?.textContent?.trim() || bookSelect.value;
    const chapter = String(Math.max(1, Number(chapterInput.value) || 1));
    return bookName + " " + chapter + (verse ? ":" + verse : "");
  }

  function parseReference(input) {
    if (!input) return null;

    const cleaned = input.trim().replace(/\s+/g, " ");
    const match = cleaned.match(/^(.+?)\s+(\d+)(?::(\d+))?$/i);
    if (!match) return null;

    const rawBook = normalizeBookName(match[1]);
    const chapter = String(Number(match[2]));
    const verse = match[3] ? String(Number(match[3])) : null;
    const code = BOOK_MAP[rawBook];

    if (!code || !chapter) return null;

    return { rawBook, code, chapter, verse };
  }

  function getSelectedBibleId() {
    return BIBLE_IDS[versionSelect.value] || BIBLE_IDS.KJV;
  }

  function getRef() {
    const book = bookSelect.value || "JHN";
    const chapter = String(Math.max(1, Number(chapterInput.value) || 1));
    return { book, chapter };
  }

  function setMeta(apiData, verse, version = versionSelect.value) {
    const title = apiData?.data?.reference || "";
    meta.textContent = verse ? `${title} (${version}, verse ${verse})` : `${title} (${version})`;
  }

  function scrollToVerse(verse) {
    if (!verse) return;

    const contentEl = root;
    if (!contentEl) return;

    const verseEl =
      contentEl.querySelector(`[data-number="${verse}"]`) ||
      contentEl.querySelector(`[id$=".${verse}"]`) ||
      contentEl.querySelector(`[id$="-${verse}"]`);

    if (verseEl && typeof verseEl.scrollIntoView === "function") {
      verseEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function beautifyScriptureContent(container) {
  if (!container) return;

  container.classList.add("scripture-reader");

  // If api.bible already gave us paragraphs, just style them.
  const paragraphs = container.querySelectorAll("p");
  if (paragraphs.length) return;

  // If content came in as loose nodes, wrap meaningful chunks into paragraphs.
  const nodes = Array.from(container.childNodes);
  const wrapper = document.createElement("div");
  wrapper.className = "scripture-reader";

  let current = document.createElement("p");

  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) current.appendChild(document.createTextNode(text + " "));
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node;

      // Headings get preserved as headings
      if (/^H[1-6]$/.test(el.tagName)) {
        if (current.textContent.trim()) {
          wrapper.appendChild(current);
          current = document.createElement("p");
        }
        wrapper.appendChild(el.cloneNode(true));
        continue;
      }

      // Break on BR BR patterns by starting a new paragraph
      if (el.tagName === "BR") {
        if (current.textContent.trim()) {
          wrapper.appendChild(current);
          current = document.createElement("p");
        }
        continue;
      }

      current.appendChild(el.cloneNode(true));
      current.appendChild(document.createTextNode(" "));
    }
  }

  if (current.textContent.trim()) {
    wrapper.appendChild(current);
  }

  container.innerHTML = "";
  container.appendChild(wrapper);
}

function readerError(message){
 capture();loadedRef=null;loadedVersion=null;++requestRevision;requestController?.abort();
 setPostLoadControlsHidden(false);meta.textContent='';root.setAttribute('aria-busy','false');
 const note=document.createElement('p');note.setAttribute('role','alert');note.className='hg-reading-error';note.textContent=message;root.replaceChildren(note);readerStatus.textContent='';
}
async function loadChapter(book='JHN',chapter='1',verse=null,view=null){
 if(disposed||!root.isConnected)return;
 const requestedRef=selectedReference(verse),requestedVersion=versionSelect.value,focusBefore=document.activeElement;
 capture();loadedRef=null;loadedVersion=null;
 const token=++requestRevision;requestController?.abort();requestController=new AbortController();root.setAttribute('aria-busy','true');root.textContent='Loading…';readerStatus.textContent='Loading Scripture…';
 const current=()=>!disposed&&root.isConnected&&token===requestRevision;
 try{
  const bibleId=getSelectedBibleId();
  const res=await fetch(API_BASE+'/v1/bibles/'+bibleId+'/chapters/'+book+'.'+chapter,{method:'GET',headers:{'api-key':API_KEY,accept:'application/json'},signal:requestController.signal});
  const data=await res.json();if(!current())return;
  if(!res.ok||typeof data?.data?.content!=='string'||!data.data.content.trim())throw Error(typeof data?.message==='string'?data.message:'Scripture unavailable');
  loadedRef=requestedRef;loadedVersion=requestedVersion;setMeta(data,verse,requestedVersion);root.innerHTML='<div id="scriptureRendered" class="max-w-none">'+data.data.content+'</div>';
  beautifyScriptureContent(root.querySelector('#scriptureRendered'));setPostLoadControlsHidden(true);updateLinks();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(!current())return;
  const target=view?.anchor||verse;
  const element=target?[...root.querySelectorAll('[data-number], [id]')].find(el=>verseOf(el)===String(target)):null;
  if(view){if(element)scrollHost.scrollTop+=element.getBoundingClientRect().top-scrollHost.getBoundingClientRect().top-view.offset;else scrollHost.scrollTop=view.scrollTop;}
  else if(element)element.scrollIntoView({behavior:'auto',block:'center'});
  root.setAttribute('aria-busy','false');readerStatus.textContent='Loaded '+loadedRef+', '+loadedVersion+'.';
  if(document.activeElement===focusBefore||document.activeElement===document.body){const focusTarget=element?.closest('p')||element||root;focusTarget.tabIndex=-1;focusTarget.focus({preventScroll:true});}
 }catch(error){if(!current()||error.name==='AbortError')return;readerError('Failed to load Scripture: '+error.message);}
}

  function handleLoad() {
    const { book, chapter } = getRef();
    if(searchInput)searchInput.value=selectedReference();
    syncScriptureRoute(selectedReference());
    loadChapter(book, chapter);
  }

  function handlePrev() {
    const current = Math.max(1, Number(chapterInput.value) || 1);
    chapterInput.value = Math.max(1, current - 1);
    handleLoad();
  }

  function handleNext() {
    const current = Math.max(1, Number(chapterInput.value) || 1);
    chapterInput.value = current + 1;
    handleLoad();
  }

  function handleReferenceSearch() {
    const parsed = parseReference(searchInput?.value || "");
    if (!parsed) {
      searchInput?.setAttribute("aria-invalid","true");
      readerError('Invalid reference. Try "John 1" or "Genesis 1:1".');
      return;
    }

    searchInput?.removeAttribute("aria-invalid");
    bookSelect.value = parsed.code;
    chapterInput.value = parsed.chapter;
    const reference = selectedReference(parsed.verse);
    if (searchInput) searchInput.value = reference;
    syncScriptureRoute(reference);
    loadChapter(parsed.code, parsed.chapter, parsed.verse);
  }

  loadBtn?.addEventListener("click", handleLoad);
  prevBtn?.addEventListener("click", handlePrev);
  nextBtn?.addEventListener("click", handleNext);
  searchBtn?.addEventListener("click", handleReferenceSearch);
  control("scriptureReloadBtn")?.addEventListener("click", handleReferenceSearch);

  versionSelect.addEventListener("change", handleReferenceSearch);

  chapterInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLoad();
  });

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleReferenceSearch();
  });

  bookSelect.addEventListener("change", () => {
    chapterInput.value = 1;
    handleLoad();
  });

  if (embeddedRoute) {
    for (const id of ['openBridgeBtn', 'openSefariaContextBtn']) {
      const button = control(id);
      if (button) button.hidden = true;
    }
  }
  control("openBridgeBtn")?.addEventListener("click", () => {
  const code = control("scriptureBook")?.value;
  const chapter = control("scriptureChapter")?.value;

  const key = `${code} ${chapter}`;
  const targets = TOPIC_MAP[key];

  if (!targets || !targets.length) {
    alert("No related context mapped yet.");
    return;
  }

  if (embeddedRoute) return;
  localStorage.setItem("sefariaBridge", JSON.stringify({ targets }));
  if(!embeddedRoute)window.loadCard?.("sefaria");
});

  control("openSefariaContextBtn")?.addEventListener("click", () => {
  const book = control("scriptureBook")?.selectedOptions[0]?.text;
  const chapter = control("scriptureChapter")?.value;

  if (!book || !chapter) return;

  // Save context
  if (embeddedRoute) return;
  localStorage.setItem("sefariaJump", JSON.stringify({ book, chapter }));

  // Jump to Sefaria card
  window.loadCard?.("sefaria");
});

async function restoreReader(route={}){
 const stored=embeddedRoute?null:journey.readingView(route);let savedSearch=null;if(!embeddedRoute)try{savedSearch=localStorage.getItem('scriptureSearch');}catch{}
 const ref=route.ref||stored?.ref||savedSearch||selectedReference();
 versionSelect.value=BIBLE_IDS[route.version]?route.version:(stored?.version||'KJV');
 const parsed=parseReference(ref);if(!parsed){readerError('Invalid Scripture reference.');return;}
 bookSelect.value=parsed.code;chapterInput.value=parsed.chapter;searchInput.value=selectedReference(parsed.verse);
 if(savedSearch)try{localStorage.removeItem('scriptureSearch');}catch{}
 return loadChapter(parsed.code,parsed.chapter,parsed.verse,stored);
}
if(embeddedRoute)await restoreReader(embeddedRoute);
else if(window.HGRoute){unregister=window.HGRoute.registerCard('scriptureapi',{getState:()=>({ref:loadedRef||window.HGRoute.read()?.ref||selectedReference(),version:loadedVersion||versionSelect.value}),capture,restore:restoreReader});}
else await restoreReader();
})();
  return {ready, dispose:()=>dispose()};
};
if (!document.currentScript?.hasAttribute("data-reader-only")) {
  const reader = window.mountHomeGroupsScriptureReader();
  window.scriptureApiReady = reader.ready;
  window.initScriptureApiCard = () => reader.ready;
  window.destroyScriptureApiCard = reader.dispose;
}
