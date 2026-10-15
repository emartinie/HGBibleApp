// Production Week 1/2 composer regression checks. Firebase is doubled; never sends live messages.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../../../../');
const production = 'My Partner/collaboration/messaging/commons/production-integration/commons-week-companion.js';
function read(name) {
  const file = path.join(root, name);
  if (fs.existsSync(file)) return fs.readFileSync(file);
  if (process.env.HG_TEST_BASE) return cp.execFileSync('git', ['show', process.env.HG_TEST_BASE + ':' + name], {cwd: process.env.HG_TEST_REPO || root, maxBuffer: 12e6});
  throw Error('Missing test fixture: ' + name);
}
const firebase = `
export const auth={currentUser:{uid:'member-one',displayName:'A reader'}};export const db={};
window.messagingTest={account:auth.currentUser,enrolled:true,fail:false,delay:0,writes:[],posts:[],reads:[],queries:[],
 setUser(account){this.account=account;auth.currentUser=account;this.authCallback?.(account);},
 snapshot(){return {docs:this.posts.map(post=>({id:post.id,data:()=>post.data})),empty:!this.posts.length,size:this.posts.length};},
 refresh(){this.postsCallback?.(this.snapshot());}
};`;
const sdkAuth = `export function onAuthStateChanged(auth,next){window.messagingTest.authCallback=next;queueMicrotask(()=>next(auth.currentUser));return ()=>{window.messagingTest.authCallback=null;};}`;
const sdkStore = `
export function collection(db,...parts){return parts.join('/');}export const doc=collection;
export function query(ref,...args){return {ref,args};}export function orderBy(...args){return args;}export function limit(n){return n;}
export async function getDoc(ref){const state=window.messagingTest;state.reads.push(ref);const uid=ref.split('/').at(-1);const area=ref.split('/')[1];const enrolled=state.enrolledByArea?.[area]??state.enrolledByUid?.[uid]??state.enrolled;await new Promise(r=>setTimeout(r,state.membershipDelays?.[uid]||0));return {exists:()=>ref.startsWith('commonsMembers/')||enrolled,data:()=>({displayName:'A reader'})};}
export function onSnapshot(q,next,error){const state=window.messagingTest;state.queries.push(q.ref);if(q.ref.endsWith('/replies'))queueMicrotask(()=>next({docs:[],empty:true,size:0,forEach(){}}));else{state.postsCallback=next;queueMicrotask(()=>next(state.snapshot()));}return ()=>{if(state.postsCallback===next)state.postsCallback=null;};}
export function serverTimestamp(){return {serverTimestamp:true};}
export async function addDoc(ref,data){const state=window.messagingTest;await new Promise(r=>setTimeout(r,state.delay));if(state.fail)throw {code:state.fail};const post={id:'created-'+(state.writes.length+1),data};state.writes.push({ref,data});if(!ref.endsWith('/replies'))state.posts.unshift(post);state.refresh();return {id:post.id};}
`;
(async () => {
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  for(const scenario of [{width:1440,height:1000,week:1},{width:390,height:844,week:2}]){
   const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},serviceWorkers:'block'});
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:url.pathname.includes('firebase-auth')?sdkAuth:sdkStore});
    if(url.origin!=='http://release.test')return route.abort();
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:`<!doctype html><html><body><select id="weekSelect"><option value="1" ${scenario.week===1?'selected':''}>Week 1</option><option value="2" ${scenario.week===2?'selected':''}>Week 2</option></select><p>Study remains in place.</p><script>window.HGRoute={read:()=>({card:'mainstage',week:document.querySelector('#weekSelect').value})};</script><script type="module" src="/${encodeURI(production)}?v=20261015-study-1"></script></body></html>`});
    if(url.pathname==='/js/firebase-init.js')return route.fulfill({contentType:'text/javascript',body:firebase});
    let name=decodeURIComponent(url.pathname).replace(/^\//,'');if(name.endsWith('/'))name+='index.html';
    if(name==='data/week1.json'&&scenario.week===2)await new Promise(r=>setTimeout(r,180));
    try{return route.fulfill({contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html',body:read(name)});}catch{return route.fulfill({status:404,body:'Missing fixture'});}
   });
   const page=await context.newPage(), errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://release.test/');await page.getByRole('button',{name:'☏ Messaging',exact:true}).click();
   const frame=page.frameLocator('#hg-commons-window iframe');
   await frame.locator('#context-label').filter({hasText:'Week '+scenario.week+' —'}).waitFor();
   await frame.getByRole('button',{name:'Start conversation',exact:true}).click();
   assert.equal(await frame.getByRole('textbox',{name:'Conversation title',exact:true}).evaluate(el=>el===document.activeElement),true);
   await frame.getByRole('textbox',{name:'Conversation title',exact:true}).fill('A new question');
   const body=frame.getByRole('textbox',{name:'Opening message',exact:true});
   await body.fill('<img src=x onerror=alert(1)> What do you notice?');
   await body.evaluate(()=>{window.messagingTest.fail='unavailable';});
   await frame.getByRole('button',{name:'Post conversation',exact:true}).click();
   await frame.getByRole('status').filter({hasText:'Conversation wasn’t posted. Your draft is kept;'}).waitFor();
   assert.match(await body.inputValue(),/What do you notice/);
   await frame.getByRole('button',{name:'Back to discussions',exact:true}).click();
   await frame.getByRole('button',{name:'Start conversation',exact:true}).click();
   assert.equal(await frame.getByRole('textbox',{name:'Conversation title',exact:true}).inputValue(),'A new question');
   await body.evaluate(()=>{window.messagingTest.fail='permission-denied';});
   await frame.getByRole('button',{name:'Post conversation',exact:true}).click();
   await frame.getByRole('status').filter({hasText:'Check your Bible Study & Investigation membership'}).waitFor();
   const otherWeek=scenario.week===1?2:1;
   await page.locator('#weekSelect').selectOption(String(otherWeek));
   await page.getByText('Messaging · Week '+otherWeek,{exact:true}).waitFor();
   await frame.getByText('Linked to Week '+scenario.week+'. The study link is included with your conversation.',{exact:true}).waitFor();
   assert.match(await body.inputValue(),/What do you notice/);
   await body.evaluate(()=>{window.messagingTest.fail=false;window.messagingTest.delay=100;window.messagingTest.refresh();});
   await frame.getByRole('button',{name:'Post conversation',exact:true}).click();
   await frame.locator('form.new-conversation').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
   await frame.getByRole('heading',{name:'A new question',exact:true}).waitFor();
   const result=await frame.locator('#deck').evaluate(()=>window.messagingTest.writes);
   assert.equal(result.length,1,'Double submit cannot duplicate a starter');
   assert.equal(result[0].ref,'commonsCommunityPosts/study/posts');
   assert.deepEqual(Object.keys(result[0].data).sort(),['authorName','body','createdAt','uid']);
   assert.equal(result[0].data.uid,'member-one');
   assert.equal(result[0].data.body.startsWith('[HG-TITLE:A new question]\n'),true);
   assert.match(result[0].data.body,new RegExp('Reading: http://release.test/\\?card=mainstage&week='+scenario.week));
   assert.deepEqual(result[0].data.createdAt,{serverTimestamp:true});
   assert.equal(await frame.locator('#deck img').count(),0,'Opening message is text, not executable HTML');
   assert.equal(await frame.getByRole('link',{name:'Open this discussion in full Messaging',exact:true}).getAttribute('href'),'../conversations/?area=study#post-created-1');
   await frame.getByRole('textbox',{name:'Reply as A reader',exact:true}).fill('A reply in Bible Study');
   await frame.getByRole('button',{name:'Post reply',exact:true}).click();
   await frame.getByText('Reply saved to Messaging.',{exact:true}).waitFor();
   const reply=await frame.locator('#deck').evaluate(()=>window.messagingTest.writes.at(-1));
   assert.equal(reply.ref,'commonsCommunityPosts/study/posts/created-1/replies');
   await frame.getByRole('button',{name:'← Discussions',exact:true}).click();
   await frame.getByRole('button',{name:'This week',exact:true}).waitFor();
   assert.equal(await frame.getByRole('button',{name:'This week',exact:true}).getAttribute('aria-pressed'),'true');
   await frame.locator('#context-label').filter({hasText:'Week '+otherWeek+' —'}).waitFor();
   assert.equal(await frame.getByRole('button',{name:/A new question/}).count(),0,'Originating-week starter stays out of the other week');
   await frame.getByRole('button',{name:'All Bible Study',exact:true}).click();
   await frame.getByRole('button',{name:/A new question/}).waitFor();
   assert.match(await frame.getByRole('button',{name:/A new question/}).innerText(),new RegExp('Week '+scenario.week));
   assert.equal(await frame.getByRole('link',{name:'Open full Bible Study conversations',exact:true}).getAttribute('href'),'../conversations/?area=study');
   await frame.locator('#deck').evaluate(()=>{
    window.messagingTest.posts.push({id:'unlinked',data:{body:'[HG-TITLE:Unlinked study]\nGenesis Noah creation',authorName:'A reader'}});
    window.messagingTest.refresh();
   });
   await frame.getByRole('button',{name:/Unlinked study/}).waitFor();
   await frame.getByRole('button',{name:'This week',exact:true}).click();
   assert.equal(await frame.getByRole('button',{name:/Unlinked study/}).count(),0,'Keyword matches do not assert week ownership');
   await page.locator('#weekSelect').selectOption(String(scenario.week));
   await frame.locator('#context-label').filter({hasText:'Week '+scenario.week+' —'}).waitFor();
   await frame.getByRole('button',{name:/A new question/}).waitFor();
   await frame.getByRole('button',{name:'Start conversation',exact:true}).click();
   assert.equal(await body.inputValue(),'','Confirmed sends clear that week’s draft');
   await frame.getByRole('textbox',{name:'Conversation title',exact:true}).fill('Private draft');await body.fill('Keep this for member one');
   await page.locator('#hg-commons-min').click();await page.locator('#hg-commons-min').click();
   await page.locator('#hg-commons-close').click();await page.getByRole('button',{name:'☏ Messaging',exact:true}).click();
   assert.equal(await body.inputValue(),'Keep this for member one');
   await body.evaluate(()=>window.messagingTest.setUser(null));
   await frame.getByText('You are not signed in to Messaging.',{exact:true}).waitFor();
   assert.equal(await frame.getByRole('button',{name:'Start conversation',exact:true}).count(),0);
   await frame.locator('#deck').evaluate(()=>window.messagingTest.setUser({uid:'member-two',displayName:'Another reader'}));
   await frame.getByRole('button',{name:'Start conversation',exact:true}).click();
   assert.equal(await body.inputValue(),'','Another account cannot inherit the draft');
   await body.evaluate(()=>window.messagingTest.setUser({uid:'member-one',displayName:'A reader'}));
   await frame.getByRole('button',{name:'Start conversation',exact:true}).click();
   assert.equal(await body.inputValue(),'Keep this for member one');
   await page.reload();await page.getByRole('button',{name:'☏ Messaging',exact:true}).click();
   await frame.locator('#context-label').filter({hasText:'Week '+scenario.week+' —'}).waitFor();
   await frame.getByRole('button',{name:'Start conversation',exact:true}).click();
   assert.equal(await body.inputValue(),'Keep this for member one','Reload restores the owner’s draft');
   await body.fill('x'.repeat(1200));assert.equal(await frame.getByRole('button',{name:'Post conversation',exact:true}).isDisabled(),true);
   await body.fill('A shorter message');
   await frame.getByRole('textbox',{name:'Conversation title',exact:true}).fill('Invalid]title');
   await frame.getByRole('button',{name:'Post conversation',exact:true}).click();
   await frame.getByRole('status').filter({hasText:'Enter a title of up to 90'}).waitFor();
   await frame.getByRole('textbox',{name:'Conversation title',exact:true}).fill('Private draft');
   await page.screenshot({path:'/tmp/messaging-composer-'+scenario.width+'.png'});
   const dimensions=await frame.locator('form.new-conversation').evaluate(el=>({scroll:el.scrollWidth,width:el.clientWidth}));
   assert.ok(dimensions.scroll<=dimensions.width,'Composer fits iframe width');
   await body.evaluate(()=>{window.messagingTest.enrolledByArea={study:false,projects:true};window.messagingTest.setUser({uid:'member-two'});});
   await frame.getByText('You are signed in, but have not joined Bible Study & Investigation yet.',{exact:true}).waitFor();
   assert.equal(await frame.getByRole('button',{name:'Start conversation',exact:true}).count(),0);
   await frame.locator('#deck').evaluate(()=>{
    window.messagingTest.enrolledByArea=null;window.messagingTest.enrolled=true;window.messagingTest.membershipDelays={'member-one':150};window.messagingTest.enrolledByUid={'member-two':false};
    window.messagingTest.setUser({uid:'member-one'});window.messagingTest.setUser({uid:'member-two'});
   });
   await page.waitForTimeout(250);
   assert.equal(await frame.getByRole('button',{name:'Start conversation',exact:true}).count(),0,'Stale membership cannot authorize a different account');
   const paths=await frame.locator('#deck').evaluate(()=>({reads:window.messagingTest.reads,queries:window.messagingTest.queries,writes:window.messagingTest.writes}));
   assert.ok(paths.reads.some(ref=>ref.startsWith('commonsCommunityMembers/study/members/')));
   assert.ok(paths.queries.every(ref=>ref.startsWith('commonsCommunityPosts/study/posts')));
   assert.ok(paths.writes.every(write=>write.ref.startsWith('commonsCommunityPosts/study/posts')));
   assert.equal(paths.reads.some(ref=>ref.startsWith('commonsCommunityMembers/projects/')),false,'Kingdom Projects membership cannot authorize Bible Study');
   assert.deepEqual(errors,[]);
   await context.close();
   console.log('PASS: Week '+scenario.week+' at '+scenario.width+'px — study-only membership/reads/writes, week-specific filtering, all-study browsing, existing Firebase payload, draft retry/recovery, permission failures, pinned study, duplicate-submit prevention, safe rendering, close/minimize, sign-out/account isolation, reload, limits and stale membership.');
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
