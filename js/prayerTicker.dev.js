// prayerTicker.dev.js
import { db } from "./firebase-init.dev.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

console.log("🔥 Fireside Prayer Ticker initializing...");

const prayersRef = collection(db, "prayers");
const requestsRef = collection(db, "requests");

// --- UI Creation ---

const ticker = document.createElement("div");
ticker.id = "firesideTicker";
ticker.innerHTML = `
  <div class="ticker-header">
    🔥 Live Prayer
    <span class="counts">
      <span id="totalPrayers">0</span> Prayers • 
      <span id="totalRequests">0</span> Requests
    </span>
  </div>
  <div id="tickerContent" class="ticker-content">
    Waiting for prayers...
  </div>
`;

document.body.appendChild(ticker);

// --- Styling ---

const style = document.createElement("style");
style.innerHTML = `
#firesideTicker {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: rgba(28,25,23,0.92);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 16px;
  color: #f5f5f4;
  font-family: system-ui, sans-serif;
  box-shadow: 0 0 25px rgba(249,115,22,0.15);
  border: 1px solid rgba(249,115,22,0.2);
  z-index: 9999;
  transition: box-shadow 0.4s ease;
}

#firesideTicker.pulse {
  box-shadow: 0 0 35px rgba(249,115,22,0.5);
}

.ticker-header {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #fb923c;
  display: flex;
  justify-content: space-between;
}

.counts {
  font-size: 12px;
  font-weight: 400;
  color: #a8a29e;
}

.ticker-content {
  font-size: 13px;
  line-height: 1.4;
  opacity: 1;
  transition: opacity 0.3s ease;
}
`;
document.head.appendChild(style);

// --- State ---

const contentEl = document.getElementById("tickerContent");
const totalPrayersEl = document.getElementById("totalPrayers");
const totalRequestsEl = document.getElementById("totalRequests");

let queue = [];
let currentIndex = 0;

// --- Rotation Logic ---

function rotateTicker() {
  if (queue.length === 0) return;

  contentEl.style.opacity = 0;

  setTimeout(() => {
    const item = queue[currentIndex];
    contentEl.innerHTML = `
      "${item.message || "No message"}"
      <br><span style="color:#a8a29e;font-size:12px;">
      — ${item.name || "Anonymous"}
      </span>
    `;
    contentEl.style.opacity = 1;

    currentIndex = (currentIndex + 1) % queue.length;
  }, 300);
}

setInterval(rotateTicker, 6000);

// --- Realtime Listeners ---

// TOTAL COUNTS
onSnapshot(prayersRef, snap => {
  totalPrayersEl.textContent = snap.size;
});

onSnapshot(requestsRef, snap => {
  totalRequestsEl.textContent = snap.size;
});

// LATEST PRAYERS
const latestPrayers = query(prayersRef, orderBy("createdAt", "desc"), limit(5));
const latestRequests = query(requestsRef, orderBy("createdAt", "desc"), limit(5));

function addToQueue(data) {
  queue.unshift(data);
  queue = queue.slice(0, 5);

  ticker.classList.add("pulse");
  setTimeout(() => ticker.classList.remove("pulse"), 800);
}

onSnapshot(latestPrayers, snap => {
  snap.docChanges().forEach(change => {
    if (change.type === "added") {
      addToQueue(change.doc.data());
    }
  });
});

onSnapshot(latestRequests, snap => {
  snap.docChanges().forEach(change => {
    if (change.type === "added") {
      addToQueue(change.doc.data());
    }
  });
});

console.log("🔥 Fireside Prayer Ticker ready.");