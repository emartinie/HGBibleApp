import { BOOK_MAP } from './scripture-books.js';
import { discussionReading, studyReadingUrl, studyWeeks } from './study-reference.js';

const root = new URL('../', import.meta.url);
const readingLine = /(?:^|\n)Reading: (https?:\/\/[^\s]+)\s*$/;
const versions = ['KJV', 'AMP', 'NASB'];

export function sharedReading(body) {
  const match = String(body ?? '').match(readingLine);
  if (!match) return null;
  let url;
  try { url = new URL(match[1]); } catch { return null; }
  if (url.origin !== root.origin || ![root.pathname, root.pathname + 'index.html'].includes(url.pathname) || url.username || url.password) return null;
  const study = discussionReading(body, root);
  if (study) return { url: study, label: 'Open the original study', text: body.slice(0, match.index).trimEnd() };
  const ref = url.searchParams.get('ref')?.match(/^([1-3]?\s*[A-Za-z ]+) ([1-9]\d{0,2})(?::([1-9]\d{0,2}))?$/);
  if (url.searchParams.get('card') !== 'scriptureapi' || !ref || !Object.hasOwn(BOOK_MAP, ref[1].toLowerCase())) return null;
  const version = url.searchParams.get('version');
  const canonical = scriptureUrl(ref[0], versions.includes(version) ? version : 'KJV');
  return { url: canonical, label: 'Read ' + ref[0], text: body.slice(0, match.index).trimEnd() };
}

function scriptureUrl(ref, version) {
  const url = new URL(root);
  url.search = new URLSearchParams({ card: 'scriptureapi', ref, version });
  return url;
}

export function addContentControl(textarea, week) {
  const controls = document.createElement('details');
  controls.className = 'add-content';
  controls.innerHTML = `
    <summary>＋ Add Content</summary>
    <div class="add-content-choices">
      <p>What would you like to share?</p>
      <div class="add-content-row">
        <button type="button" data-choice="scripture">Scripture Passage</button>
        <button type="button" data-choice="study">Weekly Study</button>
      </div>
    </div>
    <div data-panel="scripture" class="add-content-row" hidden><label>Book <select data-book aria-label="Book"></select></label><label>Chapter <input data-chapter type="text" inputmode="numeric" maxlength="3" value="1"></label><label>Verse (optional) <input data-verse type="text" inputmode="numeric" maxlength="3"></label><label>Translation <select data-version aria-label="Translation"><option>KJV</option><option>AMP</option><option>NASB</option></select></label></div>
    <div data-panel="study" class="add-content-row" hidden><label>Weekly study <select data-week aria-label="Weekly study"></select></label></div>
    <div class="add-content-row add-content-actions">
      <button type="button" data-confirm hidden>Add to message</button>
      <button type="button" data-back hidden>Back</button>
      <button type="button" data-cancel>Cancel</button>
    </div>
    <p role="status"></p>`;
  const book = controls.querySelector('[data-book]');
  for (const name of Object.keys(BOOK_MAP)) {
    if (name === 'psalm') continue;
    const label = name.replace(/\b[a-z]/g, letter => letter.toUpperCase());
    book.add(new Option(label, label));
  }
  const chapter = controls.querySelector('[data-chapter]');
  const verse = controls.querySelector('[data-verse]');
  const status = controls.querySelector('[role=status]');
  const summary = controls.querySelector('summary');
  const choices = controls.querySelector('.add-content-choices');
  const confirm = controls.querySelector('[data-confirm]');
  const back = controls.querySelector('[data-back]');
  const panels = [...controls.querySelectorAll('[data-panel]')];
  let selection;
  let choiceButton;
  function show(type) {
    selection = type;
    choices.hidden = Boolean(type);
    confirm.hidden = back.hidden = !type;
    for (const panel of panels) panel.hidden = panel.dataset.panel !== type;
    status.textContent = '';
  }
  for (const button of choices.querySelectorAll('[data-choice]')) {
    button.onclick = () => {
      choiceButton = button;
      show(button.dataset.choice);
      panels.find(panel => !panel.hidden).querySelector('select').focus();
    };
  }
  back.onclick = () => { show(); choiceButton?.focus(); };
  const finish = () => { controls.open = false; show(); summary.focus(); };
  controls.addEventListener('toggle', () => { if (!controls.open) show(); });
  function insert(url, name) {
    const text = sharedReading(textarea.value)?.text ?? textarea.value.trimEnd();
    const value = (text ? text + '\n\n' : '') + 'Reading: ' + url.href;
    if (value.length > textarea.maxLength) {
      status.textContent = 'Shorten your message before adding this resource.';
      return;
    }
    textarea.value = value;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    status.textContent = 'Added ' + name + '.';
    finish();
  }
  function addScripture() {
    if (!/^[1-9]\d{0,2}$/.test(chapter.value) || (verse.value && !/^[1-9]\d{0,2}$/.test(verse.value))) {
      status.textContent = 'Enter a valid chapter and optional verse.';
      return;
    }
    const ref = book.value + ' ' + chapter.value + (verse.value ? ':' + verse.value : '');
    insert(scriptureUrl(ref, controls.querySelector('[data-version]').value), ref);
  }
  const weekSelect = controls.querySelector('[data-week]');
  for (const number of studyWeeks) {
    const name = studyReadingUrl(root, number).searchParams.get('study').replaceAll('-', ' ');
    weekSelect.add(new Option('Week ' + number + ' · ' + name, number));
  }
  if (studyWeeks.includes(Number(week))) weekSelect.value = week;
  confirm.onclick = () => {
    if (selection === 'scripture') addScripture();
    else if (selection === 'study') {
      const number = Number(weekSelect.value);
      insert(studyReadingUrl(root, number), 'Week ' + number + ' study');
    }
  };
  controls.querySelector('[data-cancel]').onclick = finish;
  controls.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('input')) event.preventDefault();
  });
  return controls;
}
