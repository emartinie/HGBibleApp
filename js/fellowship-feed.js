// A view over existing community posts, never a global collection or a write path.
import {auth,db} from './firebase-init.js';
import {doc,collection,onSnapshot,getDocsFromServer,query,orderBy,limit,startAfter} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const communities={projects:'Kingdom Projects',fellowship:'Personal Growth & Fellowship',prayer:'Prayer & Encouragement',study:'Bible Study & Investigation',discipleship:'Discipleship & Mentorship',family:'Marriage & Family'};
const pageSize=30;
function node(tag,text){const el=document.createElement(tag);if(text)el.textContent=text;return el;}
function parsed(body){return String(body||'').replace(/^\[HG-TOPIC:[^\]\n]+\]\n/,'').replace(/^\[HG-TITLE:([^\]\n]+)\]\n/,'$1\n');}
function millis(item){const date=item.data.createdAt;return date?.toMillis?.()??date?.toDate?.().getTime()??0;}
function compare(a,b){return millis(b)-millis(a)||(a.area+'/'+a.id).localeCompare(b.area+'/'+b.id);}

export function mountFeed({host,uid,isCurrent,open,saved,onPosition}){
 host.classList.add('fellowship-feed-home');
 let closed=false,revision=0,subscriptionRun=0,busy=false,items=[],sources=[],membership=new Map(),stops=[];
 const current=()=>!closed&&(auth.currentUser?.uid||null)===uid&&isCurrent();
 const status=node('p','Loading your communities…');status.setAttribute('role','status');
 const create=node('button','Create post');create.type='button';create.disabled=true;
 create.className='fellowship-feed-create';
 const plus=node('span','+');plus.setAttribute('aria-hidden','true');create.prepend(plus);
 const picker=node('form');picker.id='fellowship-post-picker';picker.hidden=true;create.setAttribute('aria-controls',picker.id);create.setAttribute('aria-expanded','false');
 const label=node('label','Community'),select=node('select');select.id='fellowship-post-community';label.htmlFor=select.id;
 const proceed=node('button','Continue');proceed.type='submit';picker.append(label,select,proceed);
 const list=node('section');list.className='fellowship-feed';list.setAttribute('aria-label','Community feed');
 const more=node('button','Load older posts');more.type='button';more.hidden=true;
 const retry=node('button','Try again');retry.type='button';retry.hidden=true;
 host.append(create,picker,status,list,more,retry);
 create.onclick=()=>{if(current()){picker.hidden=!picker.hidden;create.setAttribute('aria-expanded',String(!picker.hidden));if(!picker.hidden)select.focus();}};
 picker.onsubmit=e=>{e.preventDefault();if(current()&&membership.get(select.value)===true)open({area:select.value,compose:true});};
 const remember=()=>{if(current())onPosition({count:items.length,scrollTop:host.closest('.card')?.scrollTop||0,windowY:window.scrollY});};
 async function fetchPage(source,v){
  if(source.done||!current()||v!==revision)return;
  const constraints=[orderBy('createdAt','desc'),...(source.cursor?[startAfter(source.cursor)]:[]),limit(pageSize)];
  const result=await getDocsFromServer(query(collection(db,'commonsCommunityPosts',source.area,'posts'),...constraints));
  if(!current()||v!==revision)return;
  source.buffer.push(...result.docs.map(d=>({area:source.area,id:d.id,data:d.data()})));
  source.cursor=result.docs.at(-1)||source.cursor;source.done=result.size<pageSize;
 }
 function draw(){
  list.replaceChildren();
  for(const item of items){
   const article=node('article');article.className='fellowship-post';
   const author=String(item.data.authorName||'HomeGroups member');
   const avatar=node('span',author.trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]||'').join('').toLocaleUpperCase()||'HG');avatar.className='fellowship-post-avatar';avatar.setAttribute('aria-hidden','true');
   const meta=node('div');meta.className='fellowship-post-header';
   const byline=node('div');byline.className='fellowship-post-byline';
   const name=node('strong',author);name.className='fellowship-post-author';
   const community=node('span',communities[item.area]);community.className='fellowship-post-community';
   const date=item.data.createdAt?.toDate?.(),time=node('time',date?date.toLocaleString():'Recently');if(date)time.dateTime=date.toISOString();
   byline.append(name,community,time);meta.append(avatar,byline);
   const body=node('div');body.className='fellowship-feed-body';
   const text=parsed(item.data.body),encoded=String(item.data.body||'').replace(/^\[HG-TOPIC:[^\]\n]+\]\n/,'');
   const title=encoded.match(/^\[HG-TITLE:([^\]\n]+)\]\n/);
   if(title)body.append(node('h3',title[1]),document.createTextNode('\n'),node('p',encoded.slice(title[0].length)));
   else body.append(node('p',text));
   const link=node('a','Open discussion');const url=new URL(location.href);url.searchParams.set('view','home');url.searchParams.set('section','discussion');url.searchParams.set('area',item.area);url.searchParams.set('post',item.id);link.href=url.href;
   link.onclick=e=>{if(e.button||e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();if(current()){remember();open(item);}};
   const arrow=node('span','→');arrow.setAttribute('aria-hidden','true');link.append(arrow);
   article.append(meta,body,link);list.append(article);
  }
 }
 async function next(target=pageSize){
  if(!current()||busy)return;busy=true;more.disabled=true;retry.hidden=true;const v=revision;
  status.textContent='Loading posts…';
  try{
   // Merge source heads before consuming: chronological pagination across communities.
   const additions=[];
   while(additions.length<target){
    await Promise.all(sources.filter(s=>!s.buffer.length&&!s.done).map(s=>fetchPage(s,v)));
    if(!current()||v!==revision)return;
    const candidates=sources.filter(s=>s.buffer.length).sort((a,b)=>compare(a.buffer[0],b.buffer[0]));
    if(!candidates.length)break;additions.push(candidates[0].buffer.shift());
   }
   items.push(...additions);draw();
   status.textContent=items.length?'':sources.length?'No posts yet.':'You haven’t joined any communities yet.';
   more.hidden=!sources.some(s=>s.buffer.length||!s.done);
  }catch(error){
   if(!current()||v!==revision)return;
   // Never leave a previously readable preview visible after an authorization failure.
   ++revision;items=[];sources=[];list.replaceChildren();more.hidden=true;create.disabled=true;picker.hidden=true;create.setAttribute('aria-expanded','false');
   status.textContent=error.code==='permission-denied'?'Community access could not be verified.':'Posts could not load. Please try again.';retry.hidden=false;
  }finally{if(current()&&v===revision){busy=false;more.disabled=false;}}
 }
 async function rebuild(){
  if(!current())return;
  const v=++revision;busy=false;items=[];list.replaceChildren();more.hidden=true;picker.hidden=true;create.setAttribute('aria-expanded','false');
  const joined=[...membership].filter(([,yes])=>yes===true).map(([area])=>area);
  select.replaceChildren(...joined.map(area=>{const option=node('option',communities[area]);option.value=area;return option;}));create.disabled=!joined.length;
  sources=joined.map(area=>({area,buffer:[],cursor:null,done:false}));
  await next(Math.max(pageSize,saved?.count||0));
  if(current()&&v===revision&&saved){const position=saved;saved=null;requestAnimationFrame(()=>{if(current()&&v===revision){const card=host.closest('.card');if(card)card.scrollTop=position.scrollTop;window.scrollTo(0,position.windowY);}});}
 }
 more.onclick=()=>next();retry.onclick=()=>subscribe();
 function subscribe(){
  const run=++subscriptionRun;
  ++revision;busy=false;items=[];sources=[];list.replaceChildren();more.hidden=true;retry.hidden=true;create.disabled=true;picker.hidden=true;create.setAttribute('aria-expanded','false');membership.clear();stops.forEach(stop=>stop());stops=[];
  status.textContent='Loading your communities…';
  if(!uid||auth.currentUser?.isAnonymous){status.textContent='Sign in through Menu to see your community feed.';return;}
  for(const area of Object.keys(communities))stops.push(onSnapshot(doc(db,'commonsCommunityMembers',area,'members',uid),{includeMetadataChanges:true},snapshot=>{
   if(!current()||run!==subscriptionRun)return;
   // Cached membership is not sufficient authorization for this combined view.
   if(snapshot.metadata?.fromCache){
    ++revision;busy=false;membership.delete(area);items=[];list.replaceChildren();more.hidden=true;create.disabled=true;picker.hidden=true;create.setAttribute('aria-expanded','false');
    status.textContent='Connect to verify your communities.';return;
   }
   const value=snapshot.exists(),changed=membership.get(area)!==value;membership.set(area,value);
   if(changed){++revision;busy=false;items=[];list.replaceChildren();more.hidden=true;create.disabled=true;picker.hidden=true;create.setAttribute('aria-expanded','false');}
   if(changed&&membership.size===Object.keys(communities).length)void rebuild();
  },()=>{if(!current()||run!==subscriptionRun)return;++subscriptionRun;++revision;busy=false;items=[];sources=[];list.replaceChildren();more.hidden=true;create.disabled=true;picker.hidden=true;create.setAttribute('aria-expanded','false');status.textContent='Community access could not be verified.';retry.hidden=false;stops.forEach(stop=>stop());}));
 }
 subscribe();
 const dispose=()=>{remember();closed=true;++revision;stops.forEach(stop=>stop());host.replaceChildren();host.classList.remove('fellowship-feed-home');};
 dispose.capture=remember;return dispose;
}
