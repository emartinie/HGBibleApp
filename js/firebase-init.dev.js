// firebase-init.dev.js
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("🔥 firebase-init.dev.js loading");

const firebaseConfig = {
  apiKey: "AIzaSyBNYsljwgrRaJNycyNivNUbY6DPteYNyag",
  authDomain: "prayermap-669fc.firebaseapp.com",
  projectId: "prayermap-669fc",
  storageBucket: "prayermap-669fc.appspot.com",
  messagingSenderId: "887582168434",
  appId: "1:887582168434:web:2bccf2d4e1b9e79721f9eb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// expose globals for non-module card scripts
window.db = db;
window.collection = collection;
window.onSnapshot = onSnapshot;
window.query = query;
window.orderBy = orderBy;

console.log("🔥 Firebase initialized");
