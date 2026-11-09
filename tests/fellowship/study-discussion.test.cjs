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
