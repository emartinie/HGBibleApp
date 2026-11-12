import {auth} from './firebase-init.js';
import {getIdTokenResult,onIdTokenChanged} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {authorizeFellowshipLive} from './fellowship-live-access.js';
let active;
function clear(session){window.destroyFellowshipCard?.();session.mounted=false;session.host.replaceChildren();}
function unavailable(session){
  clear(session);
  const section=document.createElement('section');section.className='hg-panel';
  const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Sign in to use Fellowship. Community and message permissions still apply.';
  const account=document.createElement('a'),url=new URL('/My%20Partner/collaboration/messaging/commons/auth/',location.origin);
  const back=new URL('/',location.origin);back.searchParams.set('card',session.closeExcursion?'mainstage':'fellowship-live');
  const week=window.HGRoute?.read().week;if(week)back.searchParams.set('week',week);
  url.searchParams.set('next',back.pathname+back.search);if(week)url.searchParams.set('week',week);
  account.href=url.href;account.className='ui-btn';account.textContent='Account / Sign in';
  const study=document.createElement('button');study.type='button';study.className='ui-btn';study.textContent='Return to study';study.onclick=()=>session.closeExcursion?session.closeExcursion():window.HGRoute?.navigate('mainstage',{week});
  section.append(status,account,study);session.host.append(section);
}
async function check(session,forceRefresh){
  const revision=++session.revision;session.abort?.abort();session.abort=new AbortController();
  // Account changes remove private UI before asynchronous checks; stable token refreshes retain drafts.
  if(session.uid!==auth.currentUser?.uid)clear(session);
  try{
    const grant=await authorizeFellowshipLive({auth,getIdTokenResult,signal:session.abort.signal,forceRefresh});
    if(active!==session||revision!==session.revision)return;
    session.uid=grant.uid;
    if(!session.mounted){
      const module=await import('./fellowship.js?v=shared-content-1');
      if(module.liveIntegrationVersion!==1)throw Error('Incompatible Fellowship module');
      const response=await fetch('cards/fellowship.html',{cache:'no-store',signal:session.abort.signal});
      if(!response.ok)throw Error('Fellowship unavailable');const html=await response.text();
      if(active!==session||revision!==session.revision||auth.currentUser?.uid!==grant.uid)return;
      session.host.innerHTML=html;session.mounted=true;
      await window.initFellowshipCard(session.host,{routeCard:'fellowship-live',prayerReadOnly:true,closeExcursion:session.closeExcursion});
    }
    if(active!==session||revision!==session.revision)return;
    clearTimeout(session.expiryTimer);
    // Public access has no time-limited expiry; token refresh still rechecks account identity.
  }catch(error){if(active===session&&revision===session.revision){clearTimeout(session.expiryTimer);unavailable(session);}}
}
window.initFellowshipLiveCard=function(host,{closeExcursion}={}){
  window.destroyFellowshipLiveCard();
  const session={host,closeExcursion,revision:0,mounted:false,uid:undefined};active=session;
  session.weekDock=closeExcursion?null:document.getElementById('weekCardDock');
  if(session.weekDock){
    session.weekDockBefore={hidden:session.weekDock.hidden,display:session.weekDock.style.getPropertyValue('display'),priority:session.weekDock.style.getPropertyPriority('display')};
    session.weekDock.hidden=true;session.weekDock.style.setProperty('display','none','important');
  }
  session.unsubscribe=onIdTokenChanged(auth,user=>{if(active===session&&(user?.uid||null)===(auth.currentUser?.uid||null))void check(session,false);});
  session.visibility=()=>{if(active===session&&document.visibilityState==='visible')void check(session,true);};
  document.addEventListener('visibilitychange',session.visibility);
  session.timer=setInterval(()=>{if(active===session)void check(session,true);},60000);
  return check(session,true);
};
window.destroyFellowshipLiveCard=function(){
  if(!active)return;const session=active;active=null;++session.revision;
  session.abort?.abort();session.unsubscribe?.();clearInterval(session.timer);clearTimeout(session.expiryTimer);
  document.removeEventListener('visibilitychange',session.visibility);clear(session);
  if(session.weekDock){
    session.weekDock.hidden=session.weekDockBefore.hidden;
    if(session.weekDockBefore.display)session.weekDock.style.setProperty('display',session.weekDockBefore.display,session.weekDockBefore.priority);
    else session.weekDock.style.removeProperty('display');
  }
};
