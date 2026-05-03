import { db, auth } from "./firebase-init.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { TimeEngine } from "./timeEngine.js";


// -----------------------------------
// helpers
// -----------------------------------

async function loadAppConfig() {
  const ref = doc(db, "appConfig", "main");
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Missing appConfig/main");
  }

  return snap.data();
}

async function loadUserTimeSettings(uid) {
  const ref = doc(db, "users", uid, "settings", "time");
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data();
}

function mergeTimeConfig(appConfig, userSettings) {
  const safeUser = userSettings || {};

  return {
    studyStart:
      safeUser.studyStart || "2025-10-19",

    rolloverMode:
      safeUser.rolloverMode ||
      appConfig.defaultRollover ||
      "sunset",

    selectedCalendar:
      safeUser.selectedCalendar ||
      appConfig.defaultCalendar ||
      "gregorian",

    timezone:
      safeUser.timezone || "America/Chicago",

    geo:
      safeUser.geo || null,

    cycleDays:
      appConfig.cycleDefaults?.cycleDays || 364,

    weekLength:
      appConfig.cycleDefaults?.weekLength || 7
  };
}


// -----------------------------------
// public bootloader
// -----------------------------------

export async function initializeTimeSystem() {
  const activeUser = auth.currentUser || { uid: "guest" };

  const appConfig = await loadAppConfig();
  const userSettings = await loadUserTimeSettings(activeUser.uid);

  const finalConfig = mergeTimeConfig(appConfig, userSettings);

  TimeEngine.configure(finalConfig);

  return finalConfig;
}
