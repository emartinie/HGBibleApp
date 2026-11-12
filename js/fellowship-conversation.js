import {auth, db} from './firebase-init.js';
import {beforeAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {doc, getDocFromServer, collection, getDocs, query, orderBy, limit, startAfter, setDoc, serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {onAuthStateChanged, onSnapshot, onCommonsDispose} from '../My%20Partner/collaboration/messaging/commons/commons-lifecycle.js';
import {addContentControl, sharedReading} from './commons-content.js';
import {explicitReadingLink} from './fellowship-context.js';

const areas = {projects:'Kingdom Projects', fellowship:'Personal Growth & Fellowship', prayer:'Prayer & Encouragement', study:'Bible Study & Investigation', discipleship:'Discipleship & Mentorship', family:'Marriage & Family'};
const params = new URLSearchParams(location.search), area = params.get('area'), postId = params.get('post');
const hasTarget = Object.hasOwn(areas, area) && /^[a-zA-Z0-9_-]{1,128}$/.test(postId || '');
const thread = document.getElementById('thread'), notice = document.getElementById('notice');
const form = document.getElementById('composer'), input = document.getElementById('message'), more = document.getElementById('more');
const send = form.querySelector('[type=submit]');
let session = null, disposed = false, pendingView = null;
const current = s => !disposed && session === s && auth.currentUser?.uid === s.uid && !auth.currentUser.isAnonymous;
const allowed = (s, epoch) => current(s) && s.allowed && (epoch === undefined || s.epoch === epoch);
const draftKey = s => 'hg-commons-draft:v1:' + s.uid + ':' + area + ':reply:' + postId;
function saveDraft(s, value) {
  try { if (value) sessionStorage.setItem(draftKey(s), value); else sessionStorage.removeItem(draftKey(s)); } catch {}
}
function say(message) { notice.textContent = message; }
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
function parseBody(value) {
  let body = String(value || '').replace(/^\[HG-TOPIC:[^\]\n]+\]\n/, ''), title = '';
  const match = body.match(/^\[HG-TITLE:([^\]\n]{1,90})\]\n/);
  if (match) { title = match[1]; body = body.slice(match[0].length); }
  return {title, body};
}
function composerEnabled(enabled) {
  form.hidden = !enabled;
  for (const control of form.querySelectorAll('input, textarea, select, button')) control.disabled = !enabled;
  if (!enabled) form.querySelector('details').open = false;
}
function clearThread(s, message, forgetDraft = false) {
  s.epoch++;
  s.allowed = false;
  s.post = null;
  s.initialLoaded = false;
  s.replies.clear();
  s.pending = null;
  s.loading = false;
  s.sending = false;
  input.value = '';
  input.style.height = '42px';
  if (forgetDraft) saveDraft(s, '');
  thread.replaceChildren();
  more.hidden = true;
  composerEnabled(false);
  document.getElementById('heading').textContent = 'Conversation';
  say(message);
}
function endSession(forgetDraft = false) {
  if (!session) return;
  const old = session;
  clearThread(old, '', forgetDraft);
  session = null;
  old.stopMembership?.();
  pendingView = null;
}
onCommonsDispose(() => {
  disposed = true;
  endSession();
  window.HGDiscussionView = null;
});
// Invalidate before auth changes, including A-B-A transitions while reads are pending.
const stopGuard = beforeAuthStateChanged(auth, user => {
  if (session && (user?.uid !== session.uid || user?.isAnonymous)) endSession(true);
});
onCommonsDispose(stopGuard);

function privateMessage(data, s) {
  const uid = typeof data.uid === 'string' ? data.uid : '';
  if (!allowed(s) || !/^[A-Za-z0-9]{15,128}$/.test(uid) || uid === s.uid) return null;
  // Use the existing request/acceptance screen; it remains the permission boundary.
  const url = new URL('/My%20Partner/collaboration/messaging/commons/direct-live/', location.origin);
  url.searchParams.set('to', uid);
  const name = typeof data.authorName === 'string' ? data.authorName.trim().slice(0,80) : '';
  if (name) url.searchParams.set('name', name);
  if (params.get('week')) url.searchParams.set('week', params.get('week'));
  const link = el('a', 'private-message', 'Message privately');
  link.href = url.href;
  link.dataset.privateMessage = '';
  link.title = 'Request a private conversation with ' + (name || 'this member');
  return link;
}
function renderMessage(data, s, opening = false) {
  const article = el('article', 'message' + (data.uid === s.uid ? ' mine' : ''));
  const avatar = el('div', 'avatar', (data.authorName || 'H').slice(0,1).toUpperCase());
  const content = el('div', 'message-content');
  const byline = el('p', 'byline', (data.authorName || 'HomeGroups member') + ' · ' + (data.createdAt?.toDate?.().toLocaleString() || 'Recently'));
  const action = privateMessage(data, s);
  if (action) byline.append(document.createTextNode(' · '), action);
  const parsed = opening ? parseBody(data.body) : {title:'', body:String(data.body || '')};
  const reading = sharedReading(parsed.body), bubble = el('div', 'bubble');
  if (parsed.title) bubble.append(el('strong', '', parsed.title), document.createElement('div'));
  bubble.append(document.createTextNode(reading?.text ?? parsed.body));
  if (reading) {
    const link = el('a', 'attachment');
    link.href = reading.url.href;
    link.target = '_top';
    link.dataset.sharedReading = '';
    link.append(el('strong', '', reading.label), el('small', '', 'Open HomeGroups content'));
    bubble.append(link);
  }
  content.append(byline, bubble);
  article.append(avatar, content);
  return article;
}
const millis = data => data.createdAt?.toMillis?.() ?? data.createdAt?.toDate?.().getTime() ?? 0;
function render(s) {
  if (!allowed(s) || !s.post) return;
  thread.replaceChildren(renderMessage(s.post, s, true));
  for (const [, data] of [...s.replies].sort((a,b) => millis(a[1]) - millis(b[1]) || a[0].localeCompare(b[0]))) thread.append(renderMessage(data, s));
}
function restorePosition(s) {
  if (!allowed(s) || !s.post || !s.initialLoaded || !pendingView || pendingView.uid !== s.uid) return false;
  thread.scrollTop = pendingView.scrollTop;
  pendingView = null;
  return true;
}
window.HGDiscussionView = {
  capture() {
    const s = session;
    if (!s || !allowed(s) || !s.post) return null;
    return {uid:s.uid, post:postId, scrollTop:thread.scrollTop, replyCount:s.replies.size, reading:explicitReadingLink(s.post.body)};
  },
  restore(value, uid) {
    if (!value || value.post !== postId || !Number.isFinite(Number(value.scrollTop))) return;
    pendingView = {uid, scrollTop:Math.max(0, Math.min(1e7, Number(value.scrollTop))), replyCount:Math.max(0, Math.min(10000, Number(value.replyCount) || 0))};
    if (session && !session.loading) {
      if (pendingView.replyCount > session.replies.size && !more.hidden) loadReplies(session, true);
      else restorePosition(session);
    }
  }
};
async function loadReplies(s, initial = false) {
  if (!allowed(s) || s.loading) return;
  const epoch = s.epoch;
  s.loading = true;
  more.disabled = true;
  const oldHeight = thread.scrollHeight, oldTop = thread.scrollTop;
  try {
    const path = collection(db, 'commonsCommunityPosts', area, 'posts', postId, 'replies');
    // Start with the newest page. Older pages prepend in chronological display order.
    const snap = await getDocs(query(path, orderBy('createdAt', 'desc'), ...(s.cursor ? [startAfter(s.cursor)] : []), limit(30)));
    if (!allowed(s, epoch)) return;
    s.cursor = snap.docs.at(-1) || s.cursor;
    s.initialLoaded = true;
    for (const item of snap.docs) s.replies.set(item.id, item.data());
    more.hidden = snap.size < 30;
    render(s);
    if (pendingView?.uid === s.uid && pendingView.replyCount > s.replies.size && !more.hidden) {
      s.loading = false;
      await loadReplies(s, true);
      return;
    }
    if (!restorePosition(s)) thread.scrollTop = initial ? thread.scrollHeight : oldTop + thread.scrollHeight - oldHeight;
    window.dispatchEvent(new Event('hg:discussion-ready'));
  } catch (error) {
    if (allowed(s, epoch)) {
      if (error.code === 'permission-denied') clearThread(s, 'Community access could not be verified.', true);
      else say('Unable to load replies: ' + (error.code || error.message));
    }
  } finally {
    if (allowed(s, epoch)) { s.loading = false; more.disabled = false; }
  }
}
async function loadThread(s) {
  const epoch = s.epoch;
  try {
    const snap = await getDocFromServer(doc(db, 'commonsCommunityPosts', area, 'posts', postId));
    if (!allowed(s, epoch)) return;
    if (!snap.exists()) { clearThread(s, 'Conversation unavailable.'); return; }
    s.post = snap.data();
    document.getElementById('heading').textContent = parseBody(s.post.body).title || 'Conversation';
    try { input.value = sessionStorage.getItem(draftKey(s)) || ''; } catch { input.value = ''; }
    composerEnabled(true);
    say('');
    render(s);
    await loadReplies(s, true);
  } catch (error) {
    if (allowed(s, epoch)) clearThread(s, 'Conversation unavailable: ' + (error.code || error.message));
  }
}
async function showInbox(s) {
  document.getElementById('heading').textContent = 'Conversations';
  say('Loading conversations…');
  const entries = [];
  let errors = 0;
  for (const [key, label] of Object.entries(areas)) {
    try {
      const member = await getDocFromServer(doc(db, 'commonsCommunityMembers', key, 'members', s.uid));
      if (!current(s)) return;
      if (!member.exists()) continue;
      const snap = await getDocs(query(collection(db, 'commonsCommunityPosts', key, 'posts'), orderBy('createdAt','desc'), limit(12)));
      if (!current(s)) return;
      for (const item of snap.docs) entries.push({area:key, label, id:item.id, data:item.data()});
    } catch { errors++; }
  }
  if (!current(s)) return;
  entries.sort((a,b) => millis(b.data) - millis(a.data));
  for (const item of entries) {
    const link = el('a', 'inbox-item');
    link.href = '?area=' + encodeURIComponent(item.area) + '&post=' + encodeURIComponent(item.id);
    link.append(el('strong', '', parseBody(item.data.body).title || item.label), el('small', '', item.label), el('span', '', parseBody(item.data.body).body.slice(0,125)));
    thread.append(link);
  }
  say(entries.length ? '' : errors ? 'Some conversations could not be loaded.' : 'No conversations yet. Join a community to read and reply.');
}
function start(user) {
  if ((user?.uid || null) !== (auth.currentUser?.uid || null)) return;
  if (disposed || (session && current(session) && session.uid === user?.uid)) return;
  endSession(true);
  if (!user || user.isAnonymous) { say('Sign in with your HomeGroups account to view conversations.'); return; }
  const s = {uid:user.uid, epoch:0, allowed:false, post:null, replies:new Map(), cursor:null, loading:false, sending:false, pending:null};
  session = s;
  if (!hasTarget) { showInbox(s); return; }
  document.getElementById('subheading').textContent = areas[area];
  say('Checking community access…');
  s.stopMembership = onSnapshot(doc(db, 'commonsCommunityMembers', area, 'members', user.uid), {includeMetadataChanges:true}, snapshot => {
    if (!current(s)) return;
    if (snapshot.metadata?.fromCache || !snapshot.exists()) {
      clearThread(s, snapshot.metadata?.fromCache ? 'Connect to verify your community access.' : 'Join this community before viewing its conversations.', true);
      return;
    }
    if (s.allowed) return;
    s.allowed = true;
    s.epoch++;
    s.cursor = null;
    loadThread(s);
  }, () => { if (current(s)) clearThread(s, 'Community access could not be verified.', true); });
}

input.addEventListener('input', () => {
  input.style.height = '42px';
  input.style.height = Math.min(116, Math.max(42, input.scrollHeight)) + 'px';
  if (session && allowed(session)) saveDraft(session, input.value);
});
const attachment = addContentControl(input, params.get('week')), popover = el('div', 'attachment-popover');
for (const child of [...attachment.children].slice(1)) popover.append(child);
attachment.append(popover);
document.getElementById('attachment').append(attachment);
composerEnabled(false);
more.onclick = () => { if (session) loadReplies(session); };
form.addEventListener('submit', async event => {
  event.preventDefault();
  const s = session, draft = input.value, body = draft.trim();
  if (!s || !allowed(s) || !s.post || s.sending || !body || body.length > 1200) return;
  const epoch = s.epoch;
  s.sending = true;
  send.disabled = true;
  try {
    const profile = await getDocFromServer(doc(db, 'commonsMembers', s.uid));
    if (!allowed(s, epoch)) return;
    const name = (profile.exists() ? profile.data().displayName : auth.currentUser.displayName) || 'HomeGroups member';
    const key = JSON.stringify([s.uid, area, postId, body]);
    if (!s.pending || s.pending.key !== key) {
      const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2,'0')).join('');
      s.pending = {key, id, ref:doc(db, 'commonsCommunityPosts', area, 'posts', postId, 'replies', id)};
    }
    const attempt = s.pending;
    const existing = await getDocFromServer(attempt.ref);
    if (!allowed(s, epoch)) return;
    // Recheck with the server immediately before writing; a cached membership is insufficient.
    const member = await getDocFromServer(doc(db, 'commonsCommunityMembers', area, 'members', s.uid));
    if (!allowed(s, epoch)) return;
    if (!member.exists()) { clearThread(s, 'Join this community before replying.', true); return; }
    if (existing.exists()) {
      if (existing.data().uid !== s.uid || existing.data().body !== body) throw Error('Saved reply differs from the draft.');
    } else {
      await setDoc(attempt.ref, {uid:s.uid, authorName:String(name).slice(0,80), body, createdAt:serverTimestamp()});
    }
    if (!allowed(s, epoch)) return;
    // Keep the acknowledged reply visible regardless of the current pagination cursor.
    const date = new Date();
    s.replies.set(attempt.id, existing.exists() ? existing.data() : {uid:s.uid, authorName:String(name).slice(0,80), body, createdAt:{toDate:() => date, toMillis:() => date.getTime()}});
    s.pending = null;
    if (input.value === draft) { input.value = ''; input.style.height = '42px'; saveDraft(s, ''); }
    render(s);
    thread.scrollTop = thread.scrollHeight;
    say('Reply posted.');
  } catch (error) {
    if (allowed(s, epoch)) {
      if (error.code === 'permission-denied') clearThread(s, 'Community access could not be verified.', true);
      else say('Reply not saved: ' + (error.code || error.message));
    }
  } finally {
    if (allowed(s, epoch)) { s.sending = false; send.disabled = false; }
  }
});
onAuthStateChanged(auth, start, () => {
  endSession(true);
  say('Unable to check your account.');
});
