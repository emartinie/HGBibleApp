const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {harness,repo}=require('./harness.cjs');
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


test('integrated Google authentication inside Fellowship retains week and replaces only the account screen',async t=>{
 const {page,frame}=await harness(t,{signedOut:true});await frame();await page.evaluate(()=>__fixture.allowProvider=true);await page.getByRole('button',{name:'Account',exact:true}).click();let child=await frame();await child.locator('#google').click();
 await page.waitForFunction(()=>__fixture.user?.uid==='signed-in-test');child=await frame();await child.locator('#account').filter({hasText:'signed-in-test'}).waitFor();assert.match(page.url(),/week=12/);assert.equal(await page.evaluate(()=>__fixture.authCalls.length),1);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('integrated linking preserves UID and collision never falls back to sign-in',async t=>{
 const {page,frame}=await harness(t);await frame();await page.evaluate(()=>{__fixture.user.providerData=[];__fixture.allowProvider=true;__fixture.linkCollision=true;});await page.getByRole('button',{name:'Account',exact:true}).click();const child=await frame();await child.locator('#linkGoogle').click();await child.locator('#status').filter({hasText:'No accounts were merged'}).waitFor();
 assert.equal(await page.evaluate(()=>__fixture.user.uid),'alice');await page.evaluate(()=>__fixture.linkCollision=false);await child.locator('#linkGoogle').click();await child.locator('#status').filter({hasText:'Google linked to your existing member account'}).waitFor();assert.deepEqual(await page.evaluate(()=>__fixture.authCalls.map(x=>[x.kind,x.uid])),[['linkGoogle','alice'],['linkGoogle','alice']]);assert.equal(await page.evaluate(()=>__fixture.user.uid),'alice');
});
test('pending popup from a disposed embedded Account screen cannot sign in later',async t=>{
 const {page,frame}=await harness(t,{signedOut:true});await frame();await page.evaluate(()=>{__fixture.allowProvider=true;__fixture.holdProvider=true});await page.getByRole('button',{name:'Account',exact:true}).click();const child=await frame();await child.locator('#google').click();await page.waitForFunction(()=>typeof __fixture.resolveProvider==='function');
 await page.getByRole('button',{name:'Explore',exact:true}).click();await frame();await page.evaluate(()=>__fixture.resolveProvider());await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>__fixture.user),null);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);assert.match(page.url(),/view=explore/);
});
test('stale parent auth callback cannot reset the current account screen',async t=>{
 const {page,frame}=await harness(t);await frame();await page.evaluate(()=>{window.parentAuth=[...__fixture.auth].find(rec=>rec.win===top);__switchUser('bob')});await frame();await page.evaluate(()=>{window.currentFrame=document.querySelector('.fellowship iframe');parentAuth.cb(null)});assert.equal(await page.evaluate(()=>document.querySelector('.fellowship iframe')===currentFrame),true);assert.match(await page.locator('[data-fellowship-account]').textContent(),/Signed in/);
});
test('signed-out profile uses hardened Account navigation with no direct provider call',async t=>{
 const {page,frame}=await harness(t,{signedOut:true});await frame();await page.getByRole('button',{name:'My profile',exact:true}).click();let child=await frame();await child.getByRole('button',{name:'Open HomeGroups Account',exact:true}).click();await page.waitForURL(/section=account/);child=await frame();await child.locator('#google').waitFor();assert.equal(await page.evaluate(()=>__fixture.authCalls.length),0);assert.match(page.url(),/week=12/);
});
test('prayer posting never starts an independent Google authentication operation',async t=>{
 const {page}=await harness(t,{route:'?card=fellowship&view=prayer&week=12',signedOut:true});await page.locator('#prayerMap').waitFor();await page.waitForFunction(()=>typeof __fixture.mapClick==='function');page.once('dialog',dialog=>dialog.dismiss());await page.locator('#prayerMapAddBtn').click();await page.evaluate(()=>__fixture.mapClick({latlng:{lat:36.123456,lng:-87.456789}}));await page.locator('#prayerMessageInput').fill('Local test only');await page.locator('#prayerLocationConsent').check();await page.locator('#prayerSaveBtn').click();await page.locator('#prayerFormStatus').filter({hasText:'Use Account to sign in or connect Google'}).waitFor();assert.equal(await page.evaluate(()=>__fixture.authCalls.length),0);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
