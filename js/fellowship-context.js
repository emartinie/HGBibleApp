// Session context only: no content, drafts, credentials, geolocation or Firestore writes.
import {auth} from './firebase-init.js';
import {onAuthStateChanged,beforeAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
const readerKey='hg-reading-view-v1',areas=new Set(['projects','fellowship','prayer','study','discipleship','family']);
const versions=new Set(['KJV','AMP','NASB']);
let bound=false,owner=null,epoch=0,returnRoute=null,mapView=null,association=null;
const discussions=new Map();
const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value)?value:undefined;
const number=(value,min,max)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):0;
function announce(){window.dispatchEvent(new Event('hg:fellowship-context'));}
function clearPrivate(){epoch++;returnRoute=null;mapView=null;association=null;discussions.clear();announce();}
function currentOwner(){return auth.currentUser&&!auth.currentUser.isAnonymous?auth.currentUser.uid:null;}
function sync(){const uid=currentOwner();if(uid!==owner){owner=uid;clearPrivate();}return uid;}
export function ensureContext(){
 if(!bound){bound=true;owner=currentOwner();
  // Invalidate even an A-B-A transition before delayed observers can reuse A's context.
  beforeAuthStateChanged(auth,user=>{if((user&&!user.isAnonymous?user.uid:null)!==owner)clearPrivate();});
  onAuthStateChanged(auth,user=>{if((user?.uid||null)===(auth.currentUser?.uid||null))sync();});
 }
 return sync();
}
export function identity(){ensureContext();return {uid:owner,epoch};}
export function isCurrent(uid,version){sync();return !!uid&&owner===uid&&(version===undefined||epoch===version);}
function reading(value){
 if(!value||typeof value.ref!=='string'||value.ref.length>120||!/^[1-3]?\s*[A-Za-z ]+ \d+(?::\d+)?$/.test(value.ref))return null;
 return {ref:value.ref,version:versions.has(value.version)?value.version:'KJV',anchor:/^\d{1,3}$/.test(value.anchor||'')?value.anchor:null,offset:number(value.offset,-4000,4000),scrollTop:number(value.scrollTop,0,1e7)};
}
export function rememberReading(value){const result=reading(value);if(result)try{sessionStorage.setItem(readerKey,JSON.stringify(result));}catch{}return result;}
export function readingView(route){let result;try{result=reading(JSON.parse(sessionStorage.getItem(readerKey)||'null'));}catch{}return result&&(!route?.ref||route.ref===result.ref)&&(!route?.version||route.version===result.version)?result:null;}
export function returnToReading(week){const value=readingView();return value?window.HGRoute?.navigate('scriptureapi',{ref:value.ref,version:value.version,week}):window.HGRoute?.navigate('mainstage',{week});}
function discussionRoute(route){return route&&areas.has(route.area)&&id(route.post)?{view:['communities','explore'].includes(route.view)?route.view:'communities',section:'discussion',area:route.area,post:route.post,week:route.week}:null;}
export function rememberDiscussion(route,value,uid){
 if(!isCurrent(uid)||!areas.has(route.area)||!value)return;
 const snapshot={post:id(value.post),topic:typeof value.topic==='string'?value.topic.slice(0,80):'',search:typeof value.search==='string'?value.search.slice(0,200):'',mode:value.mode==='expanded'?'expanded':'index',scrollTop:number(value.scrollTop,0,1e7)};
 discussions.set(route.area+':'+(snapshot.post||''),snapshot);if(discussions.size>32)discussions.delete(discussions.keys().next().value);
}
export function discussionView(route,uid){if(!isCurrent(uid))return null;return discussions.get(route.area+':'+(route.post||''))||null;}
export function rememberReturn(route,uid){if(isCurrent(uid)){const target=discussionRoute(route);if(target)returnRoute=target;}announce();}
export function discussionReturn(){ensureContext();return owner&&returnRoute?{...returnRoute}:null;}
export function returnToDiscussion(){const route=discussionReturn();return route?window.HGRoute?.navigate('fellowship-live',route):Promise.resolve();}
export function rememberMap(value,uid){
 if(!isCurrent(uid)||!value||!Array.isArray(value.center)||value.center.length!==2||!value.center.every(Number.isFinite))return;
 if(Math.abs(value.center[0])>90||Math.abs(value.center[1])>180)return;
 mapView={center:[...value.center],zoom:number(value.zoom,0,22),layers:['Prayers','Home Groups','Feasts'].filter(name=>Array.isArray(value.layers)&&value.layers.includes(name))};
}
export function mapState(uid){return isCurrent(uid)&&mapView?{...mapView,center:[...mapView.center],layers:[...mapView.layers]}:null;}
export function explicitReadingLink(body){
 const match=typeof body==='string'&&body.match(/(?:^|\n)Reading: (https?:\/\/[^\s]+)\s*$/);if(!match)return null;
 try{const url=new URL(match[1]);const ref=url.searchParams.get('ref');
  if(url.origin!==location.origin||!['/','/index.html'].includes(url.pathname)||url.searchParams.get('card')!=='scriptureapi'||!ref||!/^[1-3]?\s*[A-Za-z ]+ \d+(?::\d+)?$/.test(ref)||ref.length>120)return null;
  return {card:'scriptureapi',ref,version:versions.has(url.searchParams.get('version'))?url.searchParams.get('version'):'KJV'};
 }catch{return null;}
}
// Called only from the currently authorized discussion view; one explicit association per visit.
export function rememberAssociation(route,link,uid){
 const target=discussionRoute(route);if(!isCurrent(uid)||!target||!link||!reading(link))return;
 association={ref:link.ref,version:link.version,route:target};announce();
}
export function associatedDiscussion(ref){ensureContext();return owner&&association?.ref.toLowerCase()===String(ref).toLowerCase()?{...association.route}:null;}
