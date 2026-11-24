import {auth} from './firebase-init.js';
import {beforeAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut,sendSignInLinkToEmail,isSignInWithEmailLink,signInWithEmailLink,linkWithPopup,linkWithCredential,EmailAuthProvider} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {createCommonsLifecycle} from '../My%20Partner/collaboration/messaging/commons/commons-lifecycle.js';
export function mountAccount(root,options={}) {
  const {onAuthStateChanged,onCommonsDispose,dispose}=createCommonsLifecycle();

  const $=id=>root.querySelector('#'+id),status=$('status');
  const pendingKey='hg-commons-email-link-pending';
  let disposed=false;
  let busy=false,finishing=isSignInWithEmailLink(auth,location.href),authRevision=0,observedUid=auth.currentUser?.uid||null;
  onCommonsDispose(()=>{disposed=true;authRevision++;});
  function operationContext(){
   const uid=auth.currentUser?.uid||null,revision=authRevision;
   const active=()=>!disposed&&revision===authRevision&&uid===(auth.currentUser?.uid||null);
   // A sign-in/sign-out may make one expected transition. A later same-UID
   // session is not the initiating session, even when its UID matches.
   active.afterTransition=nextUid=>{
    if(disposed||(auth.currentUser?.uid||null)!==nextUid)return false;
    if(uid===nextUid)return active();
    return (authRevision===revision&&observedUid===uid)
      ||(authRevision===revision+1&&observedUid===nextUid);
   };
   return active;
  }
  function safeDestination(value){
   if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return null;
   try{
    const url=new URL(value,location.origin),base='/My%20Partner/collaboration/messaging/commons/';
    if(url.origin!==location.origin)return null;
    // Only the fixed pilot route may return to the app shell; discard arbitrary parameters.
    if(url.pathname==='/'&&url.searchParams.get('card')==='fellowship-live'){
      const destination=new URL('/',location.origin);destination.searchParams.set('card','fellowship-live');
      const week=url.searchParams.get('week');if(/^([1-9]|[1-4][0-9]|5[0-2])$/.test(week||''))destination.searchParams.set('week',week);
      return destination.pathname+destination.search;
    }
    const allowed=['auth','member','directory','conversations','activity','direct','direct-live'];
    if(url.pathname!=='/find-users/'&&!allowed.some(page=>url.pathname===base+page+'/'||url.pathname===base+page+'/index.html'))return null;
    return url.pathname+url.search+url.hash;
   }catch{return null;}
  }
  const params=new URLSearchParams(options.search ?? location.search),safeNext=safeDestination(params.get('next'));
  if(safeNext)$('continue').href=safeNext;
  function say(s){status.textContent=s;}
  async function guardedSignIn(active,authenticate){
   const stop=beforeAuthStateChanged(auth,user=>{
    if(user&&!active())throw Error('Your account changed while authentication was pending. Start sign-in again.');
   });
   try{return await authenticate();}finally{stop();}
  }
  function controls(){for(const id of ['google','linkGoogle','emailSend','linkEmailSend','signout'])$(id).disabled=busy||finishing;}
  function methods(user){return [...new Set(user.providerData.map(x=>x.providerId))].map(x=>x==='google.com'?'Google':x==='password'?'Email':x).join(', ')||'Email link or existing session';}
  function render(user){
   $('guest').hidden=!!user;$('member').hidden=!user;
   $('account').textContent=user?(user.displayName||user.email||'HomeGroups member')+(options.embedded?'':' · Member ID: '+user.uid):'';
   $('providers').textContent=user?'Connected providers: '+methods(user):'';
   $('linkGoogle').hidden=!!user?.providerData.some(x=>x.providerId==='google.com');
   $('linkEmailForm').hidden=!!user?.providerData.some(x=>x.providerId==='password');controls();
  }
  function error(e){
   const collision=['auth/credential-already-in-use','auth/email-already-in-use','auth/account-exists-with-different-credential'].includes(e?.code);
   say(collision?'This sign-in method belongs to another account. No accounts were merged. Sign in to that account separately, or contact HomeGroups for help.':'Authentication did not complete: '+(e?.code||e?.message||e));
  }
  function readPending(){try{return JSON.parse(sessionStorage.getItem(pendingKey)||'null');}catch{return null;}}
  function removePending(request,active){if(!active())return;try{if(readPending()?.request===request&&active())sessionStorage.removeItem(pendingKey);}catch{}}
  async function action(fn){
   if(busy||finishing)return;
   const active=operationContext();busy=true;controls();
   try{await auth.authStateReady();if(!active())return;await fn(active);}
   catch(e){if(active())error(e);}
   finally{busy=false;controls();}
  }
  onAuthStateChanged(auth,user=>{if((user?.uid||null)!==(auth.currentUser?.uid||null))return;const uid=user?.uid||null,changed=uid!==observedUid;if(changed){observedUid=uid;authRevision++;$('email').value='';$('linkEmail').value='';}render(user);if(changed||(!busy&&!finishing))say(user?(options.embedded?'You are signed in to HomeGroups.':'You are signed in to HomeGroups. Continue to Messaging when ready.'):'Choose how you would like to sign in.');});
  $('google').onclick=()=>action(async active=>{if(auth.currentUser)throw Error('Sign out before signing in as another account.');const result=await guardedSignIn(active,()=>signInWithPopup(auth,new GoogleAuthProvider()));if(result?.user&&active.afterTransition(result.user.uid)){const completed=operationContext();if(completed())say('Google sign-in complete.');}});
  $('linkGoogle').onclick=()=>action(async active=>{
   const user=auth.currentUser;if(!user)throw Error('Sign in before linking another method.');
   await linkWithPopup(user,new GoogleAuthProvider());
   if(active()){render(auth.currentUser);say('Google linked to your existing member account.');}
  });
  async function send(email,mode,active){
   const user=auth.currentUser;
   if(mode==='link'&&!user)throw Error('Sign in before linking another method.');
   if(mode==='signin'&&user)throw Error('Sign out before signing in as another account.');
   const request=crypto.randomUUID(),url=new URL('/My%20Partner/collaboration/messaging/commons/auth/',location.origin);
   url.searchParams.set('emailMode',mode);url.searchParams.set('emailRequest',request);
   if(safeNext)url.searchParams.set('next',safeNext);
   // Save before sending so blocked storage cannot leave a linking email with no intent record.
   sessionStorage.setItem(pendingKey,JSON.stringify({version:2,email,mode,uid:user?.uid||null,request,createdAt:Date.now()}));
   try{await sendSignInLinkToEmail(auth,email,{url:url.href,handleCodeInApp:true});}
   catch(e){if(active())removePending(request,active);throw e;}
   if(!active())return;
   say('Check '+email+' for your HomeGroups '+(mode==='link'?'account-linking':'sign-in')+' link. '+(mode==='link'?'Open it in this same tab while signed in.':'Open it to finish signing in.'));
  }
  $('emailForm').onsubmit=e=>{e.preventDefault();const email=$('email').value.trim();return action(active=>send(email,'signin',active));};
  $('linkEmailForm').onsubmit=e=>{e.preventDefault();const email=$('linkEmail').value.trim();return action(active=>send(email,'link',active));};
  $('signout').onclick=()=>action(async active=>{await signOut(auth);if(active.afterTransition(null)){const completed=operationContext();if(completed())say('You are signed out.');}});
  async function finishEmail(){
   if(!finishing)return;controls();let active=operationContext();
   try{
    await auth.authStateReady();
    active=operationContext();
    if(!active())return;
    const mode=params.get('emailMode'),request=params.get('emailRequest'),saved=readPending(),user=auth.currentUser;
    const matches=saved?.version===2&&saved.request===request&&saved.mode===mode&&typeof saved.email==='string'&&saved.email.trim()&&Number.isFinite(saved.createdAt)&&Date.now()>=saved.createdAt&&Date.now()-saved.createdAt<=30*60*1000;
    if(mode==='link'){
     if(!matches||!user||saved.uid!==user.uid){say('This linking request cannot be verified in this tab and account. Return to the original account and request a new linking email. No sign-in or account switch was attempted.');return;}
     if(!confirm('Link '+saved.email+' to the HomeGroups account '+(user.email||user.uid)+'?')){say('Email linking cancelled. Your account is unchanged.');return;}
     if(!active())throw Error('Your account changed. Request a fresh linking email.');
     await linkWithCredential(user,EmailAuthProvider.credentialWithLink(saved.email,location.href));
     if(!active())return;
     render(auth.currentUser);say('Email linked to your existing HomeGroups account.');
    }else if(mode==='signin'){
     if(user){say('An account is already signed in. Sign out explicitly before using this sign-in link, or request an account-linking email from Account. No account switch was attempted.');return;}
     if(saved?.request===request&&!matches){say('This email request has expired or is invalid. Request a fresh sign-in email.');return;}
     const email=matches?saved.email:prompt('Confirm the email address that requested this sign-in link:');
     if(!email?.trim()){say('Email confirmation is required to finish this sign-in.');return;}
     if(!confirm('Sign in to HomeGroups as '+email.trim()+'?')){say('Email sign-in cancelled.');return;}
     if(auth.currentUser)throw Error('An account signed in while this link was open. Sign out explicitly before switching.');
     const result=await guardedSignIn(active,()=>signInWithEmailLink(auth,email.trim(),location.href));
     if(!result?.user||!active.afterTransition(result.user.uid))return;
     active=operationContext();
     if(!active())return;render(auth.currentUser);if(!active())return;say('Email sign-in complete.');
    }else{say('This older email link has no verifiable action. Request a fresh sign-in or linking email from Account.');return;}
    if(!active())return;
    removePending(request,active);
    const clean=new URL('/My%20Partner/collaboration/messaging/commons/auth/',location.origin);if(safeNext)clean.searchParams.set('next',safeNext);
    if(!active())return;
    history.replaceState(null,'',clean.pathname+clean.search);
   }catch(e){if(active())error(e);}finally{finishing=false;controls();}
  }
  const ready=finishEmail();
  return {dispose,ready,safeDestination};
}
