import { weekForStudy } from './study-reference.js';
import { initWeeklyScriptureLoader } from './weeklyScriptureLoader.js';

let readerScript;
function loadReaderScript() {
  if (window.mountHomeGroupsScriptureReader) return Promise.resolve();
  if (!readerScript) readerScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'js/scriptureapi.js?v=shared-content-1';
    script.dataset.readerOnly = '';
    script.onload = resolve;
    script.onerror = () => { script.remove(); readerScript = null; reject(Error('Reader unavailable')); };
    document.head.append(script);
  });
  return readerScript;
}

export function openSharedReader(url, trigger, root) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fellowship-shared-reader';
  dialog.setAttribute('aria-label', 'Shared reading');
  dialog.innerHTML = '<button type="button" class="ui-btn" autofocus>Close reading</button><div role="status">Opening reading…</div>';
  const host = dialog.lastElementChild;
  const controller = new AbortController();
  let reader;
  function close() {
    if (controller.signal.aborted) return;
    controller.abort();
    reader?.dispose();
    dialog.close();
    dialog.remove();
    if (trigger.isConnected) trigger.focus({preventScroll:true});
  }
  dialog.firstElementChild.onclick = close;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  root.append(dialog);
  dialog.showModal();

  async function mount() {
    try {
      if (url.searchParams.get('card') === 'mainstage') {
        const week = weekForStudy(url.searchParams.get('study'));
        const section = document.getElementById('weeklyScriptureContainer')?.closest('.mainstage-section-body');
        if (!week || !section) throw Error('Study unavailable');
        const copy = section.cloneNode(true);
        copy.hidden = false;
        const container = copy.querySelector('#weeklyScriptureContainer');
        container.replaceChildren();
        delete container.dataset.loaderReady;
        host.replaceChildren(copy);
        host.removeAttribute('role');
        initWeeklyScriptureLoader({host, fixedWeek:week});
        for (const element of copy.querySelectorAll('[id]')) element.id = 'shared-' + element.id;
        return;
      }
      const response = await fetch('cards/scriptureapi.html', {signal:controller.signal});
      if (!response.ok) throw Error('Reader unavailable');
      const html = await response.text();
      await loadReaderScript();
      if (controller.signal.aborted) return;
      host.innerHTML = html;
      host.removeAttribute('role');
      reader = window.mountHomeGroupsScriptureReader(host, {
        ref:url.searchParams.get('ref'), version:url.searchParams.get('version')
      });
      await reader.ready;
    } catch {
      if (!controller.signal.aborted) {
        host.setAttribute('role','status');
        host.textContent = 'This reading is unavailable. Close it to return to your conversation.';
      }
    }
  }

  void mount();
  return close;
}
