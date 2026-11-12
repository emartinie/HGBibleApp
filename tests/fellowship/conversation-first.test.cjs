const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {harness} = require('./harness.cjs');
const target = {id:'thread-post',area:'study',title:'Read and reply',time:1,body:'A community opening.\n\n' + 'Conversation context. '.repeat(30)};
const direct = '?card=fellowship-live&view=home&section=discussion&area=study&post=thread-post&week=12';
const unavailable = 'Sign in to use Fellowship.';
async function setup(t, {mobile=false, records=[target], prepare, open=true}={}) {
 const app = await harness(t,{production:true,mobile,unification:true,route:'?card=mainstage&week=12',feed:{records}});
 const {page} = app;
 const launch = page.locator('#mainStageFellowshipPilot');
 await launch.click();
 const dialog = page.getByRole('dialog',{name:'Fellowship',exact:true});
 await dialog.locator('.fellowship-feed article').first().waitFor();
 if (prepare) await prepare(page);
 const openThread = async (index=0) => {
  await dialog.locator('.fellowship-feed article').nth(index).getByRole('button',{name:'Open discussion and replies'}).click();
  const child = await app.conversation();
  await child.locator('#composer:not([hidden])').waitFor();
  // Wait for the first query to settle before exercising pagination or lifecycle races.
  await page.waitForFunction(()=>__fixture.feedReads?.some(r=>r.path.endsWith('/replies')));
  return child;
 };
 return {...app,dialog,launch,openThread,child:open ? await openThread() : null};
}
async function seedReplies(page, count) {
 await page.evaluate(count=>{
  __fixture.savedShares = new Map(Array.from({length:count},(_,i)=>[
   'commonsCommunityPosts/study/posts/thread-post/replies/reply-'+String(i).padStart(3,'0'),
   {uid:'bob1234567890123',authorName:'Bob',body:'Earlier reply '+i+' '+ 'Long reply. '.repeat(8),createdAt:i+1}
  ]));
 },count);
}
async function holdReply(page, child) {
 await child.locator('#message').fill('Pending synthetic reply');
 await page.evaluate(()=>__fixture.holdProfile=true);
 await child.getByRole('button',{name:'Send reply',exact:true}).click();
 await page.waitForFunction(()=>typeof __fixture.releaseProfile==='function');
}
async function releaseReply(page) {
 await page.evaluate(()=>{__fixture.holdProfile=false;__fixture.releaseProfile();});
 await page.waitForTimeout(100);
}
async function revoke(page) {
 await page.evaluate(()=>{
  const key='commonsCommunityMembers/study/members/alice';
  __fixture.members.delete(key);
  for (const rec of [...__fixture.snaps]) if(rec.path===key) rec.cb({exists:()=>false,metadata:{fromCache:false}});
 });
}
for (const mobile of [false,true]) test('visible feed opens a single conversation and restores feed context '+(mobile?'mobile':'desktop'),async t=>{
 const records=Array.from({length:45},(_,i)=>({...target,id:'thread-'+i,title:'Topic '+i,time:100-i}));
 const {page,dialog,child,launch}=await setup(t,{mobile,records,open:false});
 assert.equal(child,null);
 assert.equal(await dialog.locator('.fellowship-feed details').count(),0);
 assert.equal(await dialog.locator('.fellowship-feed-body').first().isVisible(),true);
 await dialog.getByRole('button',{name:'Load older posts'}).click();
 await dialog.locator('.fellowship-feed article').nth(44).waitFor();
 const host=page.locator('.fellowship-excursion-content');
 await host.evaluate(e=>e.scrollTop=1300);
 const before=await host.evaluate(e=>e.scrollTop), route=page.url();
 await dialog.locator('.fellowship-feed article').nth(5).getByRole('button',{name:'Open discussion and replies'}).evaluate(e=>e.click());
 await page.locator('.fellowship-conversation').locator('#composer:not([hidden])').waitFor();
 await dialog.getByRole('button',{name:'Back to feed'}).click();
 await dialog.locator('.fellowship-feed article').nth(44).waitFor();
 await page.waitForTimeout(100);
 assert.equal(await host.evaluate(e=>e.scrollTop),before);
 assert.equal(page.url(),route);
 await dialog.getByRole('button',{name:'Close Fellowship'}).click();
 assert.equal(await launch.evaluate(e=>e===document.activeElement),true);
 assert.equal(await page.evaluate(()=>[...__fixture.auth].filter(x=>x.win!==top).length),0);
 assert.equal(await page.evaluate(()=>[...__fixture.snaps].filter(x=>x.win!==top||x.path.startsWith('commonsCommunityMembers/')).length),0);
});
for (const mobile of [false,true]) test('thread, composer and attachment picker fit the viewport '+(mobile?'mobile':'desktop'),async t=>{
 const {page,dialog,child}=await setup(t,{mobile});
 const sizes=mobile?[{width:390,height:844},{width:844,height:390},{width:390,height:420},{width:320,height:568}]:[{width:1440,height:1000}];
 for (const size of sizes) {
  await page.setViewportSize(size);
  await child.locator('#message').fill('Multi-line reply\n'.repeat(5));
  await page.waitForTimeout(80);
  const bounds=await child.evaluate(()=>{
   const b=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
   return {width:innerWidth,height:innerHeight,composer:b(document.querySelector('#composer')),input:b(document.querySelector('#message')),send:b(document.querySelector('.send')),overflow:document.documentElement.scrollWidth>innerWidth,thread:document.querySelector('#thread').clientHeight};
  });
  for (const name of ['composer','input','send']) {
   assert.ok(bounds[name].top>=-1 && bounds[name].bottom<=bounds.height+1,JSON.stringify({size,name,bounds}));
   assert.ok(bounds[name].left>=-1 && bounds[name].right<=bounds.width+1,JSON.stringify({size,name,bounds}));
  }
  assert.ok(bounds.thread>30,JSON.stringify(bounds));assert.equal(bounds.overflow,false);
  assert.equal(await child.locator('header').count(),0);
  assert.equal(await page.locator('.fellowship iframe').count(),0);
  assert.equal(await dialog.locator('#fellowshipTitle').isVisible(),false);
  assert.equal(await dialog.locator('.fellowship-menu summary').count(),1);
 }
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
 await child.locator('.add-content summary').click();
 const picker=await child.locator('.attachment-popover').evaluate(e=>{const r=e.getBoundingClientRect();return {y:r.y,height:r.height}});
 assert.ok(picker.y>=0 && picker.y+picker.height<=await child.evaluate(()=>innerHeight)+1,JSON.stringify(picker));
 if (process.env.ARTIFACT_DIR) {
  await fs.mkdir(process.env.ARTIFACT_DIR,{recursive:true});
  await page.screenshot({path:path.join(process.env.ARTIFACT_DIR,'conversation-'+(mobile?'mobile':'desktop')+'.png')});
 }
});
for (const exit of ['close','dispose','pagehide','navigate','switch','A-B-A']) test('pending reply cannot write after '+exit,async t=>{
 const {page,dialog,child}=await setup(t);
 await holdReply(page,child);
 if (exit==='close') await dialog.getByRole('button',{name:'Close Fellowship'}).click();
 if (exit==='dispose') await child.evaluate(root=>root.dispatchEvent(new Event('hg:fellowship-dispose')));
 if (exit==='pagehide') await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 if (exit==='navigate') await dialog.getByRole('button',{name:'Back to feed'}).click();
 if (exit==='switch'||exit==='A-B-A') await page.evaluate(aba=>{__switchUser('bob');if(aba)__switchUser('alice');},exit==='A-B-A');
 await releaseReply(page);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
 assert.equal(await page.evaluate(()=>[...__fixture.auth].filter(x=>x.win!==top).length),0);
});
test('revocation clears private content and disables composer before pending work completes',async t=>{
 const {page,child}=await setup(t);await holdReply(page,child);
 await revoke(page);
 await child.getByText('Join this community before viewing its conversations.',{exact:true}).waitFor();
 assert.equal(await child.locator('#thread').innerText(),'');
 assert.equal(await child.locator('#composer').isVisible(),false);
 assert.equal(await child.locator('#message').isDisabled(),true);
 assert.equal(await child.locator('.send').isDisabled(),true);
 await releaseReply(page);
 await child.locator('#composer').evaluate(e=>e.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('server membership recheck prevents a write before the revocation observer arrives',async t=>{
 const {page,child}=await setup(t);await holdReply(page,child);
 await page.evaluate(()=>__fixture.members.delete('commonsCommunityMembers/study/members/alice'));
 await releaseReply(page);
 await child.getByText(/Join this community before replying.|Community access could not be verified./).waitFor();
 assert.equal(await child.locator('#message').isDisabled(),true);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
for(const denied of ['nonmember','cached','error']) test('unverified '+denied+' membership never reads the thread',async t=>{
 const feed={records:[target],...(denied==='nonmember'?{members:[]}:denied==='cached'?{cached:true}:{denyMembership:true})};
 const {page,frame,conversation}=await harness(t,{production:true,route:direct,feed});
 const child=await conversation();
 await child.getByText(denied==='nonmember'?'Join this community before viewing its conversations.':denied==='cached'?'Connect to verify your community access.':'Community access could not be verified.',{exact:true}).waitFor();
 assert.equal(await child.locator('#composer').isVisible(),false);
 assert.equal(await page.evaluate(()=>(__fixture.feedReads||[]).length),0);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('account switches purge the previous draft and frame observers',async t=>{
 const {page,dialog,child}=await setup(t);
 await child.locator('#message').fill('Private Alice draft');
 await page.evaluate(()=>__switchUser('bob'));
 await dialog.getByText('You haven’t joined any communities yet.',{exact:true}).waitFor();
 assert.doesNotMatch(await dialog.innerText(),/Private Alice draft|A community opening/);
 assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).some(k=>k.includes('hg-commons-draft:v1:alice'))),false);
 assert.equal(await page.evaluate(()=>[...__fixture.auth].filter(x=>x.win!==top).length),0);
 await page.evaluate(()=>__switchUser('alice'));
 await dialog.locator('.fellowship-feed article').getByRole('button',{name:'Open discussion and replies'}).click();
 const restored=page.locator('.fellowship-conversation');await restored.locator('#composer:not([hidden])').waitFor();
 assert.equal(await restored.locator('#message').inputValue(),'');
});
for (const mobile of [false,true]) test('Scripture reply retries once and opens the shared reader in place '+(mobile?'mobile':'desktop'),async t=>{
 const {page,child,dialog}=await setup(t,{mobile});
 const route=page.url();
 await child.locator('#message').fill('Compare this passage.');
 await child.locator('.add-content summary').click();
 await child.getByRole('button',{name:'Scripture Passage',exact:true}).click();
 await child.getByLabel('Book',{exact:true}).selectOption('John');
 await child.getByLabel('Verse (optional)').fill('5');
 await child.getByRole('button',{name:'Add to message'}).click();
 await page.evaluate(()=>__fixture.failShareAck=true);
 await child.getByRole('button',{name:'Send reply'}).click();
 await child.getByText(/Reply not saved/).waitFor();
 await child.getByRole('button',{name:'Send reply'}).click();
 await child.getByText('Reply posted.',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>__fixture.writes.length),1);
 const link=child.getByRole('link',{name:'Read John 1:5',exact:false});
 await link.click();const reader=page.getByRole('dialog',{name:'Shared reading'});
 await reader.getByText('Synthetic Scripture verse 5',{exact:false}).waitFor();
 assert.equal(page.url(),route);assert.equal(await dialog.isVisible(),true);
 await reader.getByRole('button',{name:'Close reading'}).click();
 assert.equal(await link.evaluate(e=>e===e.ownerDocument.activeElement),true);
 assert.equal(await child.locator('#thread .message').count(),2);
});
test('newest page, earlier pagination and immediate sends stay ordered without duplicates',async t=>{
 const {page,child}=await setup(t,{prepare:p=>seedReplies(p,65)});
 await child.locator('#thread .message').nth(30).waitFor();
 assert.match(await child.locator('#thread .message').nth(1).innerText(),/Earlier reply 35 /);
 assert.match(await child.locator('#thread .message').last().innerText(),/Earlier reply 64 /);
 await child.locator('#message').fill('Newest reply just sent');
 await child.getByRole('button',{name:'Send reply'}).click();
 await child.getByText('Reply posted.',{exact:true}).waitFor();
 assert.equal(await child.getByText('Newest reply just sent',{exact:true}).count(),1);
 assert.match(await child.locator('#thread .message').last().innerText(),/Newest reply just sent/);
 await child.getByRole('button',{name:'Load earlier replies'}).click();
 await child.locator('#thread .message').nth(61).waitFor();
 await child.getByRole('button',{name:'Load earlier replies'}).click();
 await child.locator('#thread .message').nth(66).waitFor();
 assert.equal(await child.locator('#thread .message').count(),67);
 assert.equal(await child.getByText('Newest reply just sent',{exact:true}).count(),1);
 assert.equal(await child.getByRole('button',{name:'Load earlier replies'}).isVisible(),false);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),1);
});
test('editing a new draft during a send keeps the new draft',async t=>{
 const {page,child}=await setup(t);await holdReply(page,child);
 await child.locator('#message').fill('Next message draft');
 await releaseReply(page);
 await child.getByText('Reply posted.',{exact:true}).waitFor();
 assert.equal(await child.locator('#message').inputValue(),'Next message draft');
 assert.equal(await child.getByText('Pending synthetic reply',{exact:true}).count(),1);
});
test('permission-aware private action opens existing request flow and returns to discussion',async t=>{
 const {page,dialog,child,frame}=await setup(t);
 await page.locator('.fellowship-excursion-content').evaluate(e=>e.scrollTop=40);
 const before=await page.locator('.fellowship-excursion-content').evaluate(e=>e.scrollTop);
 await child.getByRole('link',{name:'Message privately',exact:true}).click();
 const dm=await frame();await dm.getByRole('button',{name:'Request conversation',exact:true}).waitFor();
 assert.match(dm.url(),/to=bob1234567890123/);
 assert.equal(await dm.locator('#composer').isVisible(),false);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
 await dialog.locator('.fellowship-menu summary').click();
 await dialog.getByRole('button',{name:'Return to discussion',exact:true}).click();
 const back=page.locator('.fellowship-conversation');await back.locator('#composer:not([hidden])').waitFor();
 await page.waitForTimeout(80);
 assert.equal(await back.getAttribute('data-post'),'thread-post');
 assert.equal(await page.locator('.fellowship-excursion-content').evaluate(e=>e.scrollTop),before);
});
for (const uid of ['alice','invalid-user']) test('private messaging omits self or invalid author '+uid,async t=>{
 const {child}=await setup(t,{records:[{...target,uid}]});
 assert.equal(await child.locator('[data-private-message]').count(),0);
});
test('non-excursion attachments preserve the canonical discussion route',async t=>{
 const body='Scripture context.\nReading: http://fellowship.test/?card=scriptureapi&ref=John+1%3A5&version=KJV';
 const {page,frame,conversation}=await harness(t,{production:true,unification:true,route:direct,feed:{records:[{...target,body}]}});
 const child=await conversation();await child.locator('#composer:not([hidden])').waitFor();
 const route=page.url();await child.getByRole('link',{name:'Read John 1:5',exact:false}).click();
 const reader=page.getByRole('dialog',{name:'Shared reading'});await reader.getByText('Synthetic Scripture verse 5',{exact:false}).waitFor();
 assert.equal(page.url(),route);await reader.getByRole('button',{name:'Close reading'}).click();
 assert.equal(await child.locator('#composer').isVisible(),true);
 await page.reload();const restored=await conversation();await restored.locator('#composer:not([hidden])').waitFor();
 assert.equal(await restored.getAttribute('data-post'),'thread-post');
});

for (const stage of ['existence','membership']) for (const exit of ['close','revoke','switch']) test('pending '+stage+' lookup cannot write after '+exit,async t=>{
 const {page,dialog,child}=await setup(t);
 await page.evaluate(stage=>{__fixture.holdReadPrefix=stage==='existence'?'commonsCommunityPosts/study/posts/thread-post/replies/':'commonsCommunityMembers/study/members/alice';},stage);
 await child.locator('#message').fill('Held at final permission boundary');
 await child.getByRole('button',{name:'Send reply'}).click();
 await page.waitForFunction(()=>typeof __fixture.releaseRead==='function');
 if(exit==='close')await dialog.getByRole('button',{name:'Close Fellowship'}).click();
 if(exit==='revoke')await revoke(page);
 if(exit==='switch')await page.evaluate(()=>__switchUser('bob'));
 await page.evaluate(()=>{__fixture.holdReadPrefix=null;__fixture.releaseRead()});
 await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('private-message return restores earlier loaded replies and thread position',async t=>{
 const {page,child,dialog,frame}=await setup(t,{prepare:p=>seedReplies(p,65)});
 await child.locator('#thread .message').nth(30).waitFor();
 await child.getByRole('button',{name:'Load earlier replies'}).click();
 await child.locator('#thread .message').nth(60).waitFor();
 await page.locator('.fellowship-excursion-content').evaluate(e=>e.scrollTop=1800);
 const before=await page.locator('.fellowship-excursion-content').evaluate(e=>e.scrollTop);
 await page.evaluate(()=>document.querySelector('.fellowship-conversation').querySelectorAll('[data-private-message]')[10].click());
 const dm=await frame();await dm.getByRole('button',{name:'Request conversation',exact:true}).waitFor();
 await dialog.locator('.fellowship-menu summary').click();
 await dialog.getByRole('button',{name:'Return to discussion',exact:true}).click();
 const back=page.locator('.fellowship-conversation');await back.locator('#thread .message').nth(60).waitFor();
 assert.equal(await page.locator('.fellowship-excursion-content').evaluate(e=>e.scrollTop),before);
});
test('a valid current author has no private-message action',async t=>{
 const uid='alice1234567890123';
 const {child}=await setup(t,{records:[{...target,uid}],prepare:async page=>{
  await page.evaluate(uid=>{__fixture.members.add('commonsCommunityMembers/study/members/'+uid);__switchUser(uid)},uid);
  await page.locator('.fellowship-feed article').waitFor();
 }});
 assert.equal(await child.locator('[data-private-message]').count(),0);
});
for(const state of ['cached','error']) test('an open thread fails closed on membership '+state,async t=>{
 const {page,child}=await setup(t);
 await child.locator('#message').fill('Private unfinished reply');
 await page.evaluate(state=>{
  for(const rec of [...__fixture.snaps])if(rec.path==='commonsCommunityMembers/study/members/alice'){
   if(state==='cached')rec.cb({exists:()=>true,metadata:{fromCache:true}});
   else rec.err({code:'permission-denied'});
  }
 },state);
 await child.getByText(state==='cached'?'Checking community access…':'Community access could not be verified.',{exact:true}).waitFor();
 assert.equal(await child.locator('#thread').innerText(),'');assert.equal(await child.locator('#message').isDisabled(),true);
 // A snapshot stream terminates on an error; re-enter to establish a fresh listener.
 if(state==='error')return;
 await page.evaluate(()=>{for(const rec of [...__fixture.snaps])if(rec.path==='commonsCommunityMembers/study/members/alice')rec.cb({exists:()=>true,metadata:{fromCache:false}})});
 await child.locator('#composer:not([hidden])').waitFor();assert.equal(await child.locator('#message').inputValue(),'');
 await child.locator('#message').fill('Reply after access is verified');await child.getByRole('button',{name:'Send reply'}).click();
 await child.getByText('Reply posted.',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>__fixture.writes.length),1);
});
