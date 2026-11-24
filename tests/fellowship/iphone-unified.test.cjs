const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {harness}=require('./harness.cjs');
const record={id:'iphone-thread',area:'study',title:'A conversation together',time:1,body:'A long opening message.\n'+('The same HomeGroups conversation.\n'.repeat(36))};
async function open(t,{mobile=true,signedOut=false}={}){
 const app=await harness(t,{production:true,mobile,signedOut,unification:true,route:'?card=mainstage&week=12',feed:{records:[record]}});
 await app.page.locator('#mainStageFellowshipPilot').click();
 return {...app,dialog:app.page.getByRole('dialog',{name:'Fellowship',exact:true})};
}
async function thread(app){
 await app.dialog.getByRole('button',{name:'Open discussion and replies'}).click();
 const root=await app.conversation();await root.locator('#composer:not([hidden])').waitFor();return root;
}
async function screenshot(page,name){if(process.env.ARTIFACT_DIR){await fs.mkdir(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ARTIFACT_DIR,name+'.png'),fullPage:false})}}
for(const mobile of [false,true])test('one natural conversation surface and anchored composer '+(mobile?'iphone':'desktop'),async t=>{
 const app=await open(t,{mobile});const root=await thread(app),{page,dialog}=app;
 assert.equal(await dialog.locator('iframe').count(),0);
 assert.equal(await root.locator('#thread').evaluate(e=>getComputedStyle(e).overflowY),'visible');
 const scroll=page.locator('.fellowship-excursion-content');
 assert.ok(await scroll.evaluate(e=>e.scrollHeight>e.clientHeight));
 for(const position of [0,600,100000]){
  await scroll.evaluate((e,p)=>e.scrollTop=p,position);
  const composer=await root.locator('#composer').boundingBox();
  const body=await scroll.boundingBox();
  assert.ok(composer.y>=body.y && composer.y+composer.height<=body.y+body.height+1,JSON.stringify({position,composer,body}));
 }
 const back=await dialog.getByRole('button',{name:'Back to feed'}).boundingBox();assert.ok(back.width<140);
 assert.equal(await dialog.locator('#fellowshipTitle').isVisible(),false);
 await scroll.evaluate(e=>e.scrollTop=0);await screenshot(page,'issue51-'+(mobile?'iphone':'desktop')+'-conversation');
});
for(const size of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:844,height:390},{width:390,height:420}])test('narrow and reduced viewport fits composer '+size.width+'x'+size.height,async t=>{
 const app=await open(t);await app.page.setViewportSize(size);const root=await thread(app);
 await root.locator('#message').fill('A reply with several lines.\n'.repeat(4));
 await app.page.waitForTimeout(60);
 const box=await root.locator('#composer').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,JSON.stringify(box));
 assert.equal(await app.dialog.evaluate(e=>e.scrollWidth>e.clientWidth),false);
 await root.locator('.add-content summary').click();
 const picker=await root.locator('.attachment-popover').boundingBox();assert.ok(picker.x>=0&&picker.x+picker.width<=size.width+1&&picker.y>=0,JSON.stringify(picker));
});
test('visual viewport events resize the open shell and are released on close',async t=>{
 const app=await open(t);const {page,dialog}=app;const root=await thread(app);await root.locator('#message').focus();
 await page.evaluate(()=>{
  window.__viewportReads=0;
  Object.defineProperty(visualViewport,'height',{configurable:true,get(){__viewportReads++;return 420;}});
  Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:30});
  visualViewport.dispatchEvent(new Event('resize'));
 });
 await page.waitForFunction(()=>document.querySelector('.fellowship-excursion').style.getPropertyValue('--fellowship-viewport-height')==='420px');
 const box=await dialog.boundingBox();assert.equal(box.height,420);assert.equal(box.y,30);
 const composer=await root.locator('#composer').boundingBox();assert.ok(composer.y+composer.height<=450,JSON.stringify(composer));
 await dialog.getByRole('button',{name:'Close Fellowship'}).click();
 const reads=await page.evaluate(()=>__viewportReads);await page.evaluate(()=>visualViewport.dispatchEvent(new Event('resize')));await page.waitForTimeout(50);
 assert.equal(await page.evaluate(()=>__viewportReads),reads);
});
test('cached bootstrap is neutral, gates access, and never flashes the reconnect warning on confirmation',async t=>{
 const app=await open(t);await app.dialog.locator('.fellowship-feed article').waitFor();await app.page.evaluate(()=>__fixture.feed.cached=true);
 // Existing feed data is already server-confirmed; the next thread subscription starts from cache.
 await app.dialog.getByRole('button',{name:'Open discussion and replies'}).click();const root=await app.conversation();
 await root.getByText('Checking community access…',{exact:true}).waitFor();
 assert.equal(await root.locator('#composer').isVisible(),false);assert.equal(await root.locator('#thread').innerText(),'');
 assert.equal(await root.getByText('Connect to verify your community access.',{exact:true}).count(),0);
 await app.page.evaluate(()=>{__fixture.feed.cached=false;for(const rec of [...__fixture.snaps])if(rec.path==='commonsCommunityMembers/study/members/alice')rec.cb({exists:()=>true,metadata:{fromCache:false}})});
 await root.locator('#composer:not([hidden])').waitFor();await app.page.waitForTimeout(1600);
 assert.equal(await root.getByText('Connect to verify your community access.',{exact:true}).count(),0);
});
test('unconfirmed cache eventually explains reconnect and never grants access',async t=>{
 const {page,conversation}=await harness(t,{production:true,route:'?card=fellowship-live&view=home&section=discussion&area=study&post=iphone-thread',feed:{cached:true,records:[record]}});
 const root=await conversation();await root.getByText('Connect to verify your community access.',{exact:true}).waitFor();
 assert.equal(await root.locator('#message').isDisabled(),true);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('signed-out Google and email controls stay inside Fellowship',async t=>{
 const {page,dialog}=await open(t,{signedOut:true});const account=dialog.locator('.fellowship-account');
 await account.getByRole('button',{name:'Continue with Google'}).waitFor();
 assert.equal(await dialog.locator('iframe,.messaging-shell,.messaging-nav').count(),0);
 await page.evaluate(()=>__fixture.allowProvider=true);
 await account.getByLabel('Continue with email',{exact:true}).fill('member@example.invalid');
 await account.getByRole('button',{name:'Send sign-in link',exact:true}).click();
 await account.getByText(/Check member@example.invalid/).waitFor();
 const pending=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('hg-commons-email-link-pending')));
 assert.equal(pending.mode,'signin');assert.equal(pending.uid,null);
 const calls=await page.evaluate(()=>__fixture.authCalls);assert.equal(calls.length,1);const callback=new URL(calls[0].settings.url);assert.match(callback.pathname,/commons\/auth\/$/);assert.match(callback.searchParams.get('next'),/card=fellowship-live/);
 await screenshot(page,'issue51-iphone-signin');
});
test('native Google sign-in returns to the feed without leaving study',async t=>{
 const {page,dialog}=await open(t,{signedOut:true});const route=page.url();
 await page.evaluate(()=>__fixture.allowProvider=true);
 await dialog.getByRole('button',{name:'Continue with Google'}).click();
 await dialog.getByText('You haven’t joined any communities yet.',{exact:true}).waitFor();
 assert.equal(page.url(),route);assert.equal(await dialog.locator('.fellowship-account').count(),0);
});
test('native account methods and sign-out preserve privacy and study position',async t=>{
 const {page,dialog}=await open(t);
 await dialog.locator('.fellowship-menu summary').click();await dialog.getByRole('button',{name:'Account / Sign In',exact:true}).click();
 const account=dialog.locator('.fellowship-account');await account.getByRole('button',{name:'Sign out',exact:true}).waitFor();
 assert.equal(await dialog.locator('iframe,.messaging-shell').count(),0);
 assert.doesNotMatch(await account.innerText(),/Member ID:|HOMEGROUPS · MESSAGING|Continue to Messaging/);
 await account.locator('.account-methods summary').click();await account.getByLabel('Link an email address').fill('private@example.invalid');
 await account.getByRole('button',{name:'Sign out',exact:true}).click();
 await dialog.getByRole('button',{name:'Continue with Google'}).waitFor();
 assert.doesNotMatch(await dialog.innerText(),/private@example.invalid/);
 await screenshot(page,'issue51-iphone-account');
 await dialog.getByRole('button',{name:'Close Fellowship'}).click();assert.match(page.url(),/card=mainstage/);
});
test('inline Fellowship entrance does not cover study and labels the badge by conversation and request counts',async t=>{
 const {page}=await harness(t,{production:true,mobile:true,route:'?card=mainstage',feed:{records:[record]}});
 const entrance=page.locator('#mainStageFellowshipPilot');const badge=entrance.locator('#hg-commons-badge');await badge.waitFor({state:'attached'});
 assert.equal(await page.locator('#hg-commons-launch').isVisible(),false);
 assert.equal(await entrance.evaluate(e=>getComputedStyle(e).position),'static');
 await page.waitForFunction(()=>[...__fixture.snaps].some(r=>r.path==='commonsDirectConversations'));
 await page.evaluate(()=>{
  const docs=[{id:'incoming',data:()=>({status:'pending',requestedBy:'bob'})},{id:'outgoing',data:()=>({status:'pending',requestedBy:'alice'})},{id:'conversation-a',data:()=>({status:'accepted'})},{id:'conversation-b',data:()=>({status:'accepted'})}];
  [...__fixture.snaps].find(r=>r.path==='commonsDirectConversations').cb({docs});
 });
 await page.waitForFunction(()=>[...__fixture.snaps].some(r=>r.path==='commonsDirectConversations/conversation-a/messages'));
 await page.evaluate(()=>{
  for(const rec of [...__fixture.snaps])if(rec.path.endsWith('/messages'))rec.cb({docs:[{data:()=>({senderUid:rec.path.includes('conversation-a')?'bob':'alice',createdAt:{toMillis:()=>1000}})}]});
 });
 assert.equal(await badge.innerText(),'2');assert.match(await entrance.getAttribute('aria-label'),/1 conversation request, 1 conversation with new messages/);
 await page.evaluate(()=>{localStorage.setItem('hg-direct-read-v1:alice:conversation-a','1500');window.dispatchEvent(new StorageEvent('storage',{key:'hg-direct-read-v1:alice:conversation-a'}));});
 assert.equal(await badge.innerText(),'1');assert.match(await entrance.getAttribute('title'),/1 conversation request, 0 conversations with new messages/);
 await screenshot(page,'issue51-iphone-study-entrance');
});
test('closing the native sign-in panel prevents a delayed Google popup from changing accounts',async t=>{
 const {page,dialog}=await open(t,{signedOut:true});
 await page.evaluate(()=>{__fixture.allowProvider=true;__fixture.holdProvider=true});
 await dialog.getByRole('button',{name:'Continue with Google'}).click();await page.waitForFunction(()=>typeof __fixture.resolveProvider==='function');
 await dialog.getByRole('button',{name:'Close Fellowship'}).click();
 await page.evaluate(()=>__fixture.resolveProvider());await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>__fixture.user),null);assert.equal(await dialog.isVisible(),false);
});
test('stable token refresh preserves the native account linking draft',async t=>{
 const {page,dialog}=await open(t);
 await dialog.locator('.fellowship-menu summary').click();await dialog.getByRole('button',{name:'Account / Sign In',exact:true}).click();
 const account=dialog.locator('.fellowship-account');await account.locator('.account-methods summary').click();
 await account.getByLabel('Link an email address').fill('draft@example.invalid');
 await page.evaluate(()=>{window.__previousAccount=document.querySelector('.fellowship-account');__fixture.emitTokenRefresh=true;document.dispatchEvent(new Event('visibilitychange'))});
 await page.waitForTimeout(120);
 assert.equal(await page.evaluate(()=>document.querySelector('.fellowship-account')===__previousAccount),true);
 assert.equal(await account.getByLabel('Link an email address').inputValue(),'draft@example.invalid');
});
test('community discussion index opens an existing thread in the native surface',async t=>{
 const {page,dialog,frame}=await open(t);
 await dialog.locator('.fellowship-menu summary').click();await dialog.getByRole('button',{name:'My Communities',exact:true}).click();
 let child=await frame();await child.getByRole('link',{name:'Community conversation'}).click();child=await frame();
 await child.locator('#discussionIndex a').click();await dialog.locator('.fellowship-conversation #composer:not([hidden])').waitFor();
 assert.equal(await dialog.locator('iframe').count(),0);assert.equal(await dialog.locator('.fellowship-conversation').getAttribute('data-post'),'iphone-thread');
});
test('a signed-out standalone Fellowship route still returns to Bible study',async t=>{
 const {page}=await harness(t,{production:true,mobile:true,signedOut:true,expectUnavailable:true,route:'?card=fellowship-live&week=12'});
 await page.getByRole('button',{name:'Return to study',exact:true}).click();
 await page.waitForURL(/card=mainstage/);assert.match(page.url(),/week=12/);
 assert.equal(await page.locator('.fellowship-account').count(),0);
});
