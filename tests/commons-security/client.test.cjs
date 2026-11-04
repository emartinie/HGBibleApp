const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..');
const commons='My Partner/collaboration/messaging/commons/';
const tick=()=>new Promise(r=>setImmediate(r));
const user=(uid='alice')=>({uid,email:uid+'@example.test',displayName:uid,providerData:[]});
const snap=data=>({exists:()=>data!==null,data:()=>data});
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};}
async function harness(page,{account=null,search='',pending=null,emailLink=false,ready=Promise.resolve(),confirm=true,prompt='alice@example.test',getDoc,addDoc,linkError,storageError=false}={}){
 const html=fs.readFileSync(path.join(root,commons,page+'/index.html'),'utf8');
 const dom=new JSDOM(html,{url:'https://homegroups.test/'+encodeURI(commons)+page+'/'+search,runScripts:'outside-only'});
 const w=dom.window,calls=[],listeners=[],subscriptions=[];
 const auth={currentUser:account,authStateReady:()=>ready,app:{options:{authDomain:'test.invalid'}}};
 if(pending)w.sessionStorage.setItem('hg-commons-email-link-pending',JSON.stringify(pending));
 if(storageError)w.Storage.prototype.setItem=()=>{throw Error('Storage blocked')};
 w.confirm=()=>confirm;w.prompt=()=>prompt;
 const mock={auth,db:{},onAuthStateChanged:(a,fn)=>{listeners.push(fn);return()=>{}},
  doc:(...a)=>a.filter(x=>typeof x==='string').join('/'),collection:(...a)=>a.filter(x=>typeof x==='string').join('/'),
  query:(ref,...constraints)=>({ref,constraints}),where:(...args)=>({where:args}),orderBy:(...args)=>({orderBy:args}),limit:n=>({limit:n}),
  serverTimestamp:()=>({serverTimestamp:true}),
  getDoc:async ref=>getDoc?getDoc(ref):snap(null),getDocs:async()=>({docs:[],empty:true}),
  setDoc:async(...args)=>{calls.push(['setDoc',...args]);},deleteDoc:async(...args)=>{calls.push(['deleteDoc',...args]);},
  addDoc:async(...args)=>{calls.push(['addDoc',...args]);return addDoc?addDoc(...args):{};},
  updateDoc:async(...args)=>{calls.push(['updateDoc',...args]);},
  onSnapshot:(ref,ok,error)=>{const s={ref,ok,error,stopped:false};subscriptions.push(s);return()=>{s.stopped=true};},
  GoogleAuthProvider:function(){},getRedirectResult:async()=>null,signInWithRedirect:async()=>{},
  signInWithPopup:async()=>{calls.push(['google']);},linkWithPopup:async()=>{calls.push(['linkGoogle']);},
  signOut:async()=>{calls.push(['signOut']);auth.currentUser=null;},
  sendSignInLinkToEmail:async(...args)=>{calls.push(['sendEmail',...args]);},
  isSignInWithEmailLink:()=>emailLink,
  signInWithEmailLink:async(a,email)=>{calls.push(['signInEmail',email]);auth.currentUser=user('email-user');},
  linkWithCredential:async(a,c)=>{calls.push(['linkEmail',a.uid,c]);if(linkError)throw linkError;},
  EmailAuthProvider:{credentialWithLink:(email,url)=>({email,url})}
 };
 Object.assign(w,mock);
 const composer=fs.readFileSync(path.join(root,commons,'direct-composer.js'),'utf8');
 w.eval(composer.replace('export function createDirectComposer','function createDirectComposer')+'\nwindow.createDirectComposer=createDirectComposer;');
 const code=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;\s*$/gm,'');
 const boot=w.eval(code);
 if(!emailLink)await tick();
 return {w,dom,calls,subscriptions,boot,el:id=>w.document.getElementById(id),async account(u){auth.currentUser=u;return Promise.all(listeners.map(fn=>fn(u)));},open(id,uid='alice',peer='bob',status='accepted'){
  w.eval('open('+JSON.stringify(id)+')');subscriptions.at(-1).ok(snap({participants:[uid,peer],status,requestedBy:peer}));
 }};
}
for(const page of ['direct-live','direct']){
 const input=page==='direct'?'body':'messageInput',form=page==='direct'?'compose':'composer';
 test(page+': drafts are isolated by thread and purged across accounts',async t=>{
  const h=await harness(page);t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob');h.el(input).value='for Bob';h.el(input).dispatchEvent(new h.w.Event('input'));
  h.open('alice_carol','alice','carol');assert.equal(h.el(input).value,'');h.el(input).value='for Carol';h.el(input).dispatchEvent(new h.w.Event('input'));
  h.open('alice_bob');assert.equal(h.el(input).value,'for Bob');
  await h.account(null);assert.equal(h.el(input).value,'');assert.equal(h.el('actions').children.length,0);
  await h.account(user('carol'));h.open('carol_dave','carol','dave');assert.equal(h.el(input).value,'');
  await h.account(user());h.open('alice_bob');assert.equal(h.el(input).value,'');
 });
 test(page+': duplicate submissions blocked; new draft survives completed send',async t=>{
  const operation=deferred(),h=await harness(page,{addDoc:()=>operation.promise});t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob');h.el(input).value='first';
  const send=h.el(form).onsubmit({preventDefault(){}});await h.el(form).onsubmit({preventDefault(){}});assert.equal(h.calls.filter(c=>c[0]==='addDoc').length,1);
  h.el(input).value='second';h.el(input).dispatchEvent(new h.w.Event('input'));operation.resolve();await send;assert.equal(h.el(input).value,'second');
 });
 test(page+': old send completion cannot clear another account draft',async t=>{
  const operation=deferred(),h=await harness(page,{addDoc:()=>operation.promise});t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob');h.el(input).value='old';
  const send=h.el(form).onsubmit({preventDefault(){}});await h.account(user('carol'));h.open('carol_dave','carol','dave');h.el(input).value='new account';operation.resolve();await send;assert.equal(h.el(input).value,'new account');
 });
 test(page+': pending requests cannot send, failure retains the matching draft',async t=>{
  const h=await harness(page,{addDoc:async()=>{throw Error('offline')}});t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob','alice','bob','pending');h.el(input).value='unsent';await h.el(form).onsubmit({preventDefault(){}});assert.equal(h.calls.length,0);h.open('alice_bob');await h.el(form).onsubmit({preventDefault(){}});assert.equal(h.el(input).value,'unsent');
 });
}
test('profile: consent resets before loading B and cannot be saved early',async t=>{
 const load=deferred();const h=await harness('member',{getDoc:ref=>ref.endsWith('/bob')?load.promise:Promise.resolve(snap(ref.startsWith('commonsDirectory')?{}:{displayName:'Alice'}))});t.after(()=>h.dom.window.close());
 await h.account(user());assert.equal(h.el('discoverable').checked,true);const loading=h.account(user('bob'));assert.equal(h.el('discoverable').checked,false);assert.equal(h.el('discoverable').disabled,true);await h.el('join').onclick();assert.equal(h.calls.length,0);
 load.resolve(snap(null));await loading;assert.equal(h.el('discoverable').checked,false);h.el('displayName').value='Bob';await h.el('join').onclick();assert.equal(h.calls.some(c=>c[0]==='setDoc'&&c[1]==='commonsDirectory/bob'),false);assert.ok(h.calls.some(c=>c[0]==='deleteDoc'&&c[1]==='commonsDirectory/bob'));
});
test('profile: stale A result cannot overwrite B consent',async t=>{
 const old=deferred();const h=await harness('member',{getDoc:ref=>ref.endsWith('/alice')?old.promise:Promise.resolve(snap(null))});t.after(()=>h.dom.window.close());const a=h.account(user());await h.account(user('bob'));old.resolve(snap({displayName:'Alice'}));await a;assert.equal(h.el('discoverable').checked,false);assert.equal(h.el('displayName').value,'bob');
});
test('profile: failed privacy lookup fails closed',async t=>{
 const h=await harness('member',{getDoc:async ref=>{if(ref.startsWith('commonsDirectory'))throw Error('denied');return snap({displayName:'Alice'});}});t.after(()=>h.dom.window.close());await h.account(user());assert.equal(h.el('discoverable').checked,false);assert.equal(h.el('join').disabled,true);await h.el('join').onclick();assert.equal(h.calls.length,0);
});
test('profile: account change during save cannot publish stale directory consent',async t=>{
 const h=await harness('member');t.after(()=>h.dom.window.close());await h.account(user());h.el('displayName').value='Alice';h.el('discoverable').checked=true;const gate=deferred();h.w.setDoc=async(...args)=>{h.calls.push(['setDoc',...args]);await gate.promise;};const save=h.el('join').onclick();await h.account(user('bob'));gate.resolve();await save;assert.equal(h.calls.some(c=>c[1]==='commonsDirectory/alice'),false);assert.equal(h.el('discoverable').checked,false);
});
function intent(mode='link',extra={}){return {version:2,email:'new@example.test',uid:mode==='link'?'alice':null,mode,request:'request-1',createdAt:Date.now(),...extra};}
const actionSearch=(mode='link')=>'?' + new URLSearchParams({emailMode:mode,emailRequest:'request-1',oobCode:'fake-local-test'});
for(const [name,options] of [
 ['missing state',{}],['wrong account',{pending:intent(),account:user('bob')}],['expired',{pending:intent('link',{createdAt:Date.now()-31*60*1000}),account:user()}],['different request',{pending:intent('link',{request:'other'}),account:user()}],['signed out',{pending:intent()}]
])test('email linking fails closed: '+name,async t=>{const h=await harness('auth',{emailLink:true,search:actionSearch(),...options});t.after(()=>h.dom.window.close());await h.boot;assert.equal(h.calls.length,0);assert.match(h.el('status').textContent,/cannot be verified/);});
test('email linking waits for auth restoration and preserves UID',async t=>{
 const gate=deferred();const h=await harness('auth',{emailLink:true,search:actionSearch(),pending:intent(),ready:gate.promise});t.after(()=>h.dom.window.close());assert.equal(h.calls.length,0);await h.account(user());gate.resolve();await h.boot;assert.equal(h.calls[0][0],'linkEmail');assert.equal(h.calls[0][1],'alice');assert.equal(h.calls.some(c=>c[0]==='signInEmail'),false);assert.equal(h.w.sessionStorage.getItem('hg-commons-email-link-pending'),null);
});
test('email linking cancellation leaves account untouched',async t=>{const h=await harness('auth',{emailLink:true,search:actionSearch(),pending:intent(),account:user(),confirm:false});t.after(()=>h.dom.window.close());await h.boot;assert.equal(h.calls.length,0);});
test('email credential collision never falls back to signing in',async t=>{const h=await harness('auth',{emailLink:true,search:actionSearch(),pending:intent(),account:user(),linkError:{code:'auth/credential-already-in-use'}});t.after(()=>h.dom.window.close());await h.boot;assert.deepEqual(h.calls.map(c=>c[0]),['linkEmail']);assert.match(h.el('status').textContent,/No accounts were merged/);});
test('email sign-in cannot silently switch an existing account',async t=>{const h=await harness('auth',{emailLink:true,search:actionSearch('signin'),pending:intent('signin'),account:user('bob')});t.after(()=>h.dom.window.close());await h.boot;assert.equal(h.calls.length,0);assert.match(h.el('status').textContent,/Sign out explicitly/);});
test('email sign-in without tab state requires address and confirmation',async t=>{const h=await harness('auth',{emailLink:true,search:actionSearch('signin')});t.after(()=>h.dom.window.close());await h.boot;assert.deepEqual(h.calls.map(c=>c[0]),['signInEmail']);});
test('older email links never infer linking or switch accounts',async t=>{const h=await harness('auth',{emailLink:true,search:'?oobCode=fake',account:user()});t.after(()=>h.dom.window.close());await h.boot;assert.equal(h.calls.length,0);assert.match(h.el('status').textContent,/fresh/);});
test('email send preserves safe return destination and linking intent',async t=>{const h=await harness('auth',{account:user(),search:'?next=%2Ffind-users%2F'});t.after(()=>h.dom.window.close());h.el('linkEmail').value='new@example.test';await h.el('linkEmailForm').onsubmit({preventDefault(){}});const call=h.calls.find(c=>c[0]==='sendEmail');assert.ok(call);const url=new URL(call[3].url);assert.equal(url.searchParams.get('emailMode'),'link');assert.equal(url.searchParams.get('next'),'/find-users/');assert.equal(JSON.parse(h.w.sessionStorage.getItem('hg-commons-email-link-pending')).uid,'alice');});
test('blocked session storage prevents sending unverifiable linking emails',async t=>{const h=await harness('auth',{account:user(),storageError:true});t.after(()=>h.dom.window.close());h.el('linkEmail').value='new@example.test';await h.el('linkEmailForm').onsubmit({preventDefault(){}});assert.equal(h.calls.length,0);});
test('return URL allowlist rejects external and normalized traversal paths',async t=>{const h=await harness('auth');t.after(()=>h.dom.window.close());for(const url of ['//evil.test/','https://evil.test/','/My%20Partner/collaboration/messaging/commons/auth/../../../../../evil/'])assert.equal(h.w.safeDestination(url),null);assert.equal(h.w.safeDestination('/find-users/'),'/find-users/');});

test('rules proposal preserves every existing root rule and production config target',()=>{
 const rootRules=fs.readFileSync(path.join(root,'firestore.rules'),'utf8').replace(/\r\n/g,'\n');
 const proposal=fs.readFileSync(path.join(root,'firebase/commons-phase1.rules.proposed'),'utf8').replace(/\r\n/g,'\n');
 assert.ok(proposal.includes(rootRules.slice(0,rootRules.lastIndexOf('    match /{document=**}'))));
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8')).firestore.rules,'firestore.rules');
});

for(const page of ['direct-live','direct'])test(page+': retyped identical text is a new draft while send is pending',async t=>{
 const operation=deferred(),h=await harness(page,{addDoc:()=>operation.promise});t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob');const input=page==='direct'?'body':'messageInput',form=page==='direct'?'compose':'composer';h.el(input).value='repeat';const send=h.el(form).onsubmit({preventDefault(){}});h.el(input).dispatchEvent(new h.w.Event('input'));operation.resolve();await send;assert.equal(h.el(input).value,'repeat');
});
