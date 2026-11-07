const {test}=require('node:test'),assert=require('node:assert/strict');
const {harness}=require('./harness.cjs');
const route='?card=fellowship-live&view=communities&section=discussion&area=study&post=older-post&week=12';
async function reader(page){await page.evaluate(()=>{void HGRoute.navigate('scriptureapi',{ref:'John 1:5',version:'NASB',week:12})});await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();}
test('reader search stays accessible and its Go button loads the requested reference',async t=>{
 const {page}=await harness(t,{production:true,unification:true,route});await reader(page);
 await page.locator('#scriptureSearch:visible').waitFor({timeout:2000});await page.locator('#scriptureSearch').fill('John 2:3');await page.locator('#loadedCardHost').getByRole('button',{name:'Go',exact:true}).click();
 await page.waitForFunction(()=>new URL(location.href).searchParams.get('ref')==='John 2:3');await page.locator('#scriptureContent[aria-busy="false"]').waitFor();assert.equal(await page.locator('#scriptureSearch').inputValue(),'John 2:3');const response=page.waitForResponse('https://rest.api.bible/**');await page.locator('#loadedCardHost').getByRole('button',{name:'Reload',exact:true}).click();await response;await page.locator('#scriptureContent[aria-busy="false"]').waitFor();
});
test('switching community clears the old post and returns a private excursion to the new community',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,route});let child=await frame();await child.locator('#post-older-post:visible').waitFor();await page.evaluate(()=>__fixture.members.add('commonsCommunityMembers/prayer/members/alice'));
 await child.locator('#area').selectOption('prayer');await child.locator('#discussionIndex:visible').waitFor({timeout:2000});assert.equal(await child.evaluate(()=>location.hash),'');assert.equal(new URL(page.url()).searchParams.get('post'),null);
 await child.locator('#discussionIndex a[href="#post-post1"]').click();await child.locator('#post-post1:visible').waitFor();await child.locator('#post-post1 [data-private-message]').click();await page.waitForURL(/view=messages/);await frame();
 await page.locator('.fellowship-menu summary').click();await page.getByRole('button',{name:'Return to discussion',exact:true}).click();child=await frame();await child.locator('#post-post1:visible').waitFor();assert.equal(new URL(page.url()).searchParams.get('area'),'prayer');assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
test('invalid reference interrupts a pending chapter and cannot be overwritten by its delayed result',async t=>{
 const {page,context}=await harness(t,{production:true,unification:true,route});await reader(page);let release,started;const gate=new Promise(r=>release=r),requested=new Promise(r=>started=r);
 await context.route('https://rest.api.bible/**',async r=>{started();await gate;try{await r.fulfill({contentType:'application/json',body:JSON.stringify({data:{reference:'John 2',content:'<p data-number="1">LATE CHAPTER</p>'}})})}catch{}});
 await page.locator('#scriptureChapter').fill('2');await page.locator('#scriptureLoadBtn').click();await requested;await page.evaluate(()=>{const input=document.getElementById('scriptureSearch');input.value='invalid reference';input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))});
 await page.locator('#scriptureContent [role="alert"]').waitFor();release();await page.waitForTimeout(150);assert.equal(await page.locator('#scriptureContent').innerText(),'Invalid reference. Try "John 1" or "Genesis 1:1".');assert.equal(await page.locator('#scriptureContent').getAttribute('aria-busy'),'false');
});
test('reader does not depend on access to legacy localStorage',async t=>{
 const {page}=await harness(t,{production:true,unification:true,route});await page.evaluate(()=>{const get=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key==='scriptureSearch')throw new DOMException('blocked','SecurityError');return get.call(this,key)}});
 await reader(page);assert.equal(await page.locator('#scriptureVersion').inputValue(),'NASB');
});
test('malformed API content has a recoverable announced error instead of an object rendering',async t=>{
 const {page,context}=await harness(t,{production:true,unification:true,route});await context.route('https://rest.api.bible/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({data:{content:{unexpected:true}}})}));
 await page.evaluate(()=>{void HGRoute.navigate('scriptureapi',{ref:'John 1:5',version:'NASB',week:12})});await page.locator('#scriptureContent[aria-busy="false"]').waitFor();assert.match(await page.locator('#scriptureContent').innerText(),/Failed to load Scripture/);assert.equal(await page.locator('#scriptureRendered').count(),0);assert.equal(await page.locator('#scriptureSearch').isVisible(),true);
});

test('request metadata and shared route describe the loaded chapter even after unsubmitted edits',async t=>{
 const {page,context}=await harness(t,{production:true,unification:true,route});await reader(page);let release,started;const gate=new Promise(r=>release=r),requested=new Promise(r=>started=r);
 await context.route('https://rest.api.bible/**',async r=>{started();await gate;await r.fulfill({contentType:'application/json',body:JSON.stringify({data:{reference:'John 2',content:'<p><span data-number="1">1</span> Synthetic John 2</p>'}})})});
 await page.locator('#scriptureChapter').fill('2');await page.locator('#scriptureLoadBtn').click();await requested;await page.locator('#scriptureChapter').fill('3');await page.locator('#scriptureSearch').fill('John 9:9');release();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();
 assert.equal(await page.locator('#scriptureSearch').evaluate(el=>document.activeElement===el),true,'loading completion must not steal a newly chosen input focus');
 const saved=await page.evaluate(async()=>{HGRoute.captureCard('scriptureapi');return (await import('/js/fellowship-context.js')).readingView()});assert.equal(saved.ref,'John 2');assert.equal(saved.version,'NASB');
 const shared=await page.evaluate(async()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.sharedReader=text}});await HGRoute.share();return window.sharedReader});assert.equal(new URL(shared).searchParams.get('ref'),'John 2');
});
test('reader and discussion restore keyboard focus, and reader handlers never bind MainStage controls',async t=>{
 const {page,frame,context}=await harness(t,{production:true,unification:true,route});let child=await frame();await child.locator('#post-older-post:visible').waitFor();assert.equal(await child.evaluate(()=>document.activeElement.id),'post-older-post');
 for(let i=0;i<2;i++){await reader(page);assert.equal(await page.evaluate(()=>document.querySelector('#scriptureContent').contains(document.activeElement)),true);assert.match(await page.locator('.hg-reading-status').innerText(),/Loaded John 1:5, NASB/);await page.locator('[data-discussion-link]').click();child=await frame();await child.locator('#post-older-post:visible').waitFor();assert.equal(await child.evaluate(()=>document.activeElement.id),'post-older-post');}
 await reader(page);let requests=0;await context.route('https://rest.api.bible/**',r=>{requests++;return r.abort()});await page.evaluate(()=>document.querySelector('#mainStageSecondaryNav [id="scriptureNextBtn"]').click());await page.waitForTimeout(100);assert.equal(requests,0);
});
for(const kind of ['http','non-json','network'])test('API '+kind+' error leaves an announced recoverable reader',async t=>{
 const {page,context}=await harness(t,{production:true,unification:true,route});let fail=true;await context.route('https://rest.api.bible/**',r=>!fail?r.fulfill({contentType:'application/json',body:JSON.stringify({data:{reference:'John 1',content:'<p data-number="5">Recovered fixture</p>'}})}):kind==='network'?r.abort('failed'):r.fulfill({status:kind==='http'?503:200,contentType:kind==='http'?'application/json':'text/plain',body:kind==='http'?JSON.stringify({message:'Temporarily unavailable'}):'NOT JSON'}));
 await page.evaluate(()=>{void HGRoute.navigate('scriptureapi',{ref:'John 1:5',version:'NASB',week:12})});await page.locator('#scriptureContent[aria-busy="false"]').waitFor();await page.locator('#scriptureContent [role="alert"]').waitFor();assert.equal(await page.locator('#scriptureSearch').isVisible(),true);fail=false;await page.locator('#loadedCardHost').getByRole('button',{name:'Go',exact:true}).click();await page.locator('#scriptureRendered').waitFor();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();assert.match(await page.locator('#scriptureContent').innerText(),/Recovered fixture/);
});

test('narrow portrait and landscape keep the reader and Fellowship menu usable with reduced motion preference',async t=>{
 const {page,frame}=await harness(t,{production:true,unification:true,mobile:true,route});const origin=await frame();await origin.locator('#post-older-post:visible').waitFor();await page.emulateMedia({reducedMotion:'reduce'});await reader(page);
 for(const preset of ['cosmic','parchment','diagnostic']){await page.evaluate(p=>{document.documentElement.removeAttribute('data-hg-theme-diagnostic');document.documentElement.removeAttribute('data-hg-theme-preset');if(p==='diagnostic')document.documentElement.setAttribute('data-hg-theme-diagnostic','on');else if(p==='parchment')document.documentElement.setAttribute('data-hg-theme-preset',p)},preset);assert.equal(await page.locator('#scriptureSearch').evaluate(el=>{const probe=document.createElement('span');probe.style.color='var(--text)';document.body.append(probe);const expected=getComputedStyle(probe).color;probe.remove();return getComputedStyle(el).color===expected&&el.getBoundingClientRect().height>=44}),true);}

 for(const viewport of [{width:320,height:568},{width:844,height:390}]){await page.setViewportSize(viewport);assert.equal(await page.locator('#scriptureSearch').isVisible(),true);assert.equal(await page.locator('#loadedCardHost').getByRole('button',{name:'Go',exact:true}).isVisible(),true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await page.locator('[data-discussion-link]').click();const child=await frame();await child.locator('#post-older-post:visible').waitFor();await page.locator('.fellowship-menu summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.fellowship-menu').evaluate(el=>el.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('.fellowship-menu').evaluate(el=>el.open),false);assert.equal(await page.locator('.fellowship-menu summary').evaluate(el=>document.activeElement===el),true);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
