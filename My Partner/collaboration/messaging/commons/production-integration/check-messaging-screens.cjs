// Actual legacy Messaging pages and shared shell; SDK doubles never contact live Firebase.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../');
const prefix='My Partner/collaboration/messaging/commons/';
function read(name){const file=path.join(root,name);return fs.existsSync(file)?fs.readFileSync(file):cp.execFileSync('git',['show',process.env.HG_TEST_BASE+':'+name],{cwd:process.env.HG_TEST_REPO||root,maxBuffer:12e6});}
const init=`
const user={uid:'member-one',displayName:'A reader',email:'reader@example.test',providerData:[{providerId:'google.com'}]};
export const auth={currentUser:JSON.parse(sessionStorage.getItem('test-user')||JSON.stringify(user)),app:{options:{authDomain:'test.invalid'}}};export const db={};
const initial={profile:{displayName:'A reader',about:'Learning together',interest:'Bible Study & Investigation'},enrolled:['study'],writes:[],posts:[{id:'study-one',area:'study',uid:'other-reader',authorName:'Another reader',body:'[HG-TITLE:Reading together]\\nWhat do you notice in this passage?\\n\\nReading: http://release.test/?card=mainstage&week=1',createdAt:1000}],replies:{'study-one':[{id:'reply-one',uid:'other-reader',authorName:'Another reader',body:'A thoughtful reply.',createdAt:2000}]}};
export function state(){return JSON.parse(localStorage.getItem('test-state')||JSON.stringify(initial));}
export function save(value){localStorage.setItem('test-state',JSON.stringify(value));}
window.uiTest={auth,state,save};
`;
const authSDK=`import {auth,state,save} from 'http://release.test/js/firebase-init.js';
const listeners=new Set();
function change(user){auth.currentUser=user;sessionStorage.setItem('test-user',JSON.stringify(user));for(const fn of listeners)fn(user);}
export function onAuthStateChanged(a,next){listeners.add(next);queueMicrotask(()=>next(a.currentUser));return ()=>listeners.delete(next);}
export class GoogleAuthProvider{}
export async function signOut(){change(null);}
export async function signInWithPopup(){change({uid:'member-one',displayName:'A reader',providerData:[{providerId:'google.com'}]});return {user:auth.currentUser};}
export const signInWithRedirect=signInWithPopup;export async function getRedirectResult(){return null;}
export async function sendSignInLinkToEmail(a,email,options){const s=state();s.writes.push({kind:'email',email,options});save(s);}
export function isSignInWithEmailLink(){return false;}export async function signInWithEmailLink(){return signInWithPopup();}
export async function linkWithPopup(){return {user:auth.currentUser};}export const linkWithCredential=linkWithPopup;
export const EmailAuthProvider={credentialWithLink:()=>({})};export async function fetchSignInMethodsForEmail(){return [];}
`;
const storeSDK=`import {state,save} from 'http://release.test/js/firebase-init.js';
export function collection(db,...parts){return parts.join('/');}export const doc=collection;
export function orderBy(...parts){return parts;}export function limit(n){return n;}export function startAfter(d){return d;}
export function query(ref,...args){return {ref,args};}export function serverTimestamp(){return {serverTimestamp:true};}
function snapshot(d){return {id:d.id,data:()=>({...d,createdAt:{toMillis:()=>typeof d.createdAt==='number'?d.createdAt:3000,toDate:()=>new Date(typeof d.createdAt==='number'?d.createdAt:3000)}})};}
export async function getDoc(ref){const s=state();return {exists:()=>ref.startsWith('commonsMembers/')?!!s.profile:s.enrolled.includes(ref.split('/')[1]),data:()=>s.profile};}
export async function getDocs(q){const s=state(),parts=q.ref.split('/');let values=q.ref.endsWith('/replies')?s.replies[parts[3]]||[]:s.posts.filter(p=>p.area===parts[1]);const docs=values.map(snapshot);return {docs,size:docs.length,empty:!docs.length,forEach:fn=>docs.forEach(fn)};}
export function onSnapshot(q,next){let live=true;getDocs(q).then(s=>{if(live)next(s);});return ()=>{live=false;};}
export async function setDoc(ref,data,options){const s=state();s.writes.push({kind:'set',ref,data,options});if(ref.startsWith('commonsMembers/'))s.profile={...s.profile,...data};else if(!s.enrolled.includes(ref.split('/')[1]))s.enrolled.push(ref.split('/')[1]);save(s);}
export async function deleteDoc(ref){const s=state();s.writes.push({kind:'delete',ref});s.enrolled=s.enrolled.filter(area=>area!==ref.split('/')[1]);save(s);}
export async function addDoc(ref,data){const s=state(),id='posted-'+(s.writes.length+1);s.writes.push({kind:'add',ref,data});if(ref.endsWith('/replies'))(s.replies[ref.split('/')[3]]||=[]).push({id,...data});else s.posts.unshift({id,area:ref.split('/')[1],...data});save(s);return {id};}
`;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:1000},serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:url.pathname.includes('firebase-auth')?authSDK:storeSDK});
   if(url.origin!=='http://release.test')return route.abort();
   if(url.pathname==='/js/firebase-init.js')return route.fulfill({contentType:'text/javascript',body:init});
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><style>body{background:#0d111b;color:#eef3ff;font:16px system-ui;padding:24px}h1{color:#f3c878}</style></head><body><h1>Week 1 study</h1><select id="weekSelect"><option value="1">Week 1</option></select><script>window.HGRoute={read:()=>({card:'mainstage',week:'1'})};</script><script type="module" src="/${encodeURI(prefix)}production-integration/commons-week-companion.js?v=20261015-unified-1"></script></body></html>`});
   let name=decodeURIComponent(url.pathname).slice(1);if(name.endsWith('/'))name+='index.html';
   try{return route.fulfill({contentType:name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html',body:read(name)});}catch{return route.fulfill({status:404,body:'Not found'});}
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message);});page.setDefaultTimeout(12000);
  const url=screen=>'http://release.test/'+encodeURI(prefix)+screen+'/?area=study&week=1';
  for(const [screen,title] of [['conversations','Community conversations'],['activity','My Messaging activity'],['directory','Find your people. Build together.'],['member','Your Messaging profile'],['auth','Your HomeGroups account']]){
   await page.goto(url(screen));await page.getByRole('heading',{name:title,exact:true}).waitFor();
   await page.locator('.messaging-shell').waitFor();
   const ready={conversations:['#status','You are enrolled.'],activity:['#status','unread discussions (of'],directory:['#enrollmentStatus','Your community enrollments are available.'],member:['#cloudStatus','Your profile is saved online.'],auth:['#status','You are signed in to HomeGroups.']};
   await page.locator(ready[screen][0]).filter({hasText:ready[screen][1]}).waitFor();
   assert.equal(await page.locator('.messaging-nav [aria-current=page]').count(),1);
   assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(13, 17, 27)');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,screen+' fits '+width+'px');
   for(const href of await page.locator('.messaging-nav a').evaluateAll(links=>links.map(a=>a.href))){const dest=new URL(href);assert.equal(dest.searchParams.get('week'),'1');assert.equal(dest.searchParams.get('area'),'study');}
   await page.screenshot({path:'/tmp/messaging-'+screen+'-'+width+'.png',fullPage:true});
  }
  // Existing full discussion read/search/reply/create behavior remains available.
  await page.goto(url('conversations'));await page.getByRole('link',{name:'Reading together',exact:true}).click();
  await page.locator('.post:not([hidden]) details').evaluate(el=>el.open=true);
  await page.getByText('A thoughtful reply.',{exact:true}).waitFor();
  await page.getByRole('textbox',{name:'Reply to Another reader',exact:true}).fill('Reply from the existing page');
  await page.getByRole('button',{name:'Post reply',exact:true}).click();await page.locator('#status').filter({hasText:'Reply posted.'}).waitFor();
  await page.locator('#discussionTitle').fill('A new full-page conversation');await page.locator('#message').fill('<img src=x onerror=alert(1)> Plain text');
  await page.getByRole('button',{name:'Post message',exact:true}).click();await page.locator('#status').filter({hasText:'Conversation posted.'}).waitFor();
  await page.getByRole('button',{name:'← Back to discussion index',exact:true}).click();
  await page.getByRole('link',{name:'A new full-page conversation',exact:true}).waitFor();assert.equal(await page.locator('#posts img').count(),0);
  await page.getByRole('searchbox',{name:'Search loaded messages',exact:true}).fill('no matching phrase');assert.equal(await page.locator('.index-entry:not([hidden])').count(),0);
  await page.getByRole('searchbox',{name:'Search loaded messages',exact:true}).fill('Reading together');assert.equal(await page.locator('.index-entry:not([hidden])').count(),1);
  // Explicit community switches survive shared navigation rather than reverting to study.
  await page.locator('#area').selectOption('projects');await page.locator('#status').filter({hasText:'Join this community'}).waitFor();
  assert.equal(new URL(await page.locator('.messaging-nav a[aria-current=page]').getAttribute('href')).searchParams.get('area'),'projects');
  await page.getByRole('link',{name:'Communities',exact:true}).click();
  const project=page.locator('.card').filter({has:page.getByRole('heading',{name:'Kingdom Projects',exact:true})});
  await project.getByRole('button',{name:'Join community',exact:true}).click();await page.locator('#enrollmentStatus').filter({hasText:'Joined projects successfully.'}).waitFor();
  await page.getByRole('button',{name:'＋ Create example group',exact:true}).click();await page.locator('#name').fill('A local group draft');await page.locator('#summary').fill('A local example, not a cloud group.');
  await page.getByRole('button',{name:'Save draft',exact:true}).click();await page.getByRole('heading',{name:'A local group draft',exact:true}).waitFor();
  await page.getByRole('link',{name:'Profile',exact:true}).click();await page.locator('#cloudStatus').filter({hasText:'Your profile is saved online.'}).waitFor();
  await page.getByRole('textbox',{name:'Display name',exact:true}).fill('Updated reader');await page.getByRole('button',{name:'Update Messaging profile',exact:true}).click();await page.locator('#cloudStatus').filter({hasText:'Profile saved.'}).waitFor();
  await page.getByRole('link',{name:'Account',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.getByRole('button',{name:'Continue with Google',exact:true}).waitFor();await page.locator('#email').fill('reader@example.test');await page.getByRole('button',{name:'Send sign-in link',exact:true}).click();await page.locator('#status').filter({hasText:'Check reader@example.test'}).waitFor();
  await page.getByRole('button',{name:'Continue with Google',exact:true}).click();await page.getByRole('heading',{name:'Signed in',exact:true}).waitFor();
  // Activity continues to link to the real discussion and mark activity read for this account.
  await page.goto(url('activity'));await page.locator('.entry').first().waitFor();await page.getByRole('link',{name:'Reading together',exact:true}).click();
  assert.equal(new URL(page.url()).searchParams.get('week'),'1');assert.equal(new URL(page.url()).hash,'#post-study-one');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hg-commons-seen:v1:member-one:study:study-one')),'2000');
  const writes=await page.evaluate(()=>window.uiTest.state().writes);
  assert.ok(writes.some(x=>x.ref==='commonsCommunityPosts/study/posts/study-one/replies'));
  assert.ok(writes.some(x=>x.ref==='commonsCommunityPosts/study/posts'));
  assert.ok(writes.some(x=>x.ref==='commonsCommunityMembers/projects/members/member-one'));
  assert.ok(writes.some(x=>x.ref==='commonsMembers/member-one'&&x.options?.merge));
  // All live screens also fit inside the production floating iframe; back closes it without reloading study.
  await page.goto('http://release.test/');await page.getByRole('button',{name:'☏ Messaging',exact:true}).click();
  const frame=page.frameLocator('#hg-commons-window iframe');await frame.getByRole('link',{name:'Open full Bible Study conversations',exact:true}).click();
  await frame.locator('.messaging-shell').waitFor();await frame.getByRole('link',{name:'Communities',exact:true}).click();await frame.locator('#directory .card').first().waitFor();
  await frame.getByRole('link',{name:'Profile',exact:true}).click();await frame.getByRole('heading',{name:'Your Messaging profile',exact:true}).waitFor();
  await frame.getByRole('link',{name:'Account',exact:true}).click();await frame.getByRole('heading',{name:'Your HomeGroups account',exact:true}).waitFor();
  assert.equal(await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Embedded account fits panel');
  const sentinel=await page.evaluate(()=>window.returnSentinel=Math.random());
  // Ignore same-origin messages from any sender other than this exact iframe.
  await page.evaluate(()=>window.postMessage({messagingAction:'returnToStudy'},location.origin));assert.equal(await page.locator('#hg-commons-window').isVisible(),true);
  await frame.getByRole('link',{name:'← Return to study',exact:true}).click();await page.locator('#hg-commons-window').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>window.returnSentinel),sentinel);
  await page.getByRole('button',{name:'☏ Messaging',exact:true}).click();await frame.getByRole('heading',{name:'Your HomeGroups account',exact:true}).waitFor();
  // Preserve the original local preview without presenting its samples as live discussions.
  await page.goto('http://release.test/'+encodeURI(prefix));await page.locator('.messaging-context').filter({hasText:'Local preview'}).waitFor();await page.locator('#compose').fill('Local preview message');await page.locator('#sendForm button').click();
  await page.reload();await page.locator('.bubble').filter({hasText:'Local preview message'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Local preview fits viewport');
  assert.deepEqual(errors,[]);await context.close();console.log('PASS '+width+'px: five shared screens; full discussions/replies/search; enrollment; local group drafts; profile update; sign-out/email/Google; unread deep links; week/community navigation; embedded return; preview isolation.');
 }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
