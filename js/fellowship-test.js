import {auth} from './firebase-init.js';
import {getIdTokenResult,onIdTokenChanged} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {authorizeFellowshipTest} from './fellowship-test-access.js';
let active=null;
function restoreTheme(session){for(const [key,value]of Object.entries(session.themeBefore)){if(value===null)document.documentElement.removeAttribute(key);else document.documentElement.setAttribute(key,value);}}
function message(session,text){session.host.innerHTML='';const status=document.createElement('section');status.className='hg-panel';status.setAttribute('role','status');const description=document.createElement('p');description.textContent=text;status.append(description);session.host.append(status);if(text==='Fellowship testing is unavailable.'){const back=document.createElement('button');back.type='button';back.className='ui-btn';back.textContent='Return to study';back.onclick=()=>window.HGRoute?.navigate('mainstage',{week:window.HGRoute.read().week});status.append(document.createElement('br'),back);}}
async function check(session,forceRefresh=false){
 const revision=++session.revision;clearTimeout(session.expiryTimer);session.abort?.abort();session.abort=new AbortController();
 window.destroyFellowshipCard?.();message(session,'Checking administrator testing access…');
 try{
  const grant=await authorizeFellowshipTest({auth,getIdTokenResult,signal:session.abort.signal,forceRefresh});
  const module=await import('./fellowship.js?v=controlled-readonly-1');
  if(active!==session||revision!==session.revision||auth.currentUser?.uid!==grant.uid)return;
  if(module.controlledFixturesVersion!==1)throw new Error('Incompatible test renderer');
  const response=await fetch('cards/fellowship.html',{cache:'no-store',signal:session.abort.signal});
  if(!response.ok)throw new Error('Unavailable renderer');const html=await response.text();
  if(active!==session||revision!==session.revision||auth.currentUser?.uid!==grant.uid)return;
  session.host.innerHTML=html;await window.initFellowshipCard(session.host,{readOnlyFixtures:true});
  session.expiryTimer=setTimeout(()=>{if(active===session){++session.revision;window.destroyFellowshipCard?.();restoreTheme(session);message(session,'Fellowship testing is unavailable.');}},Math.max(0,grant.expiresAt-Date.now()));
 }catch(error){if(active===session&&revision===session.revision){window.destroyFellowshipCard?.();restoreTheme(session);message(session,'Fellowship testing is unavailable.');}}
}
window.initFellowshipTestCard=async function(host){
 window.destroyFellowshipTestCard();const session={host,revision:0,themeBefore:Object.fromEntries(['data-hg-theme-preset','data-hg-theme-diagnostic'].map(key=>[key,document.documentElement.getAttribute(key)]))};active=session;
 session.card=host.closest('.card');session.card?.classList.add('fellowship-testing-card');
 session.weekControls=['prevWeek','nextWeek','weekSelect'].map(id=>document.getElementById(id)).filter(Boolean).map(control=>({control,disabled:control.disabled,title:control.title}));
 for(const {control}of session.weekControls){control.disabled=true;control.title='Week is fixed during read-only testing. Return to study to change it.';}
 await check(session,true);if(active!==session)return;
 // Re-check on identity/token changes and foregrounding; no sign-in/linking operation exists here.
 session.unsubscribe=onIdTokenChanged(auth,()=>{if(active===session)void check(session,false);});
 session.visibility=()=>{if(document.visibilityState==='visible'&&active===session)void check(session,true);};
 document.addEventListener('visibilitychange',session.visibility);
 session.timer=setInterval(()=>{if(active===session)void check(session,true);},60000);
};
window.destroyFellowshipTestCard=function(){if(!active)return;const session=active;active=null;++session.revision;session.abort?.abort();session.unsubscribe?.();clearInterval(session.timer);clearTimeout(session.expiryTimer);document.removeEventListener('visibilitychange',session.visibility);window.destroyFellowshipCard?.();restoreTheme(session);session.card?.classList.remove('fellowship-testing-card');for(const saved of session.weekControls||[]){saved.control.disabled=saved.disabled;saved.control.title=saved.title;}};
