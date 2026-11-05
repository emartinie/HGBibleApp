// The existing Commons screens own their queries; Fellowship owns their lifetime.
import {onAuthStateChanged as subscribeAuth} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {onSnapshot as subscribeSnapshot} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const subscriptions = new Set();
const disposalCallbacks = new Set();
let closed = false;
function subscribe(factory,args) {
  if (closed) return () => {};
  let stopped = false;
  const guarded = args.map(arg => typeof arg === 'function' ? (...values) => { if (!closed && !stopped) return arg(...values); } : arg);
  const unsubscribe = factory(...guarded);
  const stop = () => { if (stopped) return; stopped=true;subscriptions.delete(stop);unsubscribe(); };
  subscriptions.add(stop);return stop;
}
export const onAuthStateChanged = (...args) => subscribe(subscribeAuth,args);
export const onSnapshot = (...args) => subscribe(subscribeSnapshot,args);
export function onCommonsDispose(callback) {
  if (closed) { callback(); return () => {}; }
  disposalCallbacks.add(callback);
  return () => disposalCallbacks.delete(callback);
}
function dispose() {
  if (closed) return;
  closed=true;
  // Invalidate async page operations before removing their observers.
  for (const callback of [...disposalCallbacks]) {
    try { callback(); } catch (error) { console.error('Commons cleanup failed',error); }
  }
  disposalCallbacks.clear();
  for (const stop of [...subscriptions]) stop();
}
window.addEventListener('hg:fellowship-dispose',dispose,{once:true});
window.addEventListener('pagehide',dispose,{once:true});
// A restored standalone document must establish fresh authenticated listeners.
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
