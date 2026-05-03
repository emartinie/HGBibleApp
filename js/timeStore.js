// timeStore.js

import { TimeEngine } from "./timeEngine.js";

export const TimeStore = {
  state: {
    initialized: false,
    now: null,
    slice: null
  },

  listeners: [],
  intervalId: null,

  subscribe(callback) {
    this.listeners.push(callback);

    // immediately emit current state
    callback(this.state);

    return () => {
      this.listeners = this.listeners.filter(
        fn => fn !== callback
      );
    };
  },

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  },

  setState(newState = {}) {
    this.state = {
      ...this.state,
      ...newState
    };

    this.notify();
  },

  computeState() {
    return {
      now: TimeEngine.getEffectiveNow(),
      slice: TimeEngine.getTodaySlice()
    };
  },

  initialize() {
    const initial = this.computeState();

    this.setState({
      initialized: true,
      ...initial
    });

    console.log("✅ TimeStore initialized");
  },

  tick() {
    const updated = this.computeState();

    this.setState(updated);
  },

  start() {
    this.initialize();

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.tick();
    }, 60 * 1000); // update every minute
  },

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};
