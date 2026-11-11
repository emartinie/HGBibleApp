const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness } = require('./harness.cjs');

test('workspace pilot opens the existing feed over Main Stage and restores focus', async t => {
 const {page,frame}=await harness(t,{production:true,mobile:true,route:'?card=mainstage&week=12',feed:{records:[
  {id:'pilot-post',area:'study',title:'A real conversation fixture',time:1,body:'A sample reply topic'}
 ]}});
 const url=page.url();
 const launch=page.getByRole('button',{name:'Fellowship workspace pilot'});
 await launch.click();
 const dialog=page.getByRole('dialog',{name:'Fellowship workspace pilot'});
 await dialog.getByText('A real conversation fixture',{exact:true}).waitFor();
 await dialog.getByText('A real conversation fixture',{exact:true}).click();
 await dialog.getByText('A sample reply topic',{exact:true}).waitFor();
 await dialog.getByRole('button',{name:'Open discussion'}).click();
 const child=await frame();
 await child.locator('#post-pilot-post').waitFor();
 assert.equal(page.url(),url);
 assert.equal(await page.locator('#weekCardDock').isVisible(),true);
 await dialog.getByRole('button',{name:'Close Fellowship'}).click();
 assert.equal(await dialog.count(),0);
 assert.equal(await launch.evaluate(el=>el===document.activeElement),true);
 assert.equal(page.url(),url);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});

test('workspace pilot denies access when the existing rollout is disabled', async t => {
 const {page}=await harness(t,{production:true,route:'?card=mainstage',liveEnabled:false});
 await page.getByRole('button',{name:'Fellowship workspace pilot'}).click();
 const dialog=page.getByRole('dialog',{name:'Fellowship workspace pilot'});
 await dialog.getByText('Live Fellowship is not enabled for this account.').waitFor();
 assert.equal(await dialog.locator('iframe').count(),0);
 assert.equal(await page.evaluate(()=>__fixture.writes.length),0);
});
