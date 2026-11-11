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

test('share real reader references from a reply and return to the same pilot discussion', async t => {
 const {page,frame}=await harness(t,{production:true,mobile:true,unification:true,route:'?card=mainstage&week=3',feed:{records:[
  {id:'share-post',area:'study',title:'Share a reading',time:1,body:'A discussion about Scripture'}
 ]}});
 page.setDefaultTimeout(25000);
 const url=page.url();
 await page.getByRole('button',{name:'Fellowship workspace pilot'}).click();
 await page.getByRole('button',{name:'Open discussion'}).click();
 let child=await frame();
 const post=child.locator('#post-share-post');
 await post.locator('.replies > details > summary').click();
 const reply=post.getByRole('textbox',{name:/Reply to/});
 await reply.fill('Compare this with the opening verse.');
 await post.getByText('Add Content',{exact:false}).last().click();
 await post.getByRole('button',{name:'Cancel',exact:true}).click();
 assert.equal(await reply.inputValue(),'Compare this with the opening verse.');
 await post.getByText('Add Content',{exact:false}).last().click();
 await post.getByLabel('Book',{exact:true}).selectOption('John');
 await post.getByLabel('Verse (optional)').fill('5');
 await post.getByRole('button',{name:'Add Scripture'}).click();
 assert.match(await reply.inputValue(),/Reading: .*ref=John\+1%3A5/);
 await page.evaluate(()=>__fixture.failShareAck=true);
 await post.getByRole('button',{name:'Post reply'}).click();
 await child.getByText(/Reply not saved/).waitFor();
 await post.getByRole('button',{name:'Post reply'}).click();
 await child.getByText('Reply posted.',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>__fixture.writes.length),1);
 child=await frame();
 await child.locator('#post-share-post .replies > details > summary').click();
 const link=child.getByRole('link',{name:'Read John 1:5'});
 await link.click();
 const reader=page.getByRole('dialog',{name:'Shared reading'});
 await reader.getByText('Synthetic Scripture verse 5',{exact:false}).waitFor();
 assert.equal(page.url(),url);
 await reader.getByRole('button',{name:'Close reading'}).click();
 assert.equal(await link.evaluate(el=>el===el.ownerDocument.activeElement),true);
 assert.equal(await child.locator('#post-share-post').isVisible(),true);
 assert.equal(page.url(),url);
});

test('pilot opens the actual weekly study reader above the discussion', async t => {
 const {page,frame}=await harness(t,{production:true,mobile:true,route:'?card=mainstage&week=3',feed:{records:[
  {id:'study-post',area:'study',title:'Read the weekly study',time:1,body:'Read together.\n\nReading: http://fellowship.test/?card=mainstage&study=lech-lecha'}
 ]}});
 const route=page.url();
 await page.getByRole('button',{name:'Fellowship workspace pilot'}).click();
 await page.getByRole('button',{name:'Open discussion'}).click();
 const child=await frame();
 await child.getByRole('link',{name:'Open the original study'}).click();
 const reader=page.getByRole('dialog',{name:'Shared reading'});
 await reader.locator('#shared-weeklyScriptureContainer[data-source][aria-busy="false"]').waitFor();
 await reader.getByRole('button',{name:'Close reading'}).click();
 assert.equal(page.url(),route);
 assert.equal(await child.locator('#post-study-post').isVisible(),true);
});

test('a new discussion can attach a weekly study using the existing post collection', async t => {
 const {page,frame}=await harness(t,{production:true,route:'?card=mainstage&week=3',feed:{records:[]}});
 page.setDefaultTimeout(25000);
 await page.getByRole('button',{name:'Fellowship workspace pilot'}).click();
 await page.getByRole('button',{name:'Create post'}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 const child=await frame();
 const compose=child.locator('#compose');
 await compose.getByLabel('Discussion title').fill('A study for our next gathering');
 await compose.getByLabel('Opening message').fill('Read this before we meet.');
 await compose.getByText('Add Content',{exact:false}).click();
 await compose.getByLabel('Weekly study',{exact:true}).selectOption('3');
 await compose.getByRole('button',{name:'Add study'}).click();
 assert.match(await compose.getByLabel('Opening message').inputValue(),/study=lech-lecha$/);
 await compose.getByRole('button',{name:'Post message'}).click();
 await child.getByText('Conversation posted.',{exact:true}).waitFor();
 const writes=await page.evaluate(()=>__fixture.writes);
 assert.equal(writes.length,1);
 assert.match(writes[0].path,/^commonsCommunityPosts\/study\/posts\/[^/]+$/);
 assert.match(writes[0].value.body,/study=lech-lecha$/);
});
