const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path');
const {harness}=require('./harness.cjs');
const member=area=>'commonsCommunityMembers/'+area+'/members/alice';
const feed={members:[member('study'),member('prayer'),member('fellowship')],records:[
 {area:'study',id:'light',time:1794090000000,authorName:'Mara Ellis',title:'Where have you seen the light this week?',body:'I keep coming back to John 1:5. Even a small act of kindness can feel like light breaking through.\n\nWhat has encouraged you lately?'},
 {area:'prayer',id:'table',time:1794086400000,authorName:'Jonah Reed',title:'A place at the table',body:'Praying today for anyone who feels far from community. May you find a listening ear, an open door, and a place to belong.'},
 {area:'fellowship',id:'ordinary',time:1794082800000,authorName:'Elena Brooks',title:'Faithfulness in ordinary things',body:'A shared meal. A walk with a neighbor. Checking in on someone. Grateful for the quiet ways we can care for one another.'}
]};
async function menu(page,label){const control=page.locator('.fellowship-menu');if(!await control.evaluate(el=>el.open))await control.locator('summary').click();await page.getByRole('button',{name:label,exact:true}).click();}
async function settled(page){await page.waitForFunction(()=>{const row=document.getElementById('cardsRow'),card=document.querySelector('.fellowship')?.closest('.card');return row&&card&&Math.abs(row.scrollLeft-Math.min(card.offsetLeft,row.scrollWidth-row.clientWidth))<1;});}
async function contrast(page){return page.evaluate(()=>{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
 const rgb=value=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3);};
 const lum=color=>rgb(color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const article=document.querySelector('.fellowship-post'),paper=getComputedStyle(article).backgroundColor;
 const result={};for(const [name,selector]of Object.entries({author:'.fellowship-post-author',community:'.fellowship-post-community',date:'.fellowship-post-byline time',title:'.fellowship-feed-body h3',body:'.fellowship-feed-body p',discussion:'.fellowship-feed a'}))result[name]=ratio(getComputedStyle(document.querySelector(selector)).color,paper);
 const button=getComputedStyle(document.querySelector('.fellowship-feed-create'));result.create=ratio(button.color,button.backgroundColor);return result;
});}
for(const mobile of [false,true])test('feed editorial hierarchy, contrast and screenshots '+(mobile?'mobile':'desktop'),async t=>{
 const {page}=await harness(t,{production:true,mobile,route:'?card=fellowship-live&week=12',feed});await page.locator('.fellowship-post').nth(2).waitFor();await settled(page);
 let darkPaper;
 for(const theme of ['cosmic','parchment']){
  await page.evaluate(theme=>{document.documentElement.removeAttribute('data-hg-theme-diagnostic');document.documentElement.setAttribute('data-hg-theme-preset',theme);},theme);
  const ratios=await contrast(page);console.log((mobile?'mobile':'desktop')+' '+theme+' minimum sampled contrast '+Math.min(...Object.values(ratios)).toFixed(2));for(const [name,value]of Object.entries(ratios))assert.ok(value>=4.5,theme+' '+name+' contrast '+value);
  await page.getByRole('button',{name:'Create post',exact:true}).hover();assert.ok((await contrast(page)).create>=4.5,'hover keeps posting action readable');await page.mouse.move(0,0);
  const paper=await page.locator('.fellowship-post').first().evaluate(el=>getComputedStyle(el).backgroundColor);if(theme==='cosmic')darkPaper=paper;else assert.notEqual(paper,darkPaper,'surface follows light/dark theme');
  assert.equal(await page.locator('.fellowship').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  const first=page.locator('.fellowship-post').first();assert.equal(await first.locator('h3').textContent(),feed.records[0].title);assert.equal(await first.locator('.fellowship-post-author').textContent(),'Mara Ellis');assert.equal(await first.locator('[aria-hidden=true]').first().textContent(),'ME');
  assert.equal(await page.getByRole('button',{name:'Create post',exact:true}).count(),1);assert.equal(await page.getByRole('link',{name:'Open discussion',exact:true}).count(),3);
  if(process.env.ARTIFACT_DIR){await fs.mkdir(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ARTIFACT_DIR,'creative-feed-'+(mobile?'mobile':'desktop')+'-'+(theme==='cosmic'?'dark':'light')+'.png'),animations:'disabled'});}
 }
 await page.keyboard.press('Tab');await page.getByRole('button',{name:'Create post',exact:true}).focus();assert.ok(await page.getByRole('button',{name:'Create post',exact:true}).evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth)>=2));
 await page.getByRole('button',{name:'Create post',exact:true}).click();assert.equal(await page.locator('#fellowship-post-picker').isVisible(),true);assert.equal(await page.locator('#fellowship-post-community option').count(),3);
 await menu(page,'Prayer Map');await page.locator('#prayerMap').waitFor();assert.equal(await page.locator('.fellowship-feed-home').count(),0,'feed styles are disposed before another view');
 await menu(page,'Home feed');await page.locator('.fellowship-post').nth(2).waitFor();
 await page.evaluate(()=>{document.documentElement.removeAttribute('data-hg-theme-preset');document.documentElement.setAttribute('data-hg-theme-diagnostic','on');});
 assert.equal(await page.locator('.fellowship-post-author').first().evaluate(el=>getComputedStyle(el).color),'rgb(16, 16, 16)','diagnostic text token remains inherited');
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);assert.equal(await page.locator('.fellowship-feed img').count(),0);
});
test('long and legacy content stays readable, literal and accessible at 320px',async t=>{
 const record={area:'study',id:'legacy',time:1794090000000,legacy:true,authorName:'Élodie '+('Longname '.repeat(8)),body:'<img src=x onerror=alert(1)>\n'+('LongWord'.repeat(40))};
 const {page}=await harness(t,{production:true,mobile:true,route:'?card=fellowship-live&week=12',feed:{members:[member('study')],records:[record]}});await page.setViewportSize({width:320,height:844});await page.locator('.fellowship-post').waitFor();await settled(page);
 assert.equal(await page.locator('.fellowship-feed-body').textContent(),record.body);assert.equal(await page.locator('.fellowship-feed img,.fellowship-feed-body h3').count(),0);
 assert.equal(await page.locator('.fellowship-post-author').textContent(),record.authorName);assert.equal(await page.locator('.fellowship').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
 await page.getByRole('button',{name:'Create post',exact:true}).click();assert.equal(await page.locator('#fellowship-post-picker').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
});
