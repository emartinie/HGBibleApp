// timeEngine.js

export const TimeEngine = {
  config: {
    studyStart: "2025-10-19",
    rolloverMode: "sunset", // sunset | midnight
    selectedCalendar: "gregorian",
    timezone: "America/Chicago",
    geo: null,

    cycleDays: 364,
    weekLength: 7
  },

  configure(newConfig = {}) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  },

  now() {
    return new Date();
  },

  getEffectiveNow() {
    const now = new Date();

    if (this.config.rolloverMode === "midnight") {
      return now;
    }

    // temporary simple sunset model
    // before 6pm = previous biblical day
    const adjusted = new Date(now);

    if (now.getHours() < 18) {
      adjusted.setDate(adjusted.getDate() - 1);
    }

    return adjusted;
  },

  getStudyStartDate() {
    return new Date(this.config.studyStart);
  },

  getElapsedDays() {
    const start = this.getStudyStartDate();
    const now = this.getEffectiveNow();

    const diffMs = now - start;

    return Math.floor(
      diffMs / (1000 * 60 * 60 * 24)
    );
  },

  getCycleDay() {
    const elapsed = this.getElapsedDays();
    const total = this.config.cycleDays;

    return (
      ((elapsed % total) + total) % total
    ) + 1;
  },

  getCycleWeek() {
    return Math.floor(
      (this.getCycleDay() - 1) /
      this.config.weekLength
    ) + 1;
  },

  getDayOfWeek() {
    // JS: Sunday = 0
    // We want Sunday=1 ... Saturday=7
    const jsDay = this.getEffectiveNow().getDay();

    return jsDay === 0 ? 1 : jsDay + 1;
  },

  getWeekBounds() {
    const cycleDay = this.getCycleDay();
    const weekLength = this.config.weekLength;

    const start =
      cycleDay - ((cycleDay - 1) % weekLength);

    return {
      startDay: start,
      endDay: start + weekLength - 1
    };
  },

  getTodaySlice() {
    return {
      now: this.getEffectiveNow(),
      cycleDay: this.getCycleDay(),
      cycleWeek: this.getCycleWeek(),
      dayOfWeek: this.getDayOfWeek(),
      weekBounds: this.getWeekBounds()
    };
  }
};
