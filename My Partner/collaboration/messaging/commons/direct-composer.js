// Private drafts live only in memory, scoped to the current account and thread.
// Account changes discard every draft, including on shared devices.
export function createDirectComposer({input, form, send, onError, onSent}) {
  let account = null, thread = null, accepted = false, generation = 0, draftVersion = 0;
  const drafts = new Map(), pending = new Map();
  const button = form.querySelector('button[type="submit"],button');
  function remember() {
    if (account && thread && drafts.get(thread)?.value !== input.value) drafts.set(thread, {value:input.value, version:++draftVersion});
  }
  function render() {
    form.hidden = !account || !thread || !accepted;
    if (button) button.disabled = form.hidden || pending.has(thread);
  }
  input.addEventListener('input', () => {
    if (account && thread) drafts.set(thread, {value:input.value, version:++draftVersion});
  });
  form.onsubmit = async event => {
    event.preventDefault();
    if (!account || !thread || !accepted || pending.has(thread)) return;
    const value = input.value, body = value.trim();
    if (!body) return;
    remember();
    const uid = account, id = thread, token = generation, version = drafts.get(thread).version;
    const operation = {};
    pending.set(id, operation); render();
    try {
      await send(uid, id, body);
      if (generation !== token) return;
      if (drafts.get(id)?.version === version) {
        drafts.delete(id);
        if (thread === id && input.value === value) input.value = '';
      }
      if (thread === id) onSent?.();
    } catch (error) {
      if (generation === token && thread === id) onError(error);
    } finally {
      if (pending.get(id) === operation) pending.delete(id);
      render();
    }
  };
  return {
    setAccount(uid) {
      if (uid === account) return;
      generation++; account = uid; thread = null; accepted = false;
      drafts.clear(); pending.clear(); input.value = ''; render();
    },
    select(id) {
      remember(); thread = id; accepted = false;
      input.value = account && id ? drafts.get(id)?.value || '' : ''; render();
    },
    setAccepted(value) { accepted = !!value; render(); },
    clear() { generation++; drafts.clear(); pending.clear(); thread = null; accepted = false; input.value = ''; render(); }
  };
}
