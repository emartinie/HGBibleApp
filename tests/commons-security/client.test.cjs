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
 const w=dom.window,calls=[],listeners=[],subscriptions=[],authGuards=new Set();
 const auth={currentUser:account,authStateReady:()=>ready,app:{options:{authDomain:'test.invalid'}}};
 if(pending)w.sessionStorage.setItem('hg-commons-email-link-pending',JSON.stringify(pending));
 if(storageError)w.Storage.prototype.setItem=()=>{throw Error('Storage blocked')};
 w.confirm=()=>confirm;w.prompt=()=>prompt;
 const mock={auth,db:{},onAuthStateChanged:(a,fn)=>{listeners.push(fn);return()=>{}},
  beforeAuthStateChanged:(a,fn)=>{authGuards.add(fn);return()=>authGuards.delete(fn);},
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
  signInWithEmailLink:async(a,email)=>{calls.push(['signInEmail',email]);for(const fn of authGuards)await fn(user('email-user'));auth.currentUser=user('email-user');return {user:auth.currentUser};},
  linkWithCredential:async(a,c)=>{calls.push(['linkEmail',a.uid,c]);if(linkError)throw linkError;},
  EmailAuthProvider:{credentialWithLink:(email,url)=>({email,url})}
 };
 Object.assign(w,mock);
 const composer=fs.readFileSync(path.join(root,commons,'direct-composer.js'),'utf8');
 w.eval(composer.replace('export function createDirectComposer','function createDirectComposer')+'\nwindow.createDirectComposer=createDirectComposer;');
 const code=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;\s*$/gm,'');
 const boot=w.eval(code);
 if(!emailLink)await tick();
 return {w,dom,calls,subscriptions,boot,authGuards,el:id=>w.document.getElementById(id),async account(u){for(const fn of authGuards)await fn(u);auth.currentUser=u;return Promise.all(listeners.map(fn=>fn(u)));},open(id,uid='alice',peer='bob',status='accepted'){
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

test('legacy logout scrubs transcript and recipient from shared-browser DOM',async t=>{
 const h=await harness('direct');t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob');h.el('messages').textContent='Sensitive prior-account transcript';h.el('recipient').value='prior-recipient';await h.account(user('bob'));assert.equal(h.el('messages').textContent,'');assert.equal(h.el('recipient').value,'');
});
for(const page of ['direct-live','direct']){
 test(page+': callback from a closed subscription cannot reauthorize a reopened thread',async t=>{
  const h=await harness(page);t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob');const old=h.subscriptions.find(s=>s.ref==='commonsDirectConversations/alice_bob');h.open('alice_bob','alice','bob','pending');old.ok(snap({participants:['alice','bob'],status:'accepted',requestedBy:'bob'}));assert.equal(h.el(page==='direct'?'compose':'composer').hidden,true);
 });
 test(page+': pending writes retain original destination and failure only restores matching draft',async t=>{
  const a=deferred(),b=deferred(),h=await harness(page,{addDoc:ref=>ref.includes('alice_bob')?a.promise:b.promise});t.after(()=>h.dom.window.close());await h.account(user());const input=page==='direct'?'body':'messageInput',form=page==='direct'?'compose':'composer';h.open('alice_bob');h.el(input).value='for Bob';const first=h.el(form).onsubmit({preventDefault(){}});h.open('alice_carol','alice','carol');h.el(input).value='for Carol';const second=h.el(form).onsubmit({preventDefault(){}});
  assert.deepEqual(h.calls.filter(c=>c[0]==='addDoc').map(c=>[c[1],c[2].senderUid,c[2].body]),[['commonsDirectConversations/alice_bob/messages','alice','for Bob'],['commonsDirectConversations/alice_carol/messages','alice','for Carol']]);
  a.reject(Error('late Bob failure'));await first;assert.equal(h.el(input).value,'for Carol');b.resolve();await second;assert.equal(h.el(input).value,'');h.open('alice_bob');assert.equal(h.el(input).value,'for Bob');
 });
 test(page+': old account failure cannot unlock a newer pending send after A-B-A',async t=>{
  const old=deferred(),fresh=deferred();let count=0;const h=await harness(page,{addDoc:()=>++count===1?old.promise:fresh.promise});t.after(()=>h.dom.window.close());await h.account(user());const input=page==='direct'?'body':'messageInput',form=page==='direct'?'compose':'composer';h.open('alice_bob');h.el(input).value='old';const first=h.el(form).onsubmit({preventDefault(){}});await h.account(user('carol'));await h.account(user());h.open('alice_bob');h.el(input).value='fresh';const second=h.el(form).onsubmit({preventDefault(){}});old.reject(Error('old failure'));await first;assert.equal(h.el(form).querySelector('button').disabled,true);assert.equal(h.el(input).value,'fresh');fresh.resolve();await second;
 });
 test(page+': SDK identity mismatch before auth callback prevents any write',async t=>{
  const h=await harness(page);t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob');const input=page==='direct'?'body':'messageInput',form=page==='direct'?'compose':'composer';h.el(input).value='private';h.w.auth.currentUser=user('bob');await h.el(form).onsubmit({preventDefault(){}});assert.equal(h.calls.length,0);assert.equal(h.el(input).value,'private');
 });
}
for(const [name,control] of [['Google link','linkGoogle'],['email link','linkEmailForm']])test(name+': identity change during auth restoration cancels queued action',async t=>{
 const gate=deferred(),h=await harness('auth',{account:user(),ready:gate.promise});t.after(()=>h.dom.window.close());h.el('linkEmail').value='new@example.test';const action=control==='linkGoogle'?h.el(control).onclick():h.el(control).onsubmit({preventDefault(){}});await h.account(user('bob'));gate.resolve();await action;assert.equal(h.calls.length,0);
});
test('auth inputs are scrubbed on identity transitions',async t=>{
 const h=await harness('auth',{account:user()});t.after(()=>h.dom.window.close());await h.account(user());h.el('linkEmail').value='private@example.test';h.el('email').value='private@example.test';await h.account(user('bob'));assert.equal(h.el('linkEmail').value,'');assert.equal(h.el('email').value,'');
});
test('Google linking uses the original UID and never falls back to sign-in on collision',async t=>{
 const h=await harness('auth',{account:user()});t.after(()=>h.dom.window.close());h.w.linkWithPopup=async u=>{h.calls.push(['linkGoogle',u.uid]);throw {code:'auth/credential-already-in-use'};};await h.el('linkGoogle').onclick();assert.deepEqual(h.calls,[['linkGoogle','alice']]);assert.match(h.el('status').textContent,/No accounts were merged/);
});
test('expired sign-in SDK response retains account and never auto-retries',async t=>{
 const h=await harness('auth',{emailLink:true,search:actionSearch('signin')});t.after(()=>h.dom.window.close());h.w.signInWithEmailLink=async()=>{h.calls.push(['expired']);throw {code:'auth/expired-action-code'};};await h.boot;assert.deepEqual(h.calls,[['expired']]);assert.equal(h.w.auth.currentUser,null);assert.match(h.el('status').textContent,/expired-action-code/);
});

for(const method of ['Google','email'])test(method+': a delayed sign-in cannot replace an intervening account',async t=>{
 const gate=deferred(),h=await harness('auth',{emailLink:method==='email',search:method==='email'?actionSearch('signin'):''});t.after(()=>h.dom.window.close());
 const sdkSignIn=async()=>{h.calls.push(['pendingSignIn']);await gate.promise;const next=user('old-login');for(const fn of h.authGuards)await fn(next);h.w.auth.currentUser=next;return {user:next};};
 if(method==='Google')h.w.signInWithPopup=sdkSignIn;else h.w.signInWithEmailLink=sdkSignIn;
 const pending=method==='Google'?h.el('google').onclick():h.boot;await tick();await h.account(user('bob'));gate.resolve();await pending;assert.equal(h.w.auth.currentUser.uid,'bob');assert.equal(h.authGuards.size,0);
});
test('Google sign-in provider failure reports error and releases controls',async t=>{
 const h=await harness('auth');t.after(()=>h.dom.window.close());h.w.signInWithPopup=async()=>{throw {code:'auth/popup-closed-by-user'};};await h.el('google').onclick();assert.match(h.el('status').textContent,/popup-closed-by-user/);assert.equal(h.el('google').disabled,false);assert.equal(h.authGuards.size,0);
});
test('Google linking succeeds for original UID with no sign-in fallback',async t=>{
 const h=await harness('auth',{account:user()});t.after(()=>h.dom.window.close());h.w.linkWithPopup=async u=>{h.calls.push(['linked',u.uid]);return {user:u};};await h.el('linkGoogle').onclick();assert.deepEqual(h.calls,[['linked','alice']]);assert.equal(h.w.auth.currentUser.uid,'alice');assert.match(h.el('status').textContent,/Google linked/);
});
test('late linking failure never overwrites another account status',async t=>{
 const gate=deferred(),h=await harness('auth',{account:user()});t.after(()=>h.dom.window.close());h.w.linkWithPopup=async()=>gate.promise;const action=h.el('linkGoogle').onclick();await tick();await h.account(user('bob'));const status=h.el('status').textContent;gate.reject({code:'auth/credential-already-in-use'});await action;assert.equal(h.el('status').textContent,status);assert.equal(h.w.auth.currentUser.uid,'bob');
});

for(const page of ['direct-live','direct']){
 test(page+': send success while away clears only the original submitted draft',async t=>{
  const gate=deferred(),h=await harness(page,{addDoc:()=>gate.promise});t.after(()=>h.dom.window.close());await h.account(user());const input=page==='direct'?'body':'messageInput',form=page==='direct'?'compose':'composer';h.open('alice_bob');h.el(input).value='submitted';const send=h.el(form).onsubmit({preventDefault(){}});h.open('alice_carol','alice','carol');h.el(input).value='new contact draft';gate.resolve();await send;assert.equal(h.el(input).value,'new contact draft');h.open('alice_bob');assert.equal(h.el(input).value,'');
 });
 test(page+': stale message observer cannot replace a reopened transcript',async t=>{
  const h=await harness(page);t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob');const old=h.subscriptions.find(s=>s.ref?.ref?.endsWith('/messages'));h.open('alice_bob');h.el('messages').textContent='Current transcript';old.ok({empty:false,forEach(fn){fn({data:()=>({senderUid:'bob',body:'obsolete transcript'})});}});assert.equal(h.el('messages').textContent,'Current transcript');
 });
 test(page+': delayed acceptance cannot change another conversation status',async t=>{
  const gate=deferred(),h=await harness(page);t.after(()=>h.dom.window.close());await h.account(user());h.open('alice_bob','alice','bob','pending');h.w.updateDoc=async()=>gate.promise;const button=[...h.el('actions').querySelectorAll('button')].find(x=>x.textContent==='Accept');const action=button.onclick();h.open('alice_carol','alice','carol');const status=h.el(page==='direct'?'status':'notice').textContent;gate.resolve();await action;assert.equal(h.el(page==='direct'?'status':'notice').textContent,status);
 });
 test(page+': invitation completion after account change cannot reopen old identity',async t=>{
  const target='BBBBBBBBBBBBBBBBBBBB',gate=deferred(),h=await harness(page,{search:'?to='+target+'&name=Bob'});t.after(()=>h.dom.window.close());await h.account(user('AAAAAAAAAAAAAAAAAAAA'));h.w.setDoc=async()=>gate.promise;
  let action;if(page==='direct'){h.el('recipient').value=target;action=h.el('invite').onclick();}else{h.subscriptions.find(s=>s.ref?.ref==='commonsDirectConversations').ok({docs:[]});action=h.el('messages').querySelector('button').onclick();}
  await h.account(user('CCCCCCCCCCCCCCCCCCCC'));const status=h.el(page==='direct'?'status':'notice').textContent;gate.resolve();await action;assert.equal(h.el(page==='direct'?'status':'notice').textContent,status);assert.equal(h.el(page==='direct'?'compose':'composer').hidden,true);if(page==='direct-live')assert.equal(h.el('layout').classList.contains('open'),false);
 });
}

test('auth status cannot retain prior-account email while a link operation is pending',async t=>{
 const gate=deferred(),h=await harness('auth',{account:user()});t.after(()=>h.dom.window.close());h.el('status').textContent='Check private-old@example.test for your email';h.w.linkWithPopup=async()=>gate.promise;const pending=h.el('linkGoogle').onclick();await tick();await h.account(user('bob'));assert.equal(h.el('status').textContent.includes('private-old@example.test'),false);gate.resolve();await pending;assert.equal(h.w.auth.currentUser.uid,'bob');
});

test('delayed sign-out completion cannot claim another account is signed out',async t=>{
 const gate=deferred(),h=await harness('auth',{account:user()});t.after(()=>h.dom.window.close());h.w.signOut=async()=>gate.promise;const pending=h.el('signout').onclick();await tick();await h.account(user('bob'));const status=h.el('status').textContent;gate.resolve();await pending;assert.equal(h.w.auth.currentUser.uid,'bob');assert.equal(h.el('status').textContent,status);
});
