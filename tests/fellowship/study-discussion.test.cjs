const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness}=require('./harness.cjs');

test('stable study links resolve and legacy links retain their original study', async () => {
 const {discussionReading,studyReadingUrl,weekForStudy}=await import('../../js/study-reference.js');
 const root=new URL('https://homegroups.org/');
 const study=studyReadingUrl(root,3);
 assert.equal(study.searchParams.get('study'),'lech-lecha');
 assert.equal(weekForStudy(study.searchParams.get('study')),3);
 assert.equal(discussionReading('Reading: https://homegroups.org/?card=mainstage&week=3',root).href,study.href);
 assert.equal(discussionReading('Reading: https://homegroups.org/?card=mainstage&study=missing&week=3',root),null);
 assert.equal(discussionReading('Reading: https://other.example/?card=mainstage&week=3',root),null);
 assert.equal(discussionReading('General discussion',root),null);
});

test('Main Stage exposes the discussion action and opens the selected pilot week', async t => {
 const {page}=await harness(t,{production:true,route:'?card=mainstage',mobile:true});
 const discuss=page.getByRole('button',{name:'Discuss This Week',exact:true});
 const read=page.getByRole('button',{name:'Read This Week’s Scripture',exact:true});
 await read.waitFor();
 assert.equal(await discuss.evaluate(el=>el.previousElementSibling.id),'mainStageReadWeek');
 await discuss.click();
 await page.getByRole('status').filter({hasText:'No linked discussion is available'}).waitFor();
 await page.locator('#weekSelect').evaluate(el=>{el.value='3';el.dispatchEvent(new Event('change'));});
 await discuss.click();
 const child=page.frameLocator('#hg-commons-window iframe');
 await child.locator('#context-label').filter({hasText:'Week 3'}).waitFor();
 await child.getByText('No matching conversations in the posts loaded so far.',{exact:false}).waitFor();
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});

test('populated mobile companion opens the right discussion on first click and after a week switch', async t => {
 const records=[
  {id:'genesis',area:'study',title:'Creation discussion',time:2,body:'Creation and rest\nReading: http://fellowship.test/?card=mainstage&week=1'},
  {id:'abram',area:'study',title:'Abram discussion',time:1,body:'Leaving home\nReading: http://fellowship.test/?card=mainstage&study=lech-lecha'}
 ];
 const {page}=await harness(t,{production:true,route:'?card=mainstage',mobile:true,feed:{records}});
 const choose=week=>page.locator('#weekSelect').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change'));},week);
 const discuss=page.getByRole('button',{name:'Discuss This Week',exact:true});
 const child=page.frameLocator('#hg-commons-window iframe');
 await choose('1');
 await discuss.click();
 await child.getByRole('button',{name:/Creation discussion/}).click();
 await child.getByRole('heading',{name:'Creation discussion'}).waitFor();
 await page.getByRole('button',{name:'Close companion',exact:true}).click();
 await choose('3');
 await discuss.click();
 await child.getByRole('button',{name:/Abram discussion/}).click();
 assert.equal(await child.getByRole('heading',{name:'Creation discussion'}).count(),0);
 const link=child.getByRole('link',{name:'Open the original study'});
 assert.match(await link.getAttribute('href'),/study=lech-lecha$/);
 const reply=child.getByRole('textbox',{name:/Reply as/});
 await reply.fill('Synthetic reply');
 await child.getByRole('button',{name:'Post reply',exact:true}).click();
 await child.getByText('Reply saved to Messaging.').waitFor();
 assert.equal(await page.evaluate(()=>__fixture.writes[0].path),'commonsCommunityPosts/study/posts/abram/replies');
 await link.click();
 await page.waitForURL(/card=mainstage&study=lech-lecha/);
});

test('community board opens the same study association', async t => {
 const {frame,page}=await harness(t,{production:true,route:'?card=fellowship-live&view=communities&section=discussion&area=study&post=abram&week=3',feed:{records:[
  {id:'abram',area:'study',title:'Abram discussion',time:1,body:'Leaving home\nReading: http://fellowship.test/?card=mainstage&study=lech-lecha'}
 ]}});
 const child=await frame();
 await child.locator('#post-abram').getByRole('link',{name:'Open the original study'}).click();
 await page.waitForURL(/card=mainstage&study=lech-lecha/);
});
