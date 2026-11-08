const {test}=require('node:test');const assert=require('node:assert/strict');
const {harness}=require('./harness.cjs');const fs=require('node:fs/promises'),path=require('node:path');
async function screenshot(page,name){if(process.env.ARTIFACT_DIR){await fs.mkdir(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ARTIFACT_DIR,name+'.png')});}}
const discussion='?card=fellowship-live&view=communities&section=discussion&area=study&post=older-post&week=12';
async function sharedURL(page){return page.evaluate(async()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__sharedRoute=text}});await HGRoute.share();return window.__sharedRoute;});}
async function menu(page,label){const box=page.locator('.fellowship-menu');if(!await box.evaluate(el=>el.open))await box.locator('summary').click();await page.getByRole('button',{name:label,exact:true}).click();}
async function loadedDiscussion(frame){const child=await frame();await child.locator('#post-older-post:visible').waitFor();return child;}
test('B1: older post deep link is authorized, directly fetched, and survives refresh',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion});let child=await loadedDiscussion(frame);
 const shared=await sharedURL(page);assert.match(shared,/post=older-post/);assert.doesNotMatch(shared,/scrollTop|PRIVATE/);
 assert.equal(await child.locator('#post-older-post').count(),1);assert.ok((await page.evaluate(()=>__fixture.targetReads)).some(p=>p.endsWith('/older-post')));
 await page.reload();child=await loadedDiscussion(frame);assert.match(page.url(),/post=older-post/);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('A1 reader preserves reference/translation on refresh without requiring membership',async t=>{
 const {page}=await harness(t,{production:true,unification:true,signedOut:true,route:'?card=scriptureapi&ref=John%201%3A5&version=NASB&week=12'});
 assert.equal(await page.locator('#scriptureVersion').inputValue(),'NASB');assert.equal(await page.locator('#scriptureSearch').inputValue(),'John 1:5');assert.match(await sharedURL(page),/version=NASB/);
 await page.locator('#scriptureRendered [data-number="5"]').scrollIntoViewIfNeeded();await page.reload();await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();
 assert.equal(await page.locator('#scriptureVersion').inputValue(),'NASB');assert.equal(await page.evaluate(()=>__fixture.authCalls.length),0);assert.equal(await page.locator('[data-discussion-link]').isVisible(),false);
});
for(const mobile of [false,true])test('Journey 1: explicit Scripture association, map memento and exact reading return '+(mobile?'mobile':'desktop'),async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,mobile,route:discussion});let child=await loadedDiscussion(frame);
 await child.getByRole('link',{name:'Read John 1:5',exact:true}).click();await page.waitForURL(/card=scriptureapi/);await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();
 assert.equal(await page.locator('#scriptureVersion').inputValue(),'NASB');assert.equal(await page.locator('.fellowship iframe').count(),0,'no nested application');
 const before=await page.locator('#scriptureRendered [data-number="5"]').evaluate(el=>{const host=el.closest('.card');host.scrollTop+=el.getBoundingClientRect().top-host.getBoundingClientRect().top-140;return el.getBoundingClientRect().top-host.getBoundingClientRect().top;});
 await screenshot(page,(mobile?'mobile':'desktop')+'-reader');await page.locator('[data-discussion-link]').click();child=await loadedDiscussion(frame);assert.match(page.url(),/post=older-post/);
 await menu(page,'My Communities');child=await frame();await child.locator('[data-enroll="study"]:enabled').waitFor();
 await menu(page,'Prayer Map');await page.locator('#prayerMap').waitFor();await page.waitForFunction(()=>!!window.currentMap);
 await page.evaluate(()=>{currentMap.setView([12.5,30.25],6);currentMap.removeLayer(__fixture.groups.at(-1));});
 const mapBefore=await page.evaluate(()=>capturePrayerMapView());await screenshot(page,(mobile?'mobile':'desktop')+'-map');
 await menu(page,'Explore Communities');await frame();await menu(page,'Prayer Map');await page.waitForFunction(()=>!!window.currentMap);
 assert.deepEqual(await page.evaluate(()=>capturePrayerMapView()),mapBefore);
 await menu(page,'Return to Bible Study');await page.waitForURL(/card=scriptureapi/);await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();await page.waitForTimeout(100);
 assert.equal(await page.locator('#scriptureVersion').inputValue(),'NASB');assert.equal(await page.locator('#scriptureSearch').inputValue(),'John 1:5');
 const after=await page.locator('#scriptureRendered [data-number="5"]').evaluate(el=>el.getBoundingClientRect().top-el.closest('.card').getBoundingClientRect().top);
 assert.ok(Math.abs(after-before)<=32,JSON.stringify({before,after}));assert.equal(await page.locator('#weekSelect').inputValue(),'12');assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});

test('Journey 2 returns from an invitation to the same authorized post, filters and position',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion});let child=await loadedDiscussion(frame);
 await child.locator('#search').fill('Explicit');await child.locator('#topicFilter').selectOption('General discussion');
 await child.locator('#post-older-post').getByRole('button',{name:'Message privately',exact:false}).first().scrollIntoViewIfNeeded();
 const before=await child.evaluate(()=>window.scrollY);
 await child.locator('#post-older-post').getByRole('button',{name:'Message privately',exact:false}).first().click();
 await page.waitForURL(/view=messages/);child=await frame();await child.getByRole('button',{name:'Request conversation',exact:true}).waitFor();
 assert.equal(await child.locator('#composer').isVisible(),false);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
 await menu(page,'Return to discussion');child=await loadedDiscussion(frame);await page.waitForTimeout(80);
 assert.equal(await child.locator('#search').inputValue(),'Explicit');assert.equal(await child.locator('#topicFilter').inputValue(),'General discussion');
 assert.ok(Math.abs(await child.evaluate(()=>window.scrollY)-before)<=32);assert.match(page.url(),/post=older-post/);
});
for(const target of ['missing','restricted'])test('unavailable target '+target+' never renders a restricted preview or association',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion.replace('older-post',target)});const child=await frame();
 await child.getByText('This discussion is unavailable.',{exact:true}).waitFor();assert.equal(await child.locator('#posts article').count(),0);assert.equal(await child.locator('.reading-link').count(),0);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('canonical post targets survive browser Back and Forward',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion.replace('&post=older-post','')+'#post-older-post'});await loadedDiscussion(frame);
 await menu(page,'Prayer Map');await page.locator('#prayerMap').waitFor();await page.goBack();await loadedDiscussion(frame);
 await page.goForward();await page.locator('#prayerMap').waitFor();assert.match(page.url(),/view=prayer/);
});
test('newer routes supersede a delayed load and late map callbacks',async t=>{
 const {page,frame,context}=await harness(t,{production:true,unification:true,route:discussion});await loadedDiscussion(frame);
 let release,started;const gate=new Promise(r=>release=r),requested=new Promise(r=>started=r);
 await context.route('**/cards/prayermap.html',async r=>{started();await gate;try{await r.fulfill({body:'<div id="staleMap">obsolete</div>',contentType:'text/html'})}catch{}});
 await page.evaluate(()=>{void HGRoute.navigate('fellowship-live',{view:'prayer',week:12})});await requested;
 await page.evaluate(()=>{void HGRoute.navigate('scriptureapi',{ref:'John 1:5',version:'NASB',week:12})});release();await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();
 assert.equal(await page.locator('#staleMap,.fellowship iframe').count(),0);assert.match(page.url(),/card=scriptureapi/);
});
test('account changes invalidate private return/association state without putting it in storage or history',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion});let child=await loadedDiscussion(frame);await child.locator('#search').fill('PRIVATE FILTER TOKEN');
 await child.getByRole('link',{name:'Read John 1:5',exact:true}).click();await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();await page.locator('[data-discussion-link]').waitFor();
 assert.doesNotMatch(await page.evaluate(()=>JSON.stringify(history.state)+JSON.stringify(sessionStorage)+JSON.stringify(localStorage)),/PRIVATE FILTER TOKEN|Explicit test discussion/);
 await page.evaluate(()=>{__switchUser('bob');__switchUser('alice')});await page.waitForTimeout(100);
 assert.equal(await page.locator('[data-discussion-link]').isVisible(),false);
 await page.evaluate(()=>{void HGRoute.navigate('fellowship-live',{view:'communities',section:'discussion',area:'study',post:'older-post',week:12})});child=await loadedDiscussion(frame);
 assert.equal(await child.locator('#search').inputValue(),'');
});
test('repeated journeys keep listener counts stable and inherit light/dark/diagnostic tokens',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion});let child=await loadedDiscussion(frame);
 for(const preset of ['cosmic','parchment','diagnostic']){
  await page.evaluate(p=>{document.documentElement.removeAttribute('data-hg-theme-diagnostic');document.documentElement.removeAttribute('data-hg-theme-preset');if(p==='diagnostic')document.documentElement.setAttribute('data-hg-theme-diagnostic','on');else if(p==='parchment')document.documentElement.setAttribute('data-hg-theme-preset',p)},preset);
  await child.getByRole('link',{name:'Read John 1:5',exact:true}).click();await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();
  const before=await page.evaluate(()=>({auth:__fixture.auth.size,guards:__fixture.guards.size}));
  await page.locator('[data-discussion-link]').click();child=await loadedDiscussion(frame);
  assert.equal(await child.locator('html').evaluate(el=>el.style.getPropertyValue('--text').trim()),await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--text').trim()));
  await child.getByRole('link',{name:'Read John 1:5',exact:true}).click();await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();
  assert.deepEqual(await page.evaluate(()=>({auth:__fixture.auth.size,guards:__fixture.guards.size})),before);
  await page.locator('[data-discussion-link]').click();child=await loadedDiscussion(frame);
 }
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});

test('accepted DM excursion keeps the intended recipient and clears the composer draft on disposal',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion});let child=await loadedDiscussion(frame);await page.evaluate(()=>__fixture.acceptedDM=true);
 await child.locator('#post-older-post').getByRole('button',{name:'Message privately',exact:false}).first().click();await page.waitForURL(/view=messages/);child=await frame();
 await child.locator('#composer:visible').waitFor();assert.match(page.url(),/id=bob1234567890123/);await child.locator('#composer input').fill('PRIVATE DISPOSABLE DRAFT');
 await menu(page,'Return to discussion');child=await loadedDiscussion(frame);await child.locator('#post-older-post').getByRole('button',{name:'Message privately',exact:false}).first().click();await page.waitForURL(/view=messages/);child=await frame();await child.locator('#composer:visible').waitFor();
 assert.equal(await child.locator('#composer input').inputValue(),'');assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('embedded A-B-A replaces the old frame and rejects its private filter memento',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion});let child=await loadedDiscussion(frame);await child.locator('#search').fill('PRIVATE OLD FILTER');
 await page.evaluate(()=>{window.oldEmbeddedFrame=document.querySelector('.fellowship iframe');__switchUser('bob');__switchUser('alice')});child=await loadedDiscussion(frame);
 assert.equal(await page.evaluate(()=>document.querySelector('.fellowship iframe')===oldEmbeddedFrame),false);assert.equal(await child.locator('#search').inputValue(),'');assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});

test('disposed discussion cannot issue a reply after a delayed profile read',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion});const child=await loadedDiscussion(frame);await child.locator('#post-older-post details').filter({has:child.locator('.replyform')}).locator('summary').click();await child.locator('#post-older-post .replyform textarea').fill('SYNTHETIC DELAYED REPLY');await page.evaluate(()=>__fixture.holdProfile=true);
 await child.locator('#post-older-post').getByRole('button',{name:'Post reply',exact:true}).click();await page.waitForFunction(()=>typeof __fixture.releaseProfile==='function');await menu(page,'Prayer Map');await page.locator('#prayerMap').waitFor();await page.evaluate(()=>{__fixture.holdProfile=false;__fixture.releaseProfile()});await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);assert.equal(await page.locator('.fellowship iframe').count(),0);
});

test('changing an open discussion hash to an unavailable target hides the previous post',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route:discussion});const child=await loadedDiscussion(frame);await child.evaluate(()=>location.hash='post-restricted');await child.getByText('This discussion is unavailable.',{exact:true}).waitFor();
 assert.equal(await child.locator('#post-older-post').isVisible(),false);assert.match(page.url(),/post=restricted/);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
