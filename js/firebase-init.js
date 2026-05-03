import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyATCjiScxnuuZe6bgd1KP5p2l0dVs0B8bQ",
  authDomain: "homegroups-app.firebaseapp.com",
  projectId: "homegroups-app",
  storageBucket: "homegroups-app.firebasestorage.app",
  messagingSenderId: "776120047000",
  appId: "1:776120047000:web:c1ee1e179adc4f970fc7ed",
  measurementId: "G-3BJR8ZZ2EY"
};

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.currentUser = user; // Real user
  } else {
    window.currentUser = { uid: 'guest' }; // Guest fallback
  }
  // After this, proceed to load data or continue app logic
});
