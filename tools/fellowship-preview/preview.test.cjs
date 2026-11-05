const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
const {createPreviewServer}=require('./server.cjs');
const ROOT=path.resolve(__dirname,'../..');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(ROOT,'tests/commons-security'),__dirname]}));
async function server(t){const service=createPreviewServer();await new Promise(resolve=>service.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{service.closeAllConnections();service.close(resolve)}));return 'http://127.0.0.1:'+service.address().port;}
test('loopback preview denies arbitrary files/writes and replaces historical data and Firebase',async t=>{
 const origin=await server(t);
 for(const name of ['/firebase.json','/firestore.rules','/.git/config','/tools/fellowship-preview/server.cjs','/data/week12.json','/js/unknown.js'])assert.equal((await fetch(origin+name)).status,404);
 assert.equal((await fetch(origin+'/',{method:'POST',body:'blocked'})).status,405);
 assert.equal(await new Promise((resolve,reject)=>{const req=require('node:http').get(origin+'/',{headers:{Host:'attacker.invalid'}},res=>{res.resume();resolve(res.statusCode)});req.on('error',reject);}),403);
 for(const name of ['/HomeGroupsMap.geojson','/data/HomeGroupsMap.geojson']){const response=await fetch(origin+name),data=await response.json();assert.equal(data.features.length,1);assert.match(data.features[0].properties.Name,/Demo/);assert.match(response.headers.get('content-security-policy'),/connect-src 'self'/);assert.equal(response.headers.get('permissions-policy'),'geolocation=(), camera=(), microphone=()');}
 const init=await(await fetch(origin+'/js/firebase-init.js')).text();assert.match(init,/fixture-sdk/);assert.doesNotMatch(init,/apiKey|homegroups-app/);
 const js=await(await fetch(origin+'/js/prayermap.js')).text();assert.doesNotMatch(js,/www.gstatic.com/);assert.match(js,/__preview__\/fixture-sdk.js/);
});
test('desktop/mobile preview: four real views, themes, synthetic workflows and no external requests',async t=>{
 const origin=await server(t),browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH?{executablePath:process.env.BROWSER_PATH}:process.platform==='win32'?{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});t.after(()=>browser.close());
 const artifacts=process.env.HG_PREVIEW_OUTPUT_DIR;if(artifacts)await fs.mkdir(artifacts,{recursive:true});
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:1000}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});const page=await context.newPage(),errors=[],external=[];
  page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
  await page.goto(origin+'/?card=fellowship&view=prayer&week=12');await page.locator('.preview-pin').first().waitFor();
  for(const theme of ['cosmic','parchment']){
   await page.locator('#previewTheme').selectOption(theme);
   for(const [view,label]of [['prayer','Prayer Map'],['communities','My Communities'],['explore','Explore'],['messages','Messages']]){
    console.log('PREVIEW',mobile?'mobile':'desktop',theme,view);
    await page.getByRole('button',{name:label,exact:true}).click();
    if(view==='prayer')await page.locator('.preview-pin').first().waitFor();
    else{await page.waitForFunction(()=>document.querySelector('.fellowship iframe')?.contentDocument?.querySelector('link[href="/css/fellowship-embedded.css"]'));const child=page.frames().find(frame=>frame!==page.mainFrame());if(view==='messages'){await child.locator('.conversation').filter({hasText:'Private conversation'}).first().click();await child.locator('#composer:not([hidden])').waitFor();assert.equal(await child.locator('.top').evaluate(el=>getComputedStyle(el).display),'none');assert.equal(await child.locator('.chat-body').evaluate(el=>getComputedStyle(el).backgroundImage),'none');}else await child.locator('[data-enroll]:enabled:visible').first().waitFor();}
    await page.waitForFunction(()=>{const card=document.querySelector('.fellowship').getBoundingClientRect();return card.left>=0&&card.left<50;}).catch(async error=>{console.log('POSITION',await page.evaluate(()=>({card:document.querySelector('.fellowship').getBoundingClientRect().toJSON(),scroll:document.getElementById('cardsRow').scrollLeft,viewport:innerWidth})));throw error;});
    assert.equal(await page.locator('.fellowship').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
    if(artifacts)await page.screenshot({path:path.join(artifacts,(mobile?'mobile':'desktop')+'-'+(theme==='cosmic'?'dark':'light')+'-'+view+'.png')});
   }
  }
  await page.getByRole('button',{name:'Explore',exact:true}).click();let child=await frame(page);await child.locator('[data-enroll="projects"]:enabled').waitFor();await child.locator('[data-enroll="projects"]').click();await child.locator('#enrollmentStatus').filter({hasText:'Joined projects successfully'}).waitFor();
  await page.getByRole('button',{name:'My Communities',exact:true}).click();child=await frame(page);await child.locator('[data-enroll="projects"]:enabled').waitFor();assert.equal(await child.locator('#directory article:visible').count(),3);
  await child.locator('article').filter({has:child.locator('[data-enroll="study"]')}).getByRole('link',{name:'Community conversation'}).click();await page.waitForURL(/section=discussion/);child=await frame(page);await child.locator('#discussionIndex a').first().click();await child.locator('#posts article:visible').waitFor();await child.locator('#posts article:visible').getByText('Replies',{exact:false}).first().click();await child.getByText('Let us encourage one another. Synthetic preview reply.',{exact:true}).waitFor();
  await child.getByRole('button',{name:'Message privately',exact:false}).first().click();await page.waitForURL(/view=messages/);child=await frame(page);await child.locator('#composer:not([hidden])').waitFor();await child.locator('#messageInput').fill('Synthetic local preview only');await child.locator('#composer button').click();await child.locator('.bubble').filter({hasText:'Synthetic local preview only'}).waitFor();
  await page.locator('#previewAccount').selectOption('guest');child=await frame(page);await child.locator('#notice').filter({hasText:'Sign in through HomeGroups first'}).waitFor();assert.equal(await child.locator('#composer').isVisible(),false);
  assert.match(page.url(),/week=12/);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();
 }
});
async function frame(page){await page.waitForFunction(()=>document.querySelector('.fellowship iframe')?.contentDocument?.querySelector('link[href="/css/fellowship-embedded.css"]'));return page.frames().find(frame=>frame!==page.mainFrame());}
