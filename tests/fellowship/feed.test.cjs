const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {harness}=require('./harness.cjs');
const member=(area,uid='alice')=>'commonsCommunityMembers/'+area+'/members/'+uid;
const route='?card=fellowship-live&week=12';
const record=(area,id,time,body)=>({area,id,time:1794090000000+time,body});
const basic={members:[member('study'),member('prayer')],records:[record('study','study-new',3000,'What encouraged you in John 1:5?'),record('prayer','prayer-middle',2000,'Praying for our community this week.'),record('study','study-old',1000,'Let us encourage one another.'),record('family','PRIVATE',4000,'Must not be fetched')]};
async function menu(page,label){const control=page.locator('.fellowship-menu');if(!await control.evaluate(el=>el.open))await control.locator('summary').click();await page.getByRole('button',{name:label,exact:true}).click();}
async function ready(page,count){await page.waitForFunction(n=>document.querySelectorAll('.fellowship-feed article').length===n,count);}
async function shot(page,name){
 await page.waitForFunction(()=>{const row=document.getElementById('cardsRow'),card=document.querySelector('.fellowship')?.closest('.card');return row&&card&&Math.abs(row.scrollLeft-Math.min(card.offsetLeft,row.scrollWidth-row.clientWidth))<1;});
 if(process.env.ARTIFACT_DIR){await fs.mkdir(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ARTIFACT_DIR,name+'.png'),animations:'disabled'});}
}

for(const mobile of [false,true])test('default live feed merges authorized communities; compact themed layout '+(mobile?'mobile':'desktop'),async t=>{
 const {page}=await harness(t,{production:true,mobile,route,feed:basic});await ready(page,3);
 assert.deepEqual(await page.locator('.fellowship-feed article .fellowship-feed-body').allTextContents(),['study-new\nWhat encouraged you in John 1:5?','prayer-middle\nPraying for our community this week.','study-old\nLet us encourage one another.']);
 assert.equal(await page.locator('#prayerMap,.fellowship iframe').count(),0);assert.equal(await page.locator('#weekCardDock').isVisible(),false);assert.equal(await page.locator('.fellowship-menu').evaluate(el=>el.open),false);
 assert.equal(await page.getByRole('button',{name:'Create post',exact:true}).count(),1);
 assert.equal(await page.locator('.fellowship-post-author').first().textContent(),'Test B');assert.equal(await page.locator('.fellowship-post-community').first().textContent(),'Bible Study & Investigation');
 assert.equal(await page.locator('.fellowship-feed time').count(),3);
 assert.ok((await page.evaluate(()=>__fixture.feedReads)).every(x=>['study','prayer'].includes(x.path.split('/')[1])));
 assert.equal(await page.locator('.fellowship').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
 await shot(page,'feed-'+(mobile?'mobile':'desktop')+'-dark');
 const bounds=await page.locator('.fellowship').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=page.viewportSize().width+1,'settled card fits viewport');
 await page.evaluate(()=>document.documentElement.setAttribute('data-hg-theme-preset','parchment'));await shot(page,'feed-'+(mobile?'mobile':'desktop')+'-light');
 assert.equal(await page.locator('.fellowship-feed article').first().evaluate(el=>getComputedStyle(el).color),await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--text').trim()).then(value=>page.evaluate(value=>{const probe=document.createElement('span');probe.style.color=value;document.body.append(probe);const result=getComputedStyle(probe).color;probe.remove();return result;},value)));
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});

test('chronological pagination merges source boundaries without duplicates or omissions',async t=>{
 const records=Array.from({length:76},(_,i)=>record(i%2?'study':'prayer','post-'+String(i).padStart(3,'0'),100000-i));
 const {page}=await harness(t,{production:true,route,feed:{members:basic.members,records}});await ready(page,30);
 await page.getByRole('button',{name:'Load older posts'}).click();await ready(page,60);await page.getByRole('button',{name:'Load older posts'}).click();await ready(page,76);
 assert.deepEqual(await page.locator('.fellowship-feed-body').allTextContents(),records.map(x=>x.id+'\nSynthetic community post'));
 assert.equal(await page.getByRole('button',{name:'Load older posts'}).isVisible(),false);
 assert.ok((await page.evaluate(()=>__fixture.feedReads)).some(x=>x.constraints.some(c=>c.kind==='startAfter')));
});

for(const joined of [false,true])test(joined?'joined empty community':'no memberships: no post queries',async t=>{
 const {page}=await harness(t,{production:true,route,feed:{members:joined?[member('study')]:[],records:[]}});
 await page.getByText(joined?'No posts yet.':'You haven’t joined any communities yet.',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Create post'}).isEnabled(),joined);
 if(!joined)assert.equal(await page.evaluate(()=>(__fixture.feedReads||[]).length),0);
});

for(const failure of ['denyMembership','denyArea','cached'])test('unverified membership/authorization fails closed: '+failure,async t=>{
 const feed={...basic,[failure]:failure==='denyArea'?'study':true};const {page}=await harness(t,{production:true,route,feed});
 await page.getByText(failure==='cached'?'Connect to verify your communities.':'Community access could not be verified.',{exact:true}).waitFor();
 assert.equal(await page.locator('.fellowship-feed article').count(),0);assert.equal(await page.getByRole('button',{name:'Create post'}).isDisabled(),true);
 if(failure!=='denyArea')assert.equal(await page.evaluate(()=>(__fixture.feedReads||[]).length),0);
 if(failure!=='cached'){
  await page.evaluate(()=>{__fixture.feed.denyMembership=false;__fixture.feed.denyArea=null;});await page.getByRole('button',{name:'Try again',exact:true}).click();await ready(page,3);
 }
});

test('membership revocation removes the old preview and queries only remaining memberships',async t=>{
 const {page}=await harness(t,{production:true,route,feed:basic});await ready(page,3);
 await page.evaluate(()=>{const p='commonsCommunityMembers/study/members/alice';__fixture.members.delete(p);__fixture.feedReads=[];for(const rec of __fixture.snaps)if(rec.path===p)rec.cb({exists:()=>false,metadata:{fromCache:false}});});
 await ready(page,1);assert.doesNotMatch(await page.locator('.fellowship-feed').innerText(),/study-new|study-old/);
 assert.ok((await page.evaluate(()=>__fixture.feedReads)).every(x=>x.path.includes('/prayer/')));
});

test('delayed reads cannot cross A-B-A or revive a disposed feed',async t=>{
 const {page}=await harness(t,{production:true,route,feed:{...basic,hold:true}});await page.waitForFunction(()=>__fixture.feedReleases?.length>0);
 await page.evaluate(()=>{__fixture.feed.hold=false;__switchUser('bob');__switchUser('alice');});await ready(page,3);
 await page.evaluate(()=>{__fixture.feed.records=[];for(const release of __fixture.feedReleases)release();});
 await page.waitForTimeout(100);assert.equal(await page.locator('.fellowship-feed article').count(),3);
 await menu(page,'Messages');await page.locator('.fellowship iframe').waitFor();assert.equal(await page.locator('.fellowship-feed').count(),0);
 assert.equal(await page.evaluate(()=>[...__fixture.snaps].filter(s=>s.path.startsWith('commonsCommunityMembers/')).length),0);
 await page.evaluate(()=>loadCard('mainstage'));assert.equal(await page.locator('.fellowship').count(),0);
});

test('account switching clears feed and selector choices; listener counts do not accumulate',async t=>{
 const {page}=await harness(t,{production:true,route,feed:basic});await ready(page,3);
 for(let i=0;i<2;i++){
  await page.evaluate(()=>__switchUser('bob'));await page.getByText('You haven’t joined any communities yet.',{exact:true}).waitFor();
  assert.equal(await page.locator('.fellowship-feed article').count(),0);assert.equal(await page.locator('#fellowship-post-community option').count(),0);
  await page.evaluate(()=>__switchUser('alice'));await ready(page,3);
  assert.equal(await page.evaluate(()=>[...__fixture.snaps].filter(s=>s.path.startsWith('commonsCommunityMembers/')).length),6);
 }
 await page.evaluate(()=>__switchUser(null));await page.getByText('Live Fellowship is not enabled for this account.',{exact:true}).waitFor();assert.equal(await page.locator('.fellowship-feed').count(),0);
});

test('post selection uses existing composer/replies and restores feed position',async t=>{
 const records=Array.from({length:40},(_,i)=>record('study','post-'+String(i).padStart(3,'0'),100000-i));
 const {page,frame}=await harness(t,{production:true,route,feed:{members:[member('study')],records}});await ready(page,30);
 await page.getByRole('button',{name:'Load older posts'}).click();await ready(page,40);
 const link=page.locator('.fellowship-feed article').nth(35).getByRole('link',{name:'Open discussion'});await link.scrollIntoViewIfNeeded();
 const before=await page.locator('.fellowship').evaluate(el=>({card:el.closest('.card').scrollTop,window:window.scrollY}));await link.click();let child=await frame();
 await child.locator('#post-post-035:visible').waitFor();assert.match(page.url(),/view=home.*section=discussion/);
 await child.locator('#post-post-035 details').locator('summary').click();await child.locator('#post-post-035 .replyform textarea').fill('Synthetic reply');await child.locator('#post-post-035 .replyform button').click();
 await page.waitForFunction(()=>__fixture.writes.some(x=>x.path.endsWith('/post-035/replies')));
 await page.getByRole('button',{name:'Back to feed',exact:true}).click();await ready(page,40);await page.waitForTimeout(100);
 const after=await page.locator('.fellowship').evaluate(el=>({card:el.closest('.card').scrollTop,window:window.scrollY}));assert.ok(Math.abs(after.card-before.card)<40,JSON.stringify({before,after}));
 await page.getByRole('button',{name:'Create post',exact:true}).click();assert.deepEqual(await page.locator('#fellowship-post-community option').allTextContents(),['Bible Study & Investigation']);
 await page.getByRole('button',{name:'Continue',exact:true}).click();child=await frame();await child.locator('#compose:visible').waitFor();
 await child.locator('#discussionTitle').fill('Synthetic feed post');await child.locator('#message').fill('Synthetic test only');await child.getByRole('button',{name:'Post message',exact:true}).click();
 await page.waitForFunction(()=>__fixture.writes.some(x=>x.path==='commonsCommunityPosts/study/posts'));
 assert.equal(await page.evaluate(()=>__fixture.writes.filter(x=>x.path==='commonsCommunityPosts/study/posts').length),1);
});

test('Prayer Map and all existing menu destinations remain available from the feed',async t=>{
 const {page,frame,context}=await harness(t,{production:true,route,feed:basic});await ready(page,3);
 await menu(page,'Prayer Map');await page.locator('#prayerMap').waitFor();assert.equal(await page.locator('#prayerMapAddBtn').isDisabled(),true);
 for(const [label,selector]of [['My Communities','#directory'],['Explore Communities','#directory'],['Messages','#layout'],['My Profile','#profile'],['Account / Sign In','#guest'],['Find People','#results']]){
  if(label==='Find People')await context.route('**/HomeGroupsMap.geojson',r=>r.fulfill({contentType:'application/json',body:'{"features":[]}'}));
  await menu(page,label);const child=await frame();await child.locator(selector).waitFor({state:'attached'});
 }
 await menu(page,'Home feed');await ready(page,3);await menu(page,'Return to Bible Study');await page.waitForURL(/card=mainstage/);assert.match(page.url(),/week=12/);
});

test('new post targets the selected joined community through the existing composer',async t=>{
 const {page,frame}=await harness(t,{production:true,route,feed:basic});await ready(page,3);
 await page.getByRole('button',{name:'Create post',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Create post',exact:true}).getAttribute('aria-expanded'),'true');
 assert.deepEqual((await page.locator('#fellowship-post-community option').evaluateAll(options=>options.map(x=>x.value))).sort(),['prayer','study']);
 await page.locator('#fellowship-post-community').selectOption('prayer');await page.getByRole('button',{name:'Continue',exact:true}).click();
 const child=await frame();await child.locator('#compose:visible').waitFor();assert.equal(await child.locator('#area').inputValue(),'prayer');
 await child.locator('#discussionTitle').fill('Synthetic selected-community post');await child.locator('#message').fill('Local test only');await child.getByRole('button',{name:'Post message',exact:true}).click();
 await page.waitForFunction(()=>__fixture.writes.some(x=>x.path==='commonsCommunityPosts/prayer/posts'));assert.equal(await page.evaluate(()=>__fixture.writes.length),1);
});

test('Scripture association and browser Back return to the home discussion and feed',async t=>{
 const body='Light shines in the darkness.\nReading: http://fellowship.test/?card=scriptureapi&ref=John%201%3A5&version=NASB';
 const {page,frame}=await harness(t,{production:true,unification:true,route,feed:{members:[member('study')],records:[record('study','scripture-post',1000,body)]}});await ready(page,1);
 await page.getByRole('link',{name:'Open discussion',exact:true}).click();let child=await frame();await child.locator('#post-scripture-post:visible').waitFor();
 await page.goBack();await ready(page,1);await page.goForward();child=await frame();await child.locator('#post-scripture-post:visible').waitFor();
 await child.getByRole('link',{name:'Read John 1:5',exact:true}).click();await page.locator('#scriptureContent[aria-busy="false"]').waitFor();
 await page.locator('[data-discussion-link]').click();child=await frame();await child.locator('#post-scripture-post:visible').waitFor();assert.match(page.url(),/view=home/);
 await page.getByRole('button',{name:'Back to feed',exact:true}).click();await ready(page,1);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});

test('a disposed composer cannot restore focus or issue writes after a delayed profile read',async t=>{
 const {page,frame}=await harness(t,{production:true,route,feed:basic});await ready(page,3);
 await page.getByRole('button',{name:'Create post',exact:true}).click();await page.evaluate(()=>__fixture.holdProfile=true);
 await page.getByRole('button',{name:'Continue',exact:true}).click();await frame();await page.waitForFunction(()=>typeof __fixture.releaseProfile==='function');
 await menu(page,'Home feed');await ready(page,3);await page.getByRole('button',{name:'Create post',exact:true}).focus();
 await page.evaluate(()=>{__fixture.holdProfile=false;__fixture.releaseProfile();});await page.waitForTimeout(100);
 assert.equal(await page.getByRole('button',{name:'Create post',exact:true}).evaluate(el=>document.activeElement===el),true);
 assert.equal(await page.locator('.fellowship iframe').count(),0);assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});

test('a delayed feed import cannot replace a newer Prayer Map view',async t=>{
 const {page,context}=await harness(t,{production:true,route:route+'&view=prayer',feed:basic});await page.locator('#prayerMap').waitFor();
 let release,started;const held=new Promise(r=>release=r),requested=new Promise(r=>started=r);
 const source=await fs.readFile(path.join(__dirname,'../../js/fellowship-feed.js'),'utf8');
 await context.route('**/js/fellowship-feed.js',async request=>{started();await held;await request.fulfill({body:source,contentType:'text/javascript'});});
 await menu(page,'Home feed');await requested;await menu(page,'Prayer Map');await page.locator('#prayerMap').waitFor();release();await page.waitForTimeout(100);
 assert.equal(await page.locator('.fellowship-feed').count(),0);assert.equal(await page.evaluate(()=>(__fixture.feedReads||[]).length),0);
});
