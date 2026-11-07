import { auth } from './firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import './prayermap.js';
import * as journey from './fellowship-context.js';
import {renderReadOnlyFixtures} from './fellowship-test-fixtures.js';
export const controlledFixturesVersion=1;
export const liveIntegrationVersion=1;

const COMMONS = '/My%20Partner/collaboration/messaging/commons/';
const VIEWS = new Set(['prayer','communities','explore','messages']);
const AREAS = new Set(['projects','fellowship','prayer','study','discipleship','family']);
const THEME = ['--bg-0','--bg-1','--bg-2','--panel','--panel-2','--line','--soft','--text','--muted','--gold','--gold-2','--accent'];
let active;
// Live-only presentation: move the existing controls, retaining their handlers/routes.
function compactLiveNavigation(root){
  root.classList.add('fellowship-live');
  const header=root.querySelector('header'),heading=root.querySelector('#fellowshipTitle');
  const menu=document.createElement('details');menu.className='fellowship-menu';
  const summary=document.createElement('summary');summary.textContent='Menu';
  const navigation=document.createElement('nav');navigation.setAttribute('aria-label','Fellowship navigation');
  const labels={explore:'Explore Communities',people:'Find People',profile:'My Profile',account:'Account / Sign In',study:'Return to Bible Study'};
  for(const key of ['prayer','communities','explore','messages','people','profile','account','study']){
    const button=root.querySelector('[data-fellowship-view="'+key+'"], [data-fellowship-action="'+key+'"]');
    if(button){if(labels[key])button.textContent=labels[key];navigation.append(button);}
  }
  const back=document.createElement('button');back.type='button';back.dataset.fellowshipAction='discussion-return';back.textContent='Return to discussion';back.hidden=!journey.discussionReturn();navigation.append(back);
  menu.append(summary,navigation);header.replaceChildren(heading,menu);
  root.querySelector('.fellowship-tabs')?.remove();
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&menu.open){menu.open=false;summary.focus();event.preventDefault();}
  });
  return menu;
}
function stateFor(route = {}) {
  return { view: VIEWS.has(route.view) ? route.view : 'prayer',
    section: ['discussion','people','account','profile'].includes(route.section) ? route.section : undefined,
    area: AREAS.has(route.area) ? route.area : undefined,
    post:typeof route.post==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(route.post)?route.post:undefined,
    id: typeof route.id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(route.id) ? route.id : undefined,
    week: /^([1-9]|[1-4][0-9]|5[0-2])$/.test(String(route.week)) ? route.week : undefined };
}
function childURL(state) {
  const page = state.section === 'account' ? 'auth/' : state.section === 'profile' ? 'member/' : state.section === 'people' ? '/find-users/' : state.section === 'discussion' ? 'conversations/' : state.view === 'messages' ? 'direct-live/' : 'directory/';
  const url = new URL(page.startsWith('/') ? page : COMMONS + page, location.origin);
  url.searchParams.set('fellowship','1');
  if (state.view === 'communities') url.searchParams.set('communityView','joined');
  for (const key of ['week','area']) if (state[key]) url.searchParams.set(key,state[key]);
  if (state.view === 'messages' && state.id) url.searchParams.set('to',state.id);
  if(state.section==='discussion'&&state.post)url.hash='post-'+state.post;
  return url;
}
function captureView(session,post){
  if(session.routeCard!=='fellowship-live'||!journey.isCurrent(session.uid,session.contextEpoch))return null;
  const route=session.renderedState||session.state;
  if(route.view==='prayer'&&!route.section)journey.rememberMap(window.capturePrayerMapView?.(),session.uid);
  try{
    const snapshot=session.frame?.contentWindow?.HGDiscussionView?.capture(post);
    if(snapshot?.uid===session.uid&&route.section==='discussion'){
      const source={...route,post:snapshot.post};journey.rememberDiscussion(source,snapshot,session.uid);
      if(snapshot.post&&snapshot.reading)journey.rememberAssociation(source,snapshot.reading,session.uid);
      return source;
    }
  }catch{}
  return null;
}
function teardownView(session) {
  captureView(session);
  ++session.generation;
  session.abort?.abort();
  clearTimeout(session.timer);
  session.bridgeCleanup?.(); session.bridgeCleanup = null;
  if (session.frame) {
    try { session.frame.contentWindow?.dispatchEvent(new Event('hg:fellowship-dispose')); } catch { /* A provider redirect may have left this origin. Removing the frame still releases its realm. */ }
    session.frame.remove(); session.frame = null;
  }
  window.destroyPrayerMapCard?.();
  session.content.replaceChildren();
}
function themeFrame(session) {
  let root;
  try { root = session.frame?.contentDocument?.documentElement; } catch { return; }
  if (!root) return;
  const style = getComputedStyle(document.documentElement);
  THEME.forEach(key => root.style.setProperty(key,style.getPropertyValue(key)));
  root.style.colorScheme = style.colorScheme;
  root.style.fontFamily = getComputedStyle(session.root).fontFamily;
}
function fail(session, generation, message) {
  if (active !== session || generation !== session.generation) return;
  session.status.textContent = message;
  session.content.setAttribute('aria-busy','false');
  session.root.querySelector('[data-fellowship-action=retry]').hidden = false;
}
function navigateChild(session, url) {
  if (url.origin !== location.origin) return false;
  const path = decodeURIComponent(url.pathname).replace(/index\.html$/,'').replace(/\/$/,'')||'/';
  const base = decodeURIComponent(COMMONS).replace(/\/$/,'');
  let patch;
  if (path === '/find-users') patch = {view:'explore',section:'people'};
  else if (path === base+'/directory') patch = {view:'explore'};
  else if (path === base+'/conversations') patch = {view:session.state.view === 'communities'?'communities':'explore',section:'discussion',area:url.searchParams.get('area'),post:url.hash.match(/^#post-([A-Za-z0-9_-]{1,128})$/)?.[1]||url.searchParams.get('post')};
  else if (path === base+'/direct-live') patch = {view:'messages',id:url.searchParams.get('to')};
  else if (path === base+'/auth') patch = {view:session.state.view,section:'account'};
  else if (path === base+'/member') patch = {view:session.state.view,section:'profile'};
  else if (path === '/' && url.searchParams.get('card') === 'prayermap') patch = {view:'prayer'};
  else if(path==='/'&&url.searchParams.has('card')){
    const source=captureView(session);if(source)journey.rememberReturn(source,session.uid);
    const route=window.HGRoute?.read(url);if(!route)return false;
    window.HGRoute.navigate(route.card,window.HGRoute.getState(route));return true;
  }
  else if (path === '/') { returnToStudy(session); return true; }
  else return false;
  select(session,{...patch,week:session.state.week});
  return true;
}
function bridge(session, frame) {
  const doc = frame.contentDocument;
  const link = doc.createElement('link'); link.rel='stylesheet'; link.href='/css/fellowship-embedded.css'; doc.head.append(link);
  themeFrame(session);
  const handler = event => {
    const post=event.target.closest?.('article.post')?.id?.replace(/^post-/,'');const source=captureView(session,post);if(source&&event.target.closest?.('[data-private-message]'))journey.rememberReturn(source,session.uid);
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || anchor.download) return;
    const url = new URL(anchor.href,frame.src);
    if (url.pathname === doc.location.pathname && url.search === doc.location.search && url.hash) return;
    if (navigateChild(session,url)) event.preventDefault();
    else if (url.origin !== location.origin) { anchor.target='_blank'; anchor.rel='noopener noreferrer'; }
  };
  const mapToggle = doc.getElementById('mapView');
  const mapHandler = event => { event.preventDefault();event.stopImmediatePropagation(); select(session,{view:'prayer',week:session.state.week}); };
  mapToggle?.addEventListener('click',mapHandler,true);
  const areaSelect=doc.getElementById('area');
  const areaHandler=()=>{if(AREAS.has(areaSelect.value)){session.state.area=areaSelect.value;session.state.post=undefined;session.renderedState={...session.state};window.HGRoute?.write(session.routeCard,session.state,{announce:false});}};
  areaSelect?.addEventListener('change',areaHandler);
  const hashHandler=()=>{
    if(active!==session||session.frame!==frame)return;
    const post=frame.contentWindow.location.hash.match(/^#post-([A-Za-z0-9_-]{1,128})$/)?.[1];
    if(session.state.section==='discussion'&&session.state.post!==post){session.state.post=post;session.renderedState={...session.state};window.HGRoute?.write(session.routeCard,session.state,{replace:true,announce:false});}
    captureView(session);
  };
  frame.contentWindow.addEventListener('hashchange',hashHandler);frame.contentWindow.addEventListener('hg:discussion-ready',hashHandler);
  const view=journey.discussionView(session.state,session.uid);
  if(session.state.section==='discussion')frame.contentWindow.HGDiscussionView?.restore(view,session.uid);
  doc.addEventListener('click',handler,true);
  session.bridgeCleanup = () => {try{frame.contentWindow.removeEventListener('hashchange',hashHandler);frame.contentWindow.removeEventListener('hg:discussion-ready',hashHandler);}catch{}areaSelect?.removeEventListener('change',areaHandler);doc.removeEventListener('click',handler,true);mapToggle?.removeEventListener('click',mapHandler,true);};
}
async function render(session) {
  teardownView(session);
  session.renderedState={...session.state};
  session.contextChanged?.();
  const generation = session.generation;
  session.root.querySelectorAll('[data-fellowship-view]').forEach(button => button.setAttribute('aria-current',button.dataset.fellowshipView === session.state.view ? 'page' : 'false'));
  session.root.querySelector('[data-fellowship-action=retry]').hidden=true;
  session.status.textContent='Loading…';session.content.setAttribute('aria-busy','true');
  if (session.testing) {
    renderReadOnlyFixtures(session.content,session.state,route=>select(session,route));
    session.status.textContent='Read-only test: no live messaging, membership changes, sign-in shortcuts or location publication.';
    session.content.setAttribute('aria-busy','false');
    return;
  }
  if (session.state.view === 'prayer' && !session.state.section) {
    session.abort = new AbortController();
    try {
      const response = await fetch('cards/prayermap.html',{signal:session.abort.signal});
      if (!response.ok) throw new Error('Map unavailable');
      const html = await response.text();
      if (active !== session || generation !== session.generation) return;
      session.content.innerHTML=html;
      session.content.querySelector('.card-topbar')?.remove();
      if(session.routeCard==='fellowship-live'){
        const mapCard=session.content.querySelector('.prayer-map-card');
        // Keep the original search, status, map layers/controls and help; show the map before the introduction.
        mapCard.prepend(mapCard.querySelector('#prayerMapSearch'),mapCard.querySelector('#prayerMapStatus'),mapCard.querySelector('#prayerMap').parentElement);
      }
      window.initPrayerMapCard({readOnly:session.prayerReadOnly,viewState:session.routeCard==='fellowship-live'?journey.mapState(session.uid):null});
      if (!window.currentMap) throw new Error('Map library unavailable');
      session.status.textContent=session.prayerReadOnly?'Prayer Map is read-only during verification. Displayed pins are approximate; historical downloads can contain more precise coordinates.':'Locations shown on the map are approximate. Location is optional for Fellowship.';
      session.content.setAttribute('aria-busy','false');
    } catch (error) { if (error.name !== 'AbortError') fail(session,generation,'Prayer Map could not load. Please try again.'); }
    return;
  }
  if (!session.authReady) { session.status.textContent='Checking your account…';return; }
  const frame = document.createElement('iframe');session.frame=frame;
  frame.title = session.state.section === 'account' ? 'HomeGroups account' : session.state.section === 'profile' ? 'HomeGroups member profile' : session.state.view === 'messages' ? 'Fellowship messages and requests' : 'Fellowship communities';
  frame.src=childURL(session.state).href;
  frame.addEventListener('load',()=>{
    if (active !== session || generation !== session.generation) return;
    clearTimeout(session.timer);
    try {
      const actual = new URL(frame.contentWindow.location.href);
      if (actual.pathname !== new URL(frame.src).pathname && navigateChild(session,actual)) return;
      const selectors = {'directory':'#directory','conversations':'#posts','direct-live':'#layout','auth':'#guest','member':'#profile','find-users':'#results'};
      const segment = actual.pathname.split('/').filter(Boolean).filter(part=>part!=='index.html').pop();
      if (selectors[segment] && !frame.contentDocument.querySelector(selectors[segment])) throw new Error('Screen unavailable');
      bridge(session,frame);session.status.textContent='';session.content.setAttribute('aria-busy','false');}
    catch {fail(session,generation,'This view could not load. Please try again.');}
  });
  frame.addEventListener('error',()=>fail(session,generation,'This view could not load. Please try again.'));
  session.timer=setTimeout(()=>fail(session,generation,'This view is taking longer than expected. Check your connection and try again.'),20000);
  session.content.append(frame);
}
function select(session, route, write = true) {
  if (active !== session) return;
  const origin=captureView(session);if(origin&&route.section!=='discussion')journey.rememberReturn(origin,session.uid);
  session.state=stateFor(route);
  if (write) window.HGRoute?.write(session.routeCard,session.state,{announce:false,source:'fellowship'});
  return render(session);
}
function returnToStudy(session) {const week=session.state.week||document.getElementById('weekSelect')?.value;if(session.routeCard==='fellowship-live')journey.returnToReading(week);else window.HGRoute?.navigate('mainstage',{week});}
window.initFellowshipCard = function(host,options={}) {
  window.destroyFellowshipCard();
  const root=host.querySelector('.fellowship');if(!root)return;
  const session={root,content:root.querySelector('[data-fellowship-content]'),status:root.querySelector('[data-fellowship-status]'),generation:0,testing:options.readOnlyFixtures===true,routeCard:options.readOnlyFixtures===true?'fellowship-test':options.routeCard==='fellowship-live'?'fellowship-live':'fellowship',prayerReadOnly:options.prayerReadOnly===true,authReady:false,uid:options.routeCard==='fellowship-live'?(auth.currentUser?.uid||null):undefined,state:stateFor(window.HGRoute?.read())};
  active=session;
  if(session.routeCard==='fellowship-live'){
    journey.ensureContext();session.contextEpoch=journey.identity().epoch;session.menu=compactLiveNavigation(root);
    session.contextChanged=()=>{const button=root.querySelector('[data-fellowship-action="discussion-return"]'),origin=journey.discussionReturn();if(button)button.hidden=!origin||(session.state.section==='discussion'&&session.state.area===origin.area&&session.state.post===origin.post);};
    window.addEventListener('hg:fellowship-context',session.contextChanged);
  }
  session.dock=document.getElementById("weekCardDock");
  if(session.dock){session.dockParent=session.dock.parentNode;session.dockNext=session.dock.nextSibling;root.prepend(session.dock);}
  session.weekChanged=()=>{if(active!==session||session.testing)return;const week=document.getElementById("weekSelect")?.value;if(week&&String(session.state.week)!==week)select(session,{...session.state,week});};
  document.addEventListener("weekChanged",session.weekChanged);
  if(session.testing)root.querySelectorAll('[data-fellowship-action="account"],[data-fellowship-action="profile"],[data-fellowship-action="people"]').forEach(control=>{control.disabled=true;control.title="Unavailable during read-only testing";});
  window.HGFellowshipActive=true;
  window.dispatchEvent(new Event("hg:fellowship-active"));
  session.click = event => {
    const button=event.target.closest('button');if(!button)return;
    if(session.menu?.contains(button)){session.menu.open=false;session.menu.querySelector('summary').focus();}
    if (button.dataset.fellowshipView) select(session,{view:button.dataset.fellowshipView,week:session.state.week});
    const action=button.dataset.fellowshipAction;
    if(session.testing&&['account','profile','people'].includes(action))return;
    if(action==='study')returnToStudy(session);
    if(action==='discussion-return'){const route=journey.discussionReturn();if(route)select(session,route);}
    if(action==='retry')render(session);
    if(action==='people')select(session,{view:'explore',section:'people',week:session.state.week});
    if(action==='account'||action==='profile')select(session,{view:session.state.view,section:action,week:session.state.week});
  };
  root.addEventListener('click',session.click);
  session.message=event=>{if(event.origin===location.origin && event.source===session.frame?.contentWindow && event.data?.messagingAction==='returnToStudy')returnToStudy(session);};
  window.addEventListener('message',session.message);
  session.theme = new MutationObserver(()=>themeFrame(session));
  session.theme.observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-hg-theme-diagnostic','data-hg-theme-preset']});
  session.unsubscribe=onAuthStateChanged(auth,user=>{
    if(active!==session||(user?.uid||null)!==(auth.currentUser?.uid||null))return;
    const context=session.routeCard==='fellowship-live'?journey.identity():null;
    const changed=session.authReady && (session.uid !== (user?.uid || null)||(context&&context.epoch!==session.contextEpoch));
    if(context)session.contextEpoch=context.epoch;
    session.uid=user?.uid || null;session.authReady=true;
    root.querySelector('[data-fellowship-account]').textContent=user && !user.isAnonymous ? 'Signed in. Your existing HomeGroups account is in use.' : 'You can explore and pray here. Sign in through Account to join communities or use messages.';
    if(changed || !session.frame)render(session);
  },()=>{
    if(active!==session)return;
    session.authReady=true;
    root.querySelector("[data-fellowship-account]").textContent="Your account could not be checked. Use Account to try again.";
    render(session);
  });
  session.unregister = window.HGRoute?.registerCard(session.routeCard,{getState:()=>session.state,capture:()=>captureView(session),restore:route=>{if(active===session && JSON.stringify(stateFor(route))!==JSON.stringify(session.state))return select(session,route,false);}});
  return render(session);
};
window.destroyFellowshipCard = function() {
  if(!active)return;
  const session=active;captureView(session);active=null;
  window.removeEventListener('hg:fellowship-context',session.contextChanged);
  session.unregister?.();session.unsubscribe?.();session.theme.disconnect();session.root.removeEventListener('click',session.click);window.removeEventListener('message',session.message);
  teardownView(session);
  document.removeEventListener("weekChanged",session.weekChanged);
  if(session.dockParent)session.dockParent.insertBefore(session.dock,session.dockNext?.parentNode===session.dockParent?session.dockNext:null);
  window.HGFellowshipActive=false;
  window.dispatchEvent(new Event("hg:fellowship-active"));
};
