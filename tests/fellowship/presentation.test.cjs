const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {harness}=require('./harness.cjs');
async function choose(page,label){
 await page.locator('.fellowship-menu summary').click();
 await page.getByRole('button',{name:label,exact:true}).click();
 if(label!=='Return to Bible Study')assert.equal(await page.locator('.fellowship-menu').evaluate(el=>el.open),false);
}
for(const mobile of [false,true])test('map-first live presentation and existing destinations '+(mobile?'mobile':'desktop'),async t=>{
 const {page,frame,context}=await harness(t,{production:true,mobile,route:'?card=fellowship-live&week=12'});
 await page.locator('#prayerMap').waitFor();await page.waitForFunction(()=>__fixture.maps>0);
 assert.equal(await page.locator('.fellowship-test-fixtures').count(),0);
 assert.equal(await page.locator('#weekCardDock').isVisible(),false);
 assert.equal(await page.locator('.fellowship-menu').evaluate(el=>el.open),false);
 assert.equal(await page.locator('.fellowship-actions,.fellowship-tabs').count(),0);
 assert.equal(await page.locator('.fellowship header').getByRole('button').count(),0);
 assert.ok((await page.locator('#prayerMap').boundingBox()).height>=page.viewportSize().height*.6);
 assert.equal(await page.locator('#prayerMapLocateBtn').isEnabled(),true);
 assert.equal(await page.locator('#prayerMapAddBtn').isDisabled(),true,'existing pilot map restriction remains');
 assert.equal(await page.locator('.fellowship').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
 await page.locator('.fellowship-menu summary').click();
 assert.equal(await page.locator('.fellowship-menu nav button:visible').count(),8);
 const panel=await page.locator('.fellowship-menu nav').boundingBox();
 assert.ok(panel.x>=0&&panel.x+panel.width<=page.viewportSize().width+1,'menu stays within viewport');
 await page.locator('.fellowship-menu summary').press('Escape');
 assert.equal(await page.locator('.fellowship-menu').evaluate(el=>el.open),false);
 for(const [label,url,selector] of [
  ['My Communities','directory','#directory'],['Explore Communities','directory','#directory'],
  ['Messages','direct-live','#layout'],['Find People','find-users','#results'],
  ['My Profile','member','#displayName'],['Account / Sign In','auth','#account']]){
  if(label==='Find People')await context.route('**/HomeGroupsMap.geojson',r=>r.fulfill({contentType:'application/json',body:'{"features":[]}'}));
  await choose(page,label);const child=await frame();await child.locator(selector).waitFor();
  assert.ok(child.url().includes(url));assert.equal(await page.locator('#weekCardDock').isVisible(),false);
  if(label==='My Communities')await child.locator('[data-enroll="study"]:enabled').waitFor();
 }
 // The existing discussions and recipient bridge remain accessible from the menu's communities view.
 await choose(page,'My Communities');let child=await frame();await child.locator('[data-enroll="study"]:enabled').waitFor();
 await child.locator('article').filter({has:child.locator('[data-enroll="study"]')}).getByRole('link',{name:'Community conversation'}).click();
 child=await frame();await child.locator('#discussionIndex a').click();await child.locator('#posts article:visible').waitFor();
 await child.getByRole('button',{name:'Message privately',exact:false}).first().click();
 await page.waitForURL(/view=messages/);child=await frame();assert.ok(child.url().includes('to=bob1234567890123'));
 await choose(page,'Prayer Map');await page.locator('#prayerMap').waitFor();
 for(const preset of ['cosmic','parchment']){
  await page.evaluate(p=>{document.documentElement.setAttribute('data-hg-theme-diagnostic','true');document.documentElement.setAttribute('data-hg-theme-preset',p)},preset);
  if(process.env.ARTIFACT_DIR){await fs.mkdir(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ARTIFACT_DIR,(mobile?'mobile':'desktop')+'-map-'+preset+'.png')});}
 }
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);assert.equal(await page.evaluate(()=>__fixture.authCalls.length),0);
 await choose(page,'Return to Bible Study');
 await page.waitForFunction(()=>new URL(location.href).searchParams.get('card')==='mainstage');
 assert.equal(await page.locator('#weekCardDock').isVisible(),true);
 assert.equal(await page.locator('#weekSelect').inputValue(),'12');
 await page.evaluate(()=>window.loadCard('prayermap'));await page.waitForFunction(()=>!!window.currentMap);assert.equal(await page.locator('#prayerMap').count(),1);
 assert.equal(await page.locator('#weekCardDock').isVisible(),true,'ordinary Prayer Map keeps week controls');
});
test('denied live screen hides week controls and restores their previous state on exit',async t=>{
 const {page}=await harness(t,{production:true,mobile:true,liveEnabled:false,expectUnavailable:true,route:'?card=fellowship-live&week=12'});
 assert.equal(await page.locator('#weekCardDock').isVisible(),false);
 assert.equal(await page.locator('.fellowship-menu').count(),0);
 await page.getByRole('button',{name:'Return to study',exact:true}).click();
 await page.waitForFunction(()=>new URL(location.href).searchParams.get('card')==='mainstage');
 assert.equal(await page.locator('#weekCardDock').isVisible(),true);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
