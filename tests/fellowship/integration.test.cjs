const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const repo=path.resolve(__dirname,'../..');
const commons='/My%20Partner/collaboration/messaging/commons/';
const sdk=String.raw`const S=top.__fixture;
export const auth={get currentUser(){return S.user;}};export const db={};export const app={};
export function onAuthStateChanged(a,cb,err){const rec={cb,win:window};S.auth.add(rec);queueMicrotask(()=>{if(S.auth.has(rec))cb(S.user)});return ()=>{S.auth.delete(rec);S.authStops++}}
export function onSnapshot(ref,cb,err){const rec={cb,err,path:ref.path,win:window};S.snaps.add(rec);S.maxSnaps=Math.max(S.maxSnaps,S.snaps.size);queueMicrotask(()=>{if(S.snaps.has(rec))cb({empty:true,docs:[],forEach(){},docChanges(){return []}})});return ()=>{S.snaps.delete(rec);S.snapStops++}}
const ref=(base,...bits)=>({path:[base?.path,...bits].filter(Boolean).join('/')});export const doc=ref,collection=ref;
export const query=(base,...args)=>base;export const where=(...args)=>args;export const orderBy=where,limit=where,startAfter=where;
export const serverTimestamp=()=>123;
export async function getDoc(ref){if(S.deny)throw Object.assign(new Error('denied'),{code:'permission-denied'});const uid=ref.path.split('/').pop();const value=ref.path.startsWith('commonsMembers/')?{displayName:'Member '+uid,interest:'Bible Study & Investigation'}:ref.path.startsWith('commonsCommunityMembers/')&&S.members.has(ref.path)?{uid}:undefined;return {exists:()=>!!value,data:()=>value}}
export async function getDocs(ref){if(S.deny)throw Object.assign(new Error('denied'),{code:'permission-denied'});let docs=ref.path.includes('commonsCommunityPosts/')&&!ref.path.includes('replies')?[{id:'post1',data:()=>({uid:'bob1234567890123',authorName:'Bob',body:'[HG-TITLE:Praying together]\\nA community discussion',createdAt:{toDate:()=>new Date(0)}})}]:[];return {docs,empty:!docs.length,size:docs.length,forEach:fn=>docs.forEach(fn)}}
export async function setDoc(ref,value){S.writes.push({kind:'set',path:ref.path,value});S.members.add(ref.path)}
export async function deleteDoc(ref){S.writes.push({kind:'delete',path:ref.path});S.members.delete(ref.path)}
export async function addDoc(ref,value){S.writes.push({kind:'add',path:ref.path,value});return {id:'test-only'}}
export const updateDoc=setDoc;
export class GoogleAuthProvider{};export const signInWithPopup=async()=>{throw new Error('Real authentication prohibited in test')};export const linkWithPopup=signInWithPopup,signInWithRedirect=signInWithPopup,sendSignInLinkToEmail=signInWithPopup,signInWithEmailLink=signInWithPopup,linkWithCredential=signInWithPopup;
export const signOut=async()=>{};export const getRedirectResult=async()=>null;export const isSignInWithEmailLink=()=>false;export const fetchSignInMethodsForEmail=async()=>[];export const EmailAuthProvider={credentialWithLink:()=>({})};
`;
async function harness(t,{route='?card=fellowship&view=explore&week=12',mobile=false,signedOut=false,companion=false}={}){
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});t.after(()=>browser.close());
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
 const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({signedOut})=>{if(window!==top)return;window.__fixture={user:signedOut?null:{uid:'alice',displayName:'Alice',isAnonymous:false,providerData:[{providerId:'google.com'}]},auth:new Set(),snaps:new Set(),members:new Set(['commonsCommunityMembers/study/members/alice']),writes:[],authStops:0,snapStops:0,maxSnaps:0,deny:false,markers:[],maps:0,mapStops:0};window.__switchUser=uid=>{const s=window.__fixture;s.user=uid?{uid,displayName:uid,providerData:[{providerId:'google.com'}]}:null;for(const rec of [...s.auth])if(s.auth.has(rec))rec.cb(s.user)};const marker=coords=>({coords,addTo(layer){layer.addLayer?.(this);return this},bindPopup(p){this.popup=p;return this},openPopup(){return this},setLatLng(){return this},setPopupContent(){return this}});window.L={map(){window.__fixture.maps++;return {setView(){return this},on(type,fn){if(type==='click')window.__fixture.mapClick=fn;return this},off(){return this},once(){return this},locate(){throw new Error('Unexpected geolocation')},stopLocate(){},remove(){window.__fixture.mapStops++},removeLayer(){},dragging:{enable(){},disable(){}},scrollWheelZoom:{enable(){},disable(){}}}},tileLayer(){return {addTo(){}}},layerGroup(){const entries=new Set();return {addTo(){return this},addLayer(m){entries.add(m)},removeLayer(m){entries.delete(m)},hasLayer(m){return entries.has(m)}}},control:{layers(){return {addTo(){}}}},circleMarker(coords){const m=marker(coords);window.__fixture.markers.push(m);return m},marker,circle:marker};},{signedOut});
 const index=await fs.readFile(path.join(repo,'index.html'),'utf8');const theme=index.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1]||'';
 await context.route('**/*',async request=>{const url=new URL(request.request().url());if(url.origin==='https://www.gstatic.com')return request.fulfill({contentType:'text/javascript',body:sdk});if(url.origin!=='http://fellowship.test'){external.push(url.href);return request.abort();}
 const p=decodeURIComponent(url.pathname);
 if(p==='/')return request.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+theme+'</style></head><body><select id="cardSelector"><option value="">Study</option><option value="fellowship">Fellowship</option></select><select id="weekSelect"><option value="12" selected>Week 12</option></select><main id="viewport" style="height:100vh"><div id="cardsRow"><section class="card" id="mainStageCard"><p id="reading">Reading context preserved</p></section><section class="card" id="dynamicCard"><div id="loadedCardHost"></div></section></div></main><script src="/js/share-routing.js"></script><script src="/js/themeDiagnostic.js"></script><script type="module" src="/js/app.js"></script>'+(companion?'<script type="module" src="'+commons+'production-integration/commons-week-companion.js"></script>':'')+'</body></html>'});
 if(p==='/js/firebase-init.js')return request.fulfill({contentType:'text/javascript',body:sdk});
 if(p==='/js/timeStore.js')return request.fulfill({contentType:'text/javascript',body:'export const TimeStore={start(){}}'});
 if(p==='/js/firebaseTimeLoader.js')return request.fulfill({contentType:'text/javascript',body:'export function initializeTimeSystem(){}'});
 if(p==='/data/HomeGroupsMap.geojson')return request.fulfill({contentType:'application/json',body:JSON.stringify({features:[{properties:{Name:'Historical group',Coordinates:'-87.456789,36.123456'}}]})});
 const target=path.resolve(repo,'.'+p);if(!target.startsWith(repo+path.sep))return request.abort();
 try{const file=p.endsWith('/')?path.join(target,'index.html'):target;const body=await fs.readFile(file);return request.fulfill({body,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});}catch{return request.fulfill({status:404,body:'Missing fixture file: '+p})}
 });
 await page.goto('http://fellowship.test/'+route);if(route.includes('card=mainstage'))await page.waitForFunction(()=>typeof window.loadCard==='function');else await page.locator('.fellowship').waitFor();
 const frame=async()=>{await page.locator('.fellowship iframe').waitFor();await page.waitForFunction(()=>document.querySelector('.fellowship iframe')?.contentDocument?.querySelector('link[href="/css/fellowship-embedded.css"]'));return page.frames().find(f=>f!==page.mainFrame());};
 t.after(()=>{assert.deepEqual(errors,[],'Uncaught browser errors');assert.deepEqual(external,[],'No unmocked external network traffic')});
 return {page,frame,context,errors};
}
test('native card loading, legacy map route, approximate pins and cleanup preserve reading context',async t=>{
 const {page}=await harness(t,{route:'?card=prayermap&week=12'});await page.locator('#prayerMap').waitFor();await page.waitForFunction(()=>__fixture.markers.length===1);
 assert.match(page.url(),/card=fellowship/);assert.match(page.url(),/view=prayer/);assert.match(page.url(),/week=12/);
 assert.deepEqual(await page.evaluate(()=>__fixture.markers[0].coords),[36.12,-87.46]);assert.equal(await page.evaluate(()=>__fixture.markers[0].popup.textContent.includes('456789')),false);
 assert.equal(await page.evaluate(()=>__fixture.snaps.size),2);
 await page.getByRole('button',{name:'Explore',exact:true}).click();await page.locator('iframe').waitFor();assert.equal(await page.evaluate(()=>__fixture.snaps.size),0);
 await page.getByRole('button',{name:'Return to study',exact:true}).click();await page.waitForFunction(()=>new URL(location.href).searchParams.get('card')==='mainstage');
 assert.equal(await page.locator('#reading').textContent(),'Reading context preserved');assert.equal(await page.evaluate(()=>__fixture.auth.size),0);assert.equal(await page.locator('.fellowship iframe').count(),0);
});
test('existing membership schema, joined filter, discussions, replies and DM entry points',async t=>{
 const {page,frame}=await harness(t);let child=await frame();await child.locator('[data-enroll="prayer"]:enabled').waitFor();assert.equal(await child.locator('#directory article:visible').count(),6);
 await child.locator('[data-enroll="prayer"]').click();await child.getByText('Joined prayer successfully.',{exact:false}).waitFor();
 const write=await page.evaluate(()=>__fixture.writes[0]);assert.equal(write.path,'commonsCommunityMembers/prayer/members/alice');assert.deepEqual(Object.keys(write.value).sort(),['communityId','joinedAt','uid']);
 await page.getByRole('button',{name:'My Communities',exact:true}).click();child=await frame();await child.locator('[data-enroll="study"]:enabled').waitFor();assert.equal(await child.locator('#directory article:visible').count(),2);
 await child.locator('article').filter({has:child.locator('[data-enroll="study"]')}).getByRole('link',{name:'Community conversation'}).click();child=await frame();await child.locator('#discussionIndex a').waitFor();assert.match(page.url(),/area=study/);
 await child.locator('#discussionIndex a').click();await child.locator('#posts article:visible').waitFor();assert.equal(await child.locator('#posts article:visible').count(),1);
 await child.locator('#posts article:visible').getByText('Replies',{exact:false}).first().click();await child.getByText('No replies yet.',{exact:true}).waitFor();
 await child.getByRole('button',{name:'Message privately',exact:false}).first().click();await page.waitForURL(/view=messages/);child=await frame();assert.match(child.url(),/direct-live/);assert.match(page.url(),/view=messages/);assert.match(page.url(),/id=bob1234567890123/);
});
test('account changes replace the embedded screen and release old SDK listeners',async t=>{
 const {page,frame}=await harness(t,{route:'?card=fellowship&view=messages'});await frame();await page.waitForFunction(()=>__fixture.snaps.size===1);
 await page.evaluate(()=>{window.oldCallbacks=[...__fixture.snaps];window.oldFrame=document.querySelector('.fellowship iframe');__switchUser('bob')});await page.waitForFunction(()=>document.querySelector('.fellowship iframe')!==oldFrame);await frame();
 await page.evaluate(()=>oldCallbacks.forEach(rec=>rec.cb({empty:false,docs:[],forEach(){throw new Error('Late callback reached UI')},docChanges(){return []}})));
 await page.waitForFunction(()=>__fixture.snaps.size===1);assert.equal(await page.evaluate(()=>__fixture.auth.size),2);
 await page.getByRole('button',{name:'Prayer Map',exact:true}).click();await page.locator('#prayerMap').waitFor();await page.waitForFunction(()=>__fixture.snaps.size===2);
 await page.evaluate(()=>window.loadCard('mainstage'));assert.equal(await page.evaluate(()=>__fixture.snaps.size),0);assert.equal(await page.evaluate(()=>__fixture.auth.size),0);
});
for(const mobile of [false,true])test((mobile?'mobile':'desktop')+' theme inheritance, navigation, loading and signed-out feedback',async t=>{
 const {page,frame}=await harness(t,{mobile,signedOut:true});let child=await frame();await child.getByText('Sign in to Messaging to join communities.',{exact:true}).waitFor();assert.equal(await child.locator('[data-enroll]:enabled').count(),0);
 for(const theme of ['parchment','sapphire','diagnostic']){await page.evaluate(theme=>{document.documentElement.setAttribute('data-hg-theme-preset',theme);document.documentElement.setAttribute('data-hg-theme-diagnostic',theme==='diagnostic'?'on':'off')},theme);await page.waitForFunction(()=>{const f=document.querySelector('.fellowship iframe');return getComputedStyle(f.contentDocument.body).color===getComputedStyle(document.querySelector('.fellowship')).color});
 await page.waitForFunction(()=>{const r=document.querySelector('.fellowship').getBoundingClientRect();return r.left>=0&&r.left<50&&r.right<=innerWidth}).catch(async error=>{console.log(await page.evaluate(()=>({card:document.querySelector('.fellowship').getBoundingClientRect().toJSON(),row:document.getElementById('cardsRow').getBoundingClientRect().toJSON(),scroll:document.getElementById('cardsRow').scrollLeft,dynamic:document.getElementById('dynamicCard').offsetLeft,innerWidth})));throw error;});
 if(process.env.ARTIFACT_DIR && theme==='parchment'){await fs.mkdir(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ARTIFACT_DIR,(mobile?'mobile':'desktop')+'-parchment.png')});}
 assert.equal(await page.evaluate(()=>document.querySelector('.fellowship').scrollWidth<=document.querySelector('.fellowship').clientWidth+1),true);assert.equal(await child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);}
 await page.getByRole('button',{name:'My Communities',exact:true}).click();child=await frame();await child.locator('#joinedEmpty:visible').waitFor();
});
test('permission errors remain visible and no unauthorized writes are attempted',async t=>{
 const {page,frame}=await harness(t);await frame();await page.evaluate(()=>{__fixture.deny=true});await page.getByRole('button',{name:'My Communities',exact:true}).click();const child=await frame();await child.locator('#enrollmentStatus').filter({hasText:'permissions'}).waitFor();assert.equal(await child.locator('[data-enroll]:enabled').count(),0);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('leaving while the map fragment is delayed cannot mount stale views or listeners',async t=>{
 const {page,context}=await harness(t);
 let release;const gate=new Promise(resolve=>release=resolve);
 await context.route('**/cards/prayermap.html',async route=>{await gate;await route.fulfill({contentType:'text/html',body:await fs.readFile(path.join(repo,'cards/prayermap.html'),'utf8')})});
 await page.getByRole('button',{name:'Prayer Map',exact:true}).click();
 await page.evaluate(()=>window.loadCard('mainstage'));release();await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>__fixture.snaps.size),0);assert.equal(await page.evaluate(()=>__fixture.auth.size),0);assert.equal(await page.locator('#prayerMap').count(),0);

});

test('embedded missing screen offers retry and recovers without duplicate listeners',async t=>{
 const {page,context,frame}=await harness(t);await frame();
 await context.route('**/direct-live/**',route=>route.fulfill({status:404,contentType:'text/html',body:'Not found'}));
 await page.getByRole('button',{name:'Messages',exact:true}).click();await page.getByText('This view could not load. Please try again.',{exact:true}).waitFor();
 assert.equal(await page.locator('[data-fellowship-content]').getAttribute('aria-busy'),'false');
 await context.unroute('**/direct-live/**');await page.getByRole('button',{name:'Try again',exact:true}).click();const child=await frame();await child.locator('#list').waitFor();await page.waitForFunction(()=>__fixture.snaps.size===1);
});
test('map posting requires explicit public-location consent and stale map callbacks are ignored',async t=>{
 const {page}=await harness(t,{route:'?card=fellowship&view=prayer'});await page.locator('#prayerMap').waitFor();await page.waitForFunction(()=>__fixture.snaps.size===2);
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#prayerMapAddBtn').click();await page.evaluate(()=>__fixture.mapClick({latlng:{lat:36.123456,lng:-87.456789}}));
 await page.locator('#prayerMessageInput').fill('Test only; never submitted.');await page.locator('#prayerSaveBtn').click();await page.getByText('Please consent to sharing an approximate public location, or close this form to continue without posting.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
 await page.evaluate(()=>{window.lateMap=[...__fixture.snaps];return window.loadCard('mainstage')});await page.evaluate(()=>lateMap.forEach(rec=>rec.cb({docChanges(){throw new Error('Stale map callback processed')}})));assert.equal(await page.evaluate(()=>__fixture.snaps.size),0);
});
test('account and profile entry points reuse the existing screens without writes',async t=>{
 const {page,frame}=await harness(t);await frame();await page.getByRole('button',{name:'Account',exact:true}).click();let child=await frame();await child.locator('#account').waitFor();assert.match(child.url(),/commons\/auth\//);
 await page.getByRole('button',{name:'My profile',exact:true}).click();child=await frame();await child.locator('#displayName').waitFor();assert.match(child.url(),/commons\/member\//);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('study launcher pauses its inbox while Fellowship is active and resumes after cleanup',async t=>{
 const {page,frame}=await harness(t,{route:'?card=fellowship&view=messages&week=1',companion:true});await frame();await page.waitForFunction(()=>__fixture.auth.size===3&&__fixture.snaps.size===1);
 assert.equal(await page.locator('#hg-commons-launch').isVisible(),false);
 await page.evaluate(()=>window.loadCard('mainstage'));await page.waitForFunction(()=>__fixture.snaps.size===1&&__fixture.auth.size===1);
 await page.evaluate(()=>window.loadCard('fellowship'));await page.locator('#prayerMap').waitFor();await page.waitForFunction(()=>__fixture.snaps.size===2);
});

test('rapid leave and reopen waits for the same pending card module before initializing',async t=>{
 const {page,context,frame}=await harness(t,{route:'?card=mainstage&week=12'});
 let release,started;const gate=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>started=resolve);
 await context.route('**/js/fellowship.js?*',async route=>{started();await gate;await route.fulfill({contentType:'text/javascript',body:await fs.readFile(path.join(repo,'js/fellowship.js'),'utf8')})});
 await page.evaluate(()=>{void window.loadCard('fellowship')});await requested;
 await page.evaluate(()=>window.loadCard('mainstage'));await page.evaluate(()=>{void window.loadCard('fellowship')});await page.locator('.fellowship').waitFor();release();
 await page.locator('#prayerMap').waitFor();await page.waitForFunction(()=>__fixture.snaps.size===2);
 assert.equal(await page.locator('script[data-card-script=fellowship]').count(),1);assert.equal(await page.evaluate(()=>__fixture.auth.size),1);
});
