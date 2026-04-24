import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyATCjiScxnuuZe6bgd1KP5p2l0dVs0B8bQ",
  authDomain: "homegroups-app.firebaseapp.com",
  projectId: "homegroups-app",
  storageBucket: "homegroups-app.firebasestorage.app",
  messagingSenderId: "776120047000",
  appId: "1:776120047000:web:c1ee1e179adc4f970fc7ed",
  measurementId: "G-3BJR8ZZ2EY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
