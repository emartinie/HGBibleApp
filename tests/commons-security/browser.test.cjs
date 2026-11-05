const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),prefix='My Partner/collaboration/messaging/commons/';
const init=String.raw`export const auth={currentUser:{uid:'alice',email:'alice@example.test'}};export const db={};
window.fixture={auth,listeners:[],subs:[],writes:[],conversations:[{id:'alice_bob',participants:['alice','bob'],status:'accepted',requestedBy:'bob'},{id:'alice_carol',participants:['alice','carol'],status:'accepted',requestedBy:'carol'}],setUser(uid){auth.currentUser=uid?{uid,email:uid+'@example.test'}:null;for(const fn of this.listeners)fn(auth.currentUser);}};`;
const authSDK=`export function onAuthStateChanged(auth,fn){window.fixture.listeners.push(fn);queueMicrotask(()=>fn(auth.currentUser));return()=>{}}`;
const storeSDK=`export function collection(db,...p){return typeof db==='string'?db+'/'+p.join('/'):p.join('/')}export const doc=collection;
export const query=(ref,...constraints)=>({ref,constraints});export const where=(...x)=>x;export const orderBy=(...x)=>x;export const limit=n=>n;export const serverTimestamp=()=>({serverTimestamp:true});
export async function getDocs(){return {docs:[],empty:true}}export async function getDoc(){return {exists:()=>false}}export async function setDoc(){}export async function updateDoc(){}
export async function addDoc(ref,data){window.fixture.writes.push({ref,data});return {id:'local-only'}}
export function onSnapshot(q,next){let live=true;const f=window.fixture;queueMicrotask(()=>{if(!live)return;if(typeof q==='string'){const data=f.conversations.find(x=>x.id===q.split('/')[1]);next({data:()=>data});}else if(q.ref==='commonsDirectConversations'){const docs=f.conversations.map(c=>({id:c.id,data:()=>c}));next({docs,empty:!docs.length,forEach:fn=>docs.forEach(fn)});}else next({docs:[],empty:true,forEach(){}})});return()=>{live=false}}
`;
for(const screen of ['direct-live','direct'])for(const width of [1440,390])test('actual '+screen+' DM module at '+width+'px: private drafts, auth reset and hidden composer',async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:u.pathname.includes('firebase-auth')?authSDK:storeSDK});
   if(u.origin!=='http://commons.test')return route.abort();
   if(u.pathname==='/js/firebase-init.js')return route.fulfill({contentType:'text/javascript',body:init});
   let file=decodeURIComponent(u.pathname).slice(1);if(file.endsWith('/'))file+='index.html';
   if(!file.startsWith(prefix))return route.abort();
   return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/html',body:fs.readFileSync(path.join(root,file))});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const input=screen==='direct'?'#body':'#messageInput',form=screen==='direct'?'#compose':'#composer',rows=screen==='direct'?'#inbox article button':'.conversation';
  await page.goto('http://commons.test/'+encodeURI(prefix)+screen+'/');
  await page.locator(rows).first().waitFor();assert.equal(await page.locator(form).isVisible(),false);
  await page.locator(rows).nth(0).click();await page.locator(input).waitFor();await page.locator(input).fill('For Bob only');
  if(width===390&&screen==='direct-live')await page.locator('#back').click();await page.locator(rows).nth(1).click();await page.locator(input).waitFor();assert.equal(await page.locator(input).inputValue(),'');
  await page.locator(input).fill('For Carol only');if(width===390&&screen==='direct-live')await page.locator('#back').click();await page.locator(rows).nth(0).click();await page.locator(input).waitFor();assert.equal(await page.locator(input).inputValue(),'For Bob only');
  await page.locator('#messages').evaluate(el=>el.textContent='Private transcript before logout');
  await page.evaluate(()=>window.fixture.setUser(null));assert.equal((await page.locator('#messages').textContent()).includes('Private transcript before logout'),false);assert.equal(await page.locator(input).inputValue(),'');assert.equal(await page.locator(form).isVisible(),false);assert.equal(await page.locator('#actions button').count(),0);
  await page.evaluate(()=>window.fixture.setUser('dave'));await page.locator(rows).first().waitFor();assert.equal(await page.locator(input).inputValue(),'');assert.deepEqual(await page.evaluate(()=>window.fixture.writes),[]);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
