import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const memoryDrafts = new Map();
const ROOT = new URL('../../../../../', import.meta.url);

function node(tag, text) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
}

function readDraft(key) {
  if (memoryDrafts.has(key)) return memoryDrafts.get(key);
  try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
}

export function createConversationForm({ auth, db, area, displayName, context, isCurrent, onBack, onPosted }) {
  const uid = auth.currentUser?.uid;
  if (!uid || !context || ![1, 2].includes(Number(context.week))) throw Error('Sign in and select Week 1 or Week 2 first.');
  const week = Number(context.week);
  const key = 'hg-commons-starter:v1:' + JSON.stringify([uid, area, week]);
  const reading = new URL(ROOT);
  reading.searchParams.set('card', 'mainstage');
  reading.searchParams.set('week', String(week));
  const form = node('form');
  form.className = 'new-conversation';
  form.setAttribute('aria-label', 'Start conversation');
  const heading = node('h3', 'Start conversation');
  const scope = node('p', 'In Bible Study & Investigation · Week ' + week + ' — ' + context.title);
  scope.className = 'context-hint';
  const titleLabel = node('label', 'Conversation title');
  const title = node('input');
  title.id = 'new-conversation-title'; title.type = 'text'; title.maxLength = 90; title.required = true;
  title.placeholder = 'What would you like to discuss?'; titleLabel.htmlFor = title.id;
  const messageLabel = node('label', 'Opening message');
  const message = node('textarea');
  message.id = 'new-conversation-message'; message.maxLength = 1200; message.required = true;
  message.placeholder = 'Ask a question or share what you’re noticing…'; messageLabel.htmlFor = message.id;
  const sourceLabel = node('p', 'Linked to Week ' + week + '. The study link is included with your conversation.');
  sourceLabel.className = 'context-hint';
  const counter = node('p'); counter.className = 'context-hint';
  const status = node('p'); status.className = 'context-hint'; status.setAttribute('role', 'status');
  const privacy = node('p', 'Visible to members of Bible Study & Investigation. Sent conversations cannot be edited or deleted in this pilot.');
  privacy.className = 'context-hint';
  const actions = node('div'); actions.className = 'row';
  const back = node('button', 'Back to discussions'); back.type = 'button';
  const submit = node('button', 'Post conversation'); submit.type = 'submit'; submit.className = 'start-conversation';
  actions.append(back, submit);
  form.append(heading, scope, titleLabel, title, messageLabel, message, sourceLabel, counter, status, privacy, actions);
  const draft = readDraft(key);
  title.value = typeof draft?.title === 'string' ? draft.title : '';
  message.value = typeof draft?.message === 'string' ? draft.message : '';
  status.textContent = draft ? 'Your unfinished conversation is restored.' : 'Drafts stay with this account in this browser tab.';
  let sending = false;
  const values = () => ({ title: title.value, message: message.value });
  const encoded = () => '[HG-TITLE:' + title.value.trim() + ']\n' + message.value.trim() + '\n\nReading: ' + reading.href;
  function saveDraft() {
    const value = values(); memoryDrafts.set(key, value);
    try { sessionStorage.setItem(key, JSON.stringify(value)); status.textContent = 'Draft saved in this browser tab.'; }
    catch { status.textContent = 'Draft kept in this open Messaging window. Browser storage is unavailable.'; }
  }
  function count() {
    const length = encoded().length;
    counter.textContent = length + ' / 1,200 characters including the title and study link.';
    submit.disabled = sending || length > 1200;
  }
  for (const input of [title, message]) input.addEventListener('input', () => { saveDraft(); count(); });
  back.onclick = () => { saveDraft(); if (isCurrent()) onBack(); };
  form.onsubmit = async event => {
    event.preventDefault();
    if (sending || !isCurrent() || auth.currentUser?.uid !== uid) return;
    const name = title.value.trim(), text = message.value.trim(), body = encoded();
    if (!name || name.length > 90 || /[\]\r\n]/.test(name)) { status.textContent = 'Enter a title of up to 90 characters without ] or line breaks.'; return; }
    if (!text || body.length > 1200) { status.textContent = 'Enter a message and keep the total under 1,201 characters.'; return; }
    saveDraft();
    const captured = JSON.stringify(values());
    sending = true;
    for (const input of [title, message, back]) input.disabled = true;
    count(); status.textContent = 'Posting conversation…';
    const data = { uid, authorName: String(displayName || auth.currentUser.displayName || 'HomeGroups member').slice(0, 80), body, createdAt: serverTimestamp() };
    try {
      const created = await addDoc(collection(db, 'commonsCommunityPosts', area, 'posts'), data);
      if (JSON.stringify(readDraft(key)) === captured) {
        memoryDrafts.delete(key);
        try { sessionStorage.removeItem(key); } catch { /* Memory draft was cleared after confirmed send. */ }
      }
      if (isCurrent() && auth.currentUser?.uid === uid) onPosted({ id: created.id, data: () => data });
    } catch (error) {
      if (isCurrent()) status.textContent = error.code === 'permission-denied'
        ? 'Conversation wasn’t posted. Your draft is kept. Check your Bible Study & Investigation membership or try again later.'
        : 'Conversation wasn’t posted. Your draft is kept; try again when you’re connected.';
    } finally {
      sending = false;
      for (const input of [title, message, back]) input.disabled = false;
      count();
    }
  };
  count();
  return form;
}
