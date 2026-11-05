// Synthetic service, not a Firestore rules emulator. Never imports a real SDK.
const IDS={alice:'alicePreview000001',bob:'bobPreview0000001',carol:'carolPreview00001'};
const names={alice:'Demo Alice',bob:'Demo Bob',carol:'Demo Carol'};
const stamp=ms=>({seconds:Math.floor(ms/1000),toMillis:()=>ms,toDate:()=>new Date(ms)});
const person=key=>({uid:IDS[key],displayName:names[key],email:key+'@example.test',isAnonymous:false,providerData:[{providerId:'google.com'}]});
function makeStore(){return {docs:new Map(),auth:new Set(),snapshots:new Set(),guards:new Set(),user:person('alice'),serial:0};}
export const store=top.__homegroupsPreview||(top.__homegroupsPreview=makeStore());
export const auth={get currentUser(){return store.user;},authStateReady:async()=>{},app:{options:{authDomain:'preview.invalid'}}},db={},app={};
const conversation=(a,b)=>[a,b].sort().join('_');
export function resetDemo(){
 store.docs.clear();store.serial=0;const now=Date.now();
 try {for(const uid of Object.values(IDS))localStorage.setItem('hg-commons-direct-names-v1:'+uid,JSON.stringify(Object.fromEntries(Object.keys(IDS).map(key=>[IDS[key],names[key]]))));} catch {}
 for(const key of Object.keys(IDS)){const uid=IDS[key];store.docs.set('commonsMembers/'+uid,{displayName:names[key],about:'Synthetic preview member.',interest:'Bible Study & Investigation',createdAt:stamp(now),updatedAt:stamp(now)});store.docs.set('commonsDirectory/'+uid,{displayName:names[key],interest:'Bible Study & Investigation',updatedAt:stamp(now)});for(const area of ['study','prayer'])store.docs.set('commonsCommunityMembers/'+area+'/members/'+uid,{uid,communityId:area,joinedAt:stamp(now)});}
 for(const area of ['study','prayer']){store.docs.set('commonsCommunityPosts/'+area+'/posts/demo-post',{uid:IDS.bob,authorName:names.bob,body:'[HG-TITLE:Praying and learning together]\nWhat encouraged you in this week’s reading? This is a fictional preview discussion.',createdAt:stamp(now-60000)});store.docs.set('commonsCommunityPosts/'+area+'/posts/demo-post/replies/demo-reply',{uid:IDS.alice,authorName:names.alice,body:'Let us encourage one another. Synthetic preview reply.',createdAt:stamp(now-30000)});}
 const accepted=conversation(IDS.alice,IDS.bob),pending=conversation(IDS.alice,IDS.carol);
 store.docs.set('commonsDirectConversations/'+accepted,{participants:[IDS.alice,IDS.bob].sort(),requestedBy:IDS.bob,status:'accepted',createdAt:stamp(now-120000),updatedAt:stamp(now-60000)});
 store.docs.set('commonsDirectConversations/'+accepted+'/messages/demo-message',{senderUid:IDS.bob,body:'Welcome to the local Fellowship preview. This message is fictional.',createdAt:stamp(now-60000)});
 store.docs.set('commonsDirectConversations/'+pending,{participants:[IDS.alice,IDS.carol].sort(),requestedBy:IDS.carol,status:'pending',createdAt:stamp(now-30000),updatedAt:stamp(now-30000)});
 store.docs.set('prayers/demo-prayer',{lat:36.12,lng:-87.45,name:'Demo prayer',message:'A fictional prayer for encouragement. No real location or person.',prayed:false,ownerUid:IDS.alice,createdAt:stamp(now)});
 store.docs.set('feasts/demo-feast',{lat:36.14,lng:-87.43,name:'Demo gathering',feastType:'Sukkot',ownerUid:IDS.bob,createdAt:stamp(now)});
 emit();
}
if(!store.docs.size)resetDemo();
export async function simulateAccount(key){const user=key==='guest'?null:person(key);for(const guard of [...store.guards])await guard(user);store.user=user;for(const record of [...store.auth])if(store.auth.has(record))record.next(user);emit();}
export function onAuthStateChanged(a,next,error){const record={next,error};store.auth.add(record);queueMicrotask(()=>{if(store.auth.has(record))next(store.user)});return()=>store.auth.delete(record);}
export function beforeAuthStateChanged(a,callback){store.guards.add(callback);return()=>store.guards.delete(callback);}
const reference=(base,...parts)=>({path:[base?.path,...parts].filter(Boolean).join('/')});
export const doc=reference,collection=reference;
export const where=(field,operator,value)=>({kind:'where',field,operator,value});
export const orderBy=(field,direction='asc')=>({kind:'order',field,direction});
export const limit=value=>({kind:'limit',value});
export const startAfter=value=>({kind:'after',value});
export const query=(ref,...constraints)=>({...ref,constraints});
export const serverTimestamp=()=>stamp(Date.now());
const denied=()=>Object.assign(new Error('Synthetic preview access is unavailable for this account.'),{code:'permission-denied'});
function canRead(p,data){const uid=store.user?.uid;if(p.startsWith('commonsMembers/'))return p.split('/')[1]===uid;if(p.startsWith('commonsCommunityMembers/'))return p.split('/')[3]===uid;if(p.startsWith('commonsDirectConversations/')){const parent=store.docs.get(p.split('/').slice(0,2).join('/'));return !!uid&&!!parent?.participants?.includes(uid)&&(p.split('/').length===2||parent.status==='accepted');}if(p.startsWith('commonsCommunityPosts/'))return !!store.docs.get('commonsCommunityMembers/'+p.split('/')[1]+'/members/'+uid);return ['commonsDirectory','prayers','feasts'].includes(p.split('/')[0]);}
function snapshot(path,data){return {id:path.split('/').at(-1),path,ref:{path},exists:()=>data!==undefined,data:()=>data};}
function documentSnapshot(ref){const value=store.docs.get(ref.path);if(value!==undefined&&!canRead(ref.path,value))throw denied();return snapshot(ref.path,value);}
export async function getDoc(ref){return documentSnapshot(ref);}
function collectionSnapshot(ref){let docs=[...store.docs].filter(([p])=>p.startsWith(ref.path+'/')&&p.split('/').length===ref.path.split('/').length+1).map(([p,data])=>snapshot(p,data));
 for(const condition of ref.constraints||[])if(condition.kind==='where')docs=docs.filter(d=>{const value=d.data()[condition.field];return condition.operator==='array-contains'?value?.includes(condition.value):value===condition.value});
 docs=docs.filter(d=>canRead(d.path,d.data()));
 for(const condition of ref.constraints||[])if(condition.kind==='order')docs.sort((a,b)=>{const val=d=>d.data()[condition.field]?.toMillis?.()??d.data()[condition.field]??0;return (val(a)>val(b)?1:val(a)<val(b)?-1:0)*(condition.direction==='desc'?-1:1)});
 for(const condition of ref.constraints||[])if(condition.kind==='after'){const i=docs.findIndex(d=>d.id===condition.value.id);if(i>=0)docs=docs.slice(i+1);}
 for(const condition of ref.constraints||[])if(condition.kind==='limit')docs=docs.slice(0,condition.value);
 return {docs,empty:!docs.length,size:docs.length,forEach:fn=>docs.forEach(fn),docChanges:()=>docs.map(d=>({type:'added',doc:d}))};
}
export async function getDocs(ref){return collectionSnapshot(ref);}
function read(ref){return ['commonsDirectConversations','prayers','feasts'].includes(ref.path.split('/')[0])&&ref.path.split('/').length%2===0?documentSnapshot(ref):collectionSnapshot(ref);}
export function onSnapshot(ref,next,error){const record={ref,next,error};store.snapshots.add(record);queueMicrotask(()=>notify(record));return()=>store.snapshots.delete(record);}
function notify(record){if(!store.snapshots.has(record))return;try{record.next(read(record.ref))}catch(error){record.error?.(error)}}
function emit(){for(const record of [...store.snapshots])notify(record);}
function authorizeWrite(p,data){const uid=store.user?.uid;if(!uid)throw denied();const parts=p.split('/');if(parts[0]==='commonsDirectConversations'){if(parts.length===4){const parent=store.docs.get(parts.slice(0,2).join('/'));if(!parent?.participants.includes(uid)||parent.status!=='accepted'||data.senderUid!==uid)throw denied();}else{const old=store.docs.get(p);if(old){if(old.status!=='pending'||old.requestedBy===uid||!old.participants.includes(uid)||!['accepted','declined'].includes(data.status))throw denied();}else if(!data.participants?.includes(uid)||data.requestedBy!==uid||data.status!=='pending')throw denied();}}else if(['commonsMembers','commonsDirectory'].includes(parts[0])&&parts[1]!==uid)throw denied();else if(parts[0]==='commonsCommunityMembers'&&parts[3]!==uid)throw denied();else if(parts[0]==='commonsCommunityPosts'&&(!store.docs.has('commonsCommunityMembers/'+parts[1]+'/members/'+uid)||data.uid!==uid))throw denied();}
export async function setDoc(ref,data,options={}){authorizeWrite(ref.path,data);store.docs.set(ref.path,options.merge?{...store.docs.get(ref.path),...data}:data);emit();}
export const updateDoc=(ref,data)=>setDoc(ref,data,{merge:true});
export async function addDoc(ref,data){const target={path:ref.path+'/demo-'+(++store.serial)};await setDoc(target,data);return target;}
export async function deleteDoc(ref){authorizeWrite(ref.path,store.docs.get(ref.path)||{});store.docs.delete(ref.path);emit();}
export class GoogleAuthProvider{}
export const signInWithPopup=async()=>{await simulateAccount('alice');return {user:store.user};};
export const signOut=()=>simulateAccount('guest');
export const linkWithPopup=async(user)=>{if(user.uid!==store.user?.uid)throw denied();return {user};};
export const getRedirectResult=async()=>null;
export const isSignInWithEmailLink=()=>false;
const unavailable=async()=>{throw new Error('Local demo only: no email, credential link or redirect was performed.');};
export const sendSignInLinkToEmail=unavailable,signInWithEmailLink=unavailable,signInWithRedirect=unavailable,linkWithCredential=unavailable;
export const EmailAuthProvider={credentialWithLink:()=>({preview:true})};
