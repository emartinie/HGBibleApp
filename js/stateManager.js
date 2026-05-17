// stateManager.js

class StateManager {
  constructor() {
    // { namespace: { key: value } }
    this.state = {};

    // { namespace: Set(callbacks) }
    this.subscribers = {};
  }

  // Ensure namespace exists
  _ensureNamespace(ns) {
    if (!this.state[ns]) this.state[ns] = {};
    if (!this.subscribers[ns]) this.subscribers[ns] = new Set();
  }

  // Get full state or a key
  get(namespace = "global", key) {
    this._ensureNamespace(namespace);

    if (key === undefined) {
      return this.state[namespace];
    }

    return this.state[namespace][key];
  }

  // Set a value (or merge object)
  set(namespace = "global", key, value) {
    this._ensureNamespace(namespace);

    // allow object merge: set(ns, {a:1, b:2})
    if (typeof key === "object") {
      const updates = key;
      this.state[namespace] = {
        ...this.state[namespace],
        ...updates,
      };
    } else {
      this.state[namespace][key] = value;
    }

    this._notify(namespace);
  }

  // Patch multiple values safely
  patch(namespace = "global", updates = {}) {
    this._ensureNamespace(namespace);

    this.state[namespace] = {
      ...this.state[namespace],
      ...updates,
    };

    this._notify(namespace);
  }

  // Subscribe to changes in a namespace
  subscribe(namespace = "global", callback) {
    this._ensureNamespace(namespace);

    this.subscribers[namespace].add(callback);

    // return unsubscribe function
    return () => {
      this.subscribers[namespace].delete(callback);
    };
  }

  // Notify subscribers
  _notify(namespace) {
    const snapshot = this.get(namespace);

    for (const cb of this.subscribers[namespace]) {
      cb(snapshot);
    }
  }

  // Reset namespace
  reset(namespace = "global") {
    this.state[namespace] = {};
    this._notify(namespace);
  }
}

// Export singleton (simple default usage)
const stateManager = new StateManager();

export default stateManager;
