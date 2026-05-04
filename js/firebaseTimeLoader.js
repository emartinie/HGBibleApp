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
  console.time("⏱ initializeTimeSystem");

  const activeUser = auth.currentUser || { uid: "guest" };

  console.time("appConfig");
  const appConfig = await loadAppConfig();
  console.timeEnd("appConfig");

  console.time("userSettings");
  const userSettings = await loadUserTimeSettings(activeUser.uid);
  console.timeEnd("userSettings");

  console.time("merge/configure");
  const finalConfig = mergeTimeConfig(appConfig, userSettings);
  TimeEngine.configure(finalConfig);
  console.timeEnd("merge/configure");

  console.timeEnd("⏱ initializeTimeSystem");

  return finalConfig;
}
