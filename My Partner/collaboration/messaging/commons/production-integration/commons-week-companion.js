// HomeGroups Week 1/2 Messaging production integration candidate.
// Load from app shell as <script type="module" src="My%20Partner/collaboration/messaging/commons/production-integration/commons-week-companion.js"></script>
// This module changes no production source files. Uses same-origin Firebase Messaging iframe.
const PILOT = new URL('../week-context-pilot/', import.meta.url);
let week = 0, box, frame, collapsed = false, dragging = null;
const css = document.createElement('style');
css.textContent = `
#hg-commons-launch{position:fixed;right:12px;bottom:15px;z-index:10020;border:1px solid #7c6b49;border-radius:30px;background:#f4eee0;color:#29241d;padding:9px 14px;font:600 13px system-ui;box-shadow:0 4px 15px #0005;cursor:pointer}
#hg-commons-window{position:fixed;z-index:10021;right:12px;bottom:62px;width:min(370px,calc(100vw - 24px));height:min(430px,55dvh);background:#151d2a;border:1px solid #85765d;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px #0007;display:flex;flex-direction:column}
#hg-commons-window[hidden],#hg-commons-launch[hidden]{display:none!important}
#hg-commons-window.minimized{height:42px!important;width:min(290px,calc(100vw - 24px))}
#hg-commons-window.minimized iframe{display:none}
#hg-commons-bar{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 10px;background:#f4eee0;color:#29241d;font:600 12px system-ui;touch-action:none;user-select:none;cursor:grab}
#hg-commons-bar button{border:0;background:transparent;color:inherit;font:600 17px system-ui;padding:0 6px;cursor:pointer}
#hg-commons-window iframe{border:0;flex:1;width:100%;min-height:0}
@media(max-width:600px){#hg-commons-window{height:min(330px,40dvh)}}
`;
document.head.append(css);
const launch=document.createElement('button');launch.id='hg-commons-launch';launch.textContent='☏ Messaging';launch.hidden=true;launch.type='button';document.body.append(launch);
box=document.createElement('section');box.id='hg-commons-window';box.hidden=true;box.setAttribute('aria-label','Messaging study companion');
box.innerHTML='<div id="hg-commons-bar"><span id="hg-commons-label">Messaging · Week 1</span><div><button type="button" id="hg-commons-min" aria-label="Minimize companion">−</button><button type="button" id="hg-commons-close" aria-label="Close companion">×</button></div></div>';
const bar=box.querySelector('#hg-commons-bar'),label=box.querySelector('#hg-commons-label'),min=box.querySelector('#hg-commons-min');
document.body.append(box);
function validWeek(n){return n===1||n===2}
function setWeek(n){if(!validWeek(n))return;week=n;launch.hidden=false;label.textContent='Messaging · Week '+week;if(frame?.contentWindow)frame.contentWindow.postMessage({commonsWeek:week},location.origin)}
function open(){if(!validWeek(week))return;box.hidden=false;launch.hidden=true;if(!frame){frame=document.createElement('iframe');frame.title='Messaging discussions for Week '+week;frame.src=new URL('?embedded=1&week='+week+'&v=20261015-messaging-1',PILOT);box.append(frame)}else{frame.contentWindow?.postMessage({commonsWeek:week},location.origin)}}
function close(){box.hidden=true;launch.hidden=false;/* Preserve iframe and drafts for reopening. */ }
function minimize(){collapsed=!collapsed;box.classList.toggle('minimized',collapsed);min.textContent=collapsed?'+':'−';min.setAttribute('aria-label',collapsed?'Restore companion':'Minimize companion');requestAnimationFrame(clamp)}
function clamp(){if(box.hidden)return;const r=box.getBoundingClientRect();box.style.left=Math.max(8,Math.min(r.left,innerWidth-r.width-8))+'px';box.style.top=Math.max(8,Math.min(r.top,innerHeight-r.height-8))+'px';box.style.right='auto';box.style.bottom='auto'}
launch.addEventListener('click',open);min.addEventListener('click',minimize);box.querySelector('#hg-commons-close').addEventListener('click',close);
bar.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;const r=box.getBoundingClientRect();dragging={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,width:r.width,height:r.height};bar.setPointerCapture(e.pointerId);e.preventDefault()});
bar.addEventListener('pointermove',e=>{if(!dragging||dragging.id!==e.pointerId)return;box.style.left=Math.max(8,Math.min(dragging.left+e.clientX-dragging.x,innerWidth-dragging.width-8))+'px';box.style.top=Math.max(8,Math.min(dragging.top+e.clientY-dragging.y,innerHeight-dragging.height-8))+'px';box.style.right='auto';box.style.bottom='auto'});
for(const ev of ['pointerup','pointercancel'])bar.addEventListener(ev,e=>{if(dragging?.id===e.pointerId)dragging=null});
window.addEventListener('resize',()=>requestAnimationFrame(clamp));
document.addEventListener('weekChanged',e=>setWeek(Number(e.detail?.week??e.detail?.weekNumber)));
function refresh(){
 const route=window.HGRoute?.read?.();
 const select=document.getElementById('weekSelect');
 const selected=Number(select?.value);
 const routeWeek=Number(route?.week);
 const loaded=Number(window.currentWeekData?.week);
 const globalWeek=Number(window.currentWeek);
 // The study engine can initialize asynchronously; the selector is our primary source.
 const n=validWeek(routeWeek)&&route?.card==='mainstage'?routeWeek:
   validWeek(selected)?selected:
   validWeek(globalWeek)?globalWeek:
   validWeek(loaded)?loaded:0;
 if(route?.card && route.card!=='mainstage'){
   box.hidden=true;launch.hidden=true;return;
 }
 if(n){setWeek(n)}
 else{launch.hidden=true;box.hidden=true}
}
refresh();
document.addEventListener('weekChanged',()=>queueMicrotask(refresh));
window.addEventListener('popstate',()=>setTimeout(refresh,0));
const studySelect=document.getElementById('weekSelect');
studySelect?.addEventListener('change',refresh);
let checks=0;
const startup=setInterval(()=>{refresh();if(++checks>=30)clearInterval(startup)},500);
window.HGCommonsWeekCompanion=Object.freeze({refresh,open,get week(){return week},get visible(){return !launch.hidden}});
