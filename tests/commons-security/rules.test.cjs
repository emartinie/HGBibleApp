const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,updateDoc,deleteDoc,collection,query,where,limit,serverTimestamp,Timestamp}=require('firebase/firestore');
const project='demo-homegroups-commons-phase1';
// This guard runs before initializing any SDK or cleanup operation.
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8088')throw Error('Rules tests require the isolated loopback emulator on 127.0.0.1:8088.');
let env;
const db=(uid,claims={})=>uid?env.authenticatedContext(uid,{firebase:{sign_in_provider:'google.com'},...claims}).firestore():env.unauthenticatedContext().firestore();
const ref=(client,p)=>doc(client,p);
const pair='alice_bob',conv='commonsDirectConversations/'+pair;
const timestamp=()=>serverTimestamp();
const conversation=(extra={})=>({participants:['alice','bob'],requestedBy:'alice',status:'pending',createdAt:timestamp(),updatedAt:timestamp(),...extra});
const profile=(extra={})=>({displayName:'Alice',about:'',interest:'',createdAt:timestamp(),updatedAt:timestamp(),...extra});
const member=(uid='alice',area='study')=>({uid,communityId:area,joinedAt:timestamp()});
async function seed(entries){await env.withSecurityRulesDisabled(async c=>{for(const [p,d] of Object.entries(entries))await setDoc(ref(c.firestore(),p),d);});}
before(async()=>{env=await initializeTestEnvironment({projectId:project,firestore:{host:'127.0.0.1',port:8088,rules:fs.readFileSync(path.resolve(__dirname,'../../firebase/commons-phase1.rules.proposed'),'utf8')}});});
beforeEach(async()=>env.clearFirestore());after(async()=>env?.cleanup());
test('DM creation: authenticated sender only, canonical immutable pair and pending status',async()=>{
 await assertSucceeds(setDoc(ref(db('alice'),conv),conversation()));
 for(const [uid,id,data] of [[null,'anon_bob',conversation({participants:['anon','bob'],requestedBy:'anon'})],['mallory','bob_mallory',conversation({participants:['bob','mallory'],requestedBy:'bob'})],['alice','alice_carol',conversation({participants:['alice','carol'],status:'accepted'})],['alice','bad-id',conversation()],['alice','alice_alice',conversation({participants:['alice','alice']})]])await assertFails(setDoc(ref(db(uid),'commonsDirectConversations/'+id),data));
});
test('DM reads: participants and constrained inbox query only, no owner/moderator bypass',async()=>{
 await seed({[conv]:{...conversation(),createdAt:Timestamp.now(),updatedAt:Timestamp.now()}});
 await assertSucceeds(getDoc(ref(db('alice'),conv)));await assertSucceeds(getDoc(ref(db('bob'),conv)));
 for(const client of [db(null),db('mallory'),db('owner',{homegroupsOwner:true})])await assertFails(getDoc(ref(client,conv)));
 await assertSucceeds(getDocs(query(collection(db('alice'),'commonsDirectConversations'),where('participants','array-contains','alice'),limit(50))));
 await assertFails(getDocs(collection(db('alice'),'commonsDirectConversations')));
 await assertFails(getDocs(query(collection(db('mallory'),'commonsDirectConversations'),where('participants','array-contains','alice'),limit(50))));
});
test('acceptance: only recipient, no participant/requester/timestamp mutation',async()=>{
 await assertSucceeds(setDoc(ref(db('alice'),conv),conversation()));
 await assertFails(updateDoc(ref(db('alice'),conv),{status:'accepted',updatedAt:timestamp()}));
 await assertFails(updateDoc(ref(db('mallory'),conv),{status:'accepted',updatedAt:timestamp()}));
 for(const patch of [{participants:['bob','carol']},{requestedBy:'bob'},{createdAt:timestamp()},{extra:true}])await assertFails(updateDoc(ref(db('bob'),conv),{status:'accepted',updatedAt:timestamp(),...patch}));
 await assertSucceeds(updateDoc(ref(db('bob'),conv),{status:'accepted',updatedAt:timestamp()}));
 await assertFails(updateDoc(ref(db('bob'),conv),{status:'declined',updatedAt:timestamp()}));
 await assertFails(deleteDoc(ref(db('alice'),conv)));
});
test('decline is recipient-only and terminal; messages unavailable',async()=>{
 await assertSucceeds(setDoc(ref(db('alice'),conv),conversation()));await assertSucceeds(updateDoc(ref(db('bob'),conv),{status:'declined',updatedAt:timestamp()}));
 await assertFails(updateDoc(ref(db('bob'),conv),{status:'accepted',updatedAt:timestamp()}));
 await assertFails(setDoc(ref(db('alice'),conv+'/messages/one'),{senderUid:'alice',body:'Hello',createdAt:timestamp()}));
});
test('pending and missing conversations deny message reads and writes',async()=>{
 await assertSucceeds(setDoc(ref(db('alice'),conv),conversation()));
 for(const id of [pair,'alice_carol']){
  await assertFails(getDocs(collection(db('alice'),'commonsDirectConversations/'+id+'/messages')));
  await assertFails(setDoc(ref(db('alice'),'commonsDirectConversations/'+id+'/messages/one'),{senderUid:'alice',body:'Hello',createdAt:timestamp()}));
 }
});
test('accepted messages: participants, sender identity, size, shape, server time and immutability',async()=>{
 await assertSucceeds(setDoc(ref(db('alice'),conv),conversation()));await assertSucceeds(updateDoc(ref(db('bob'),conv),{status:'accepted',updatedAt:timestamp()}));
 const message={senderUid:'alice',body:'Hello',createdAt:timestamp()};
 await assertSucceeds(setDoc(ref(db('alice'),conv+'/messages/one'),message));await assertSucceeds(getDocs(collection(db('bob'),conv+'/messages')));
 for(const client of [db(null),db('mallory'),db('owner',{homegroupsOwner:true})]){await assertFails(getDoc(ref(client,conv+'/messages/one')));await assertFails(setDoc(ref(client,conv+'/messages/outsider'),message));}
 for(const patch of [{senderUid:'bob'},{body:''},{body:'x'.repeat(2001)},{createdAt:Timestamp.fromMillis(1)},{extra:true}])await assertFails(setDoc(ref(db('alice'),conv+'/messages/bad'),{...message,...patch}));
 await assertFails(updateDoc(ref(db('alice'),conv+'/messages/one'),{body:'changed'}));await assertFails(deleteDoc(ref(db('bob'),conv+'/messages/one')));
});
test('private profiles: owner-only, provider-neutral, validation and immutable creation',async()=>{
 const alice=db('alice',{firebase:{sign_in_provider:'password'}}),p='commonsMembers/alice';
 await assertSucceeds(setDoc(ref(alice,p),profile()));await assertSucceeds(getDoc(ref(alice,p)));
 await assertFails(getDoc(ref(db('bob'),p)));await assertFails(getDoc(ref(db(null),p)));await assertFails(getDocs(collection(alice,'commonsMembers')));
 await assertSucceeds(updateDoc(ref(alice,p),{displayName:'A',updatedAt:timestamp()}));
 await assertFails(updateDoc(ref(alice,p),{createdAt:timestamp(),updatedAt:timestamp()}));await assertFails(updateDoc(ref(alice,p),{email:'private@example.test',updatedAt:timestamp()}));
 await assertFails(setDoc(ref(db('bob'),p),profile()));
});
test('discoverability: explicit owner write, profile prerequisite, no private fields or cross-account consent',async()=>{
 const p='commonsDirectory/alice',data={displayName:'Alice',interest:'',updatedAt:timestamp()};
 await assertFails(setDoc(ref(db('alice'),p),data));await assertSucceeds(setDoc(ref(db('alice'),'commonsMembers/alice'),profile()));
 await assertSucceeds(setDoc(ref(db('alice'),p),data));await assertSucceeds(getDocs(collection(db(null),'commonsDirectory')));
 await assertFails(setDoc(ref(db('bob'),p),data));await assertFails(setDoc(ref(db('alice'),p),{...data,email:'private@example.test'}));await assertFails(deleteDoc(ref(db('bob'),p)));await assertSucceeds(deleteDoc(ref(db('alice'),p)));
});
test('community enrollment/post/reply behavior remains membership-scoped',async()=>{
 await assertSucceeds(setDoc(ref(db('alice'),'commonsMembers/alice'),profile()));
 await assertSucceeds(setDoc(ref(db('alice'),'commonsCommunityMembers/study/members/alice'),member()));
 const p='commonsCommunityPosts/study/posts/post1',post={uid:'alice',authorName:'Alice',body:'Study question',createdAt:timestamp()};
 await assertSucceeds(setDoc(ref(db('alice'),p),post));await assertSucceeds(getDocs(collection(db('alice'),'commonsCommunityPosts/study/posts')));
 await assertFails(getDoc(ref(db('bob'),p)));await assertFails(setDoc(ref(db('bob'),p+'/replies/r1'),{...post,uid:'bob'}));await assertSucceeds(setDoc(ref(db('alice'),p+'/replies/r1'),post));
 await assertFails(setDoc(ref(db('alice'),'commonsCommunityMembers/invalid/members/alice'),member('alice','invalid')));
 await assertSucceeds(deleteDoc(ref(db('alice'),'commonsCommunityMembers/study/members/alice')));await assertFails(getDoc(ref(db('alice'),p)));
});
test('existing app config, personal settings, prayers, feasts and ballot permissions are preserved',async()=>{
 await seed({'appConfig/main':{version:1},'investigationBallots/current':{status:'open',ballotId:'test-ballot',maxSelections:2,candidateTopicIds:['topic-a']}});
 await assertSucceeds(getDoc(ref(db(null),'appConfig/main')));await assertFails(setDoc(ref(db('alice'),'appConfig/main'),{version:2}));
 await assertSucceeds(setDoc(ref(db('alice'),'users/alice/settings/main'),{theme:'dark'}));await assertFails(getDoc(ref(db('bob'),'users/alice/settings/main')));
 const prayer={lat:1,lng:2,name:'Alice',message:'Please pray',prayed:false,ownerUid:'alice',createdAt:timestamp()};
 await assertSucceeds(setDoc(ref(db('alice'),'prayers/one'),prayer));await assertSucceeds(getDoc(ref(db(null),'prayers/one')));await assertFails(setDoc(ref(db('alice',{firebase:{sign_in_provider:'password'}}),'prayers/two'),prayer));
 await assertFails(updateDoc(ref(db('alice'),'prayers/one'),{prayed:true}));
 await assertSucceeds(setDoc(ref(db('alice'),'feasts/one'),{name:'Meeting',feastType:'Sukkot',lat:1,lng:2,ownerUid:'alice',createdAt:timestamp()}));
 await assertSucceeds(setDoc(ref(db('alice'),'investigationVotes/test-ballot/users/alice'),{uid:'alice',ballotId:'test-ballot',topicIds:['topic-a'],updatedAt:timestamp()}));
 await assertFails(getDoc(ref(db('bob'),'investigationVotes/test-ballot/users/alice')));
});
test('moderation: owner appointments; no self-escalation or DM bypass',async()=>{
 const p='commonsModeratorAssignments/study/members/bob',assignment={uid:'bob',community:'study',active:true,appointedBy:'owner',appointedAt:timestamp(),updatedAt:timestamp()};
 await assertFails(setDoc(ref(db('bob'),p),assignment));await assertSucceeds(setDoc(ref(db('owner',{homegroupsOwner:true}),p),assignment));await assertSucceeds(getDoc(ref(db('bob'),p)));await assertFails(getDocs(collection(db('bob'),'commonsModeratorAssignments/study/members')));
 await assertFails(setDoc(ref(db('bob'),'commonsModeratorAssignments/projects/members/bob'),{...assignment,community:'projects'}));
});
test('reports: write-once submissions and scoped reviewer access, immutable owner decisions',async()=>{
 await seed({'commonsMembers/alice':{displayName:'Alice'},'commonsCommunityMembers/study/members/alice':member(),'commonsCommunityPosts/study/posts/post1':{uid:'alice',body:'Question'},'commonsModeratorAssignments/study/members/bob':{active:true},'commonsModeratorAssignments/study/members/revoked':{active:false}});
 const p='commonsReports/alice_post1_post',report={reporterUid:'alice',community:'study',postId:'post1',replyId:'',reason:'spam',details:'',status:'pending',createdAt:timestamp()};
 await assertSucceeds(setDoc(ref(db('alice'),p),report));await assertFails(getDoc(ref(db('alice'),p)));await assertFails(updateDoc(ref(db('alice'),p),{status:'resolved'}));
 await assertSucceeds(getDocs(query(collection(db('bob'),'commonsReports'),where('community','==','study'),limit(50))));
 await assertFails(getDocs(collection(db('bob'),'commonsReports')));await assertFails(getDocs(query(collection(db('bob'),'commonsReports'),where('community','==','study'),limit(51))));await assertFails(getDoc(ref(db('revoked'),p)));await assertFails(getDoc(ref(db('mallory'),p)));
 await assertSucceeds(getDoc(ref(db('owner',{homegroupsOwner:true}),p)));
 const decision={reportId:'alice_post1_post',community:'study',action:'dismissed',rationale:'Reviewed carefully',actorUid:'owner',decidedAt:timestamp()},d='commonsReportDecisions/alice_post1_post';
 await assertFails(setDoc(ref(db('bob'),d),decision));await assertSucceeds(setDoc(ref(db('owner',{homegroupsOwner:true}),d),decision));await assertFails(updateDoc(ref(db('owner',{homegroupsOwner:true}),d),{action:'resolved'}));await assertFails(getDoc(ref(db('bob'),d)));
});
test('unknown collections and unsigned writes remain denied',async()=>{await assertFails(getDoc(ref(db('owner',{homegroupsOwner:true}),'unknown/one')));await assertFails(setDoc(ref(db(null),'commonsMembers/anonymous'),profile()));});

test('discussion read markers are private, enrolled and server-timestamped',async()=>{
 await seed({'commonsMembers/alice':{displayName:'Alice'},'commonsCommunityMembers/study/members/alice':member(),'commonsCommunityPosts/study/posts/post1':{uid:'alice',body:'Question'}});
 const p='commonsDiscussionReads/alice/communities/study/posts/post1';
 await assertSucceeds(setDoc(ref(db('alice'),p),{seenAt:timestamp()}));await assertSucceeds(getDoc(ref(db('alice'),p)));
 await assertFails(getDoc(ref(db('bob'),p)));await assertFails(setDoc(ref(db('bob'),p),{seenAt:timestamp()}));await assertFails(setDoc(ref(db('alice'),p),{seenAt:Timestamp.fromMillis(1)}));
 await assertFails(getDocs(collection(db('alice'),'commonsDiscussionReads/alice/communities/study/posts')));
 await assertSucceeds(deleteDoc(ref(db('alice'),'commonsCommunityMembers/study/members/alice')));await assertFails(getDoc(ref(db('alice'),p)));
});
