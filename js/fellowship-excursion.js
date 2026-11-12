const launch = document.getElementById('mainStageFellowshipPilot');
import {auth} from './firebase-init.js';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Authentication belongs to HomeGroups, not to an individual feature.
const signIn = document.createElement('a');
signIn.id = 'homegroupsSignIn';
signIn.className = 'ui-btn utility-btn';
signIn.textContent = 'Sign In';
signIn.href = '/My%20Partner/collaboration/messaging/commons/auth/?next=%2F%3Fcard%3Dfellowship-live';
signIn.style.cssText = 'white-space:nowrap;min-height:40px;display:inline-flex;align-items:center';
const topBar = document.querySelector('#topBar .card-control-bar');
const about = document.getElementById('aboutHomeGroupsBtn');
if (about) about.before(signIn); else topBar?.append(signIn);
onAuthStateChanged(auth,user=>{signIn.hidden=Boolean(user&&!user.isAnonymous);});


if (launch) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fellowship-excursion';
  dialog.setAttribute('aria-labelledby', 'fellowshipExcursionTitle');
  dialog.innerHTML = '<header><strong id="fellowshipExcursionTitle">Fellowship</strong><button class="ui-btn" type="button" autofocus>Close Fellowship</button></header><div class="fellowship-excursion-content"></div>';
  const host = dialog.lastElementChild;
  const authUrl = '/My%20Partner/collaboration/messaging/commons/auth/?next=%2F%3Fcard%3Dfellowship-live';
  function showSignIn(){
    host.replaceChildren();
    const prompt=document.createElement('section');prompt.className='hg-panel';
    const heading=document.createElement('h2');heading.textContent='Welcome to Fellowship';
    const description=document.createElement('p');description.textContent='Sign in to participate in conversations and private messages.';
    const link=document.createElement('a');link.className='ui-btn';link.href=authUrl;link.textContent='Sign In';
    prompt.append(heading,description,link);host.append(prompt);
  }
  let dispose;
  let opening = 0;

  function close() {
    ++opening;
    dispose?.();
    dispose = undefined;
    if (dialog.open) dialog.close();
  }

  dialog.querySelector('button').onclick = close;
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    if (window.HGRoute?.read()?.card === 'mainstage') launch.focus({preventScroll:true});
  });
  window.addEventListener('hg:routechange', event => {
    if (dialog.open && event.detail.route.card !== 'mainstage') close();
  });
  document.body.append(dialog);

  launch.addEventListener('click', async () => {
    if (dialog.open || window.HGFellowshipActive) return;
    const request = ++opening;
    host.textContent = 'Opening Fellowship…';
    dialog.showModal();
    await auth.authStateReady();
    if (!dialog.open || request !== opening) return;
    if (!auth.currentUser || auth.currentUser.isAnonymous) { showSignIn(); return; }
    try {
      await import('./fellowship-live.js?v=shared-content-1');
      if (!dialog.open || request !== opening) return;
      dispose = window.destroyFellowshipLiveCard;
      await window.initFellowshipLiveCard(host, {closeExcursion:close});
    } catch {
      if (request === opening) host.textContent = 'Fellowship could not load. Close it and try again.';
    }
  });
}
