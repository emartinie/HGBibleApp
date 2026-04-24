import { db } from "./firebase-init.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🗺️ prayermap.js loaded");

(function () {
  const mapEl = document.getElementById("prayerMap");
  if (!mapEl || typeof L === "undefined") return;

  let map;
  let prayerLayer;
  let addMode = false;
  let pendingLatLng = null;
  const activeMarkers = {};
  const prayerData = {};
  
  function initMap() {
    map = L.map(mapEl).setView([36.1, -87.4], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    prayerLayer = L.layerGroup().addTo(map);

    map.on("click", (e) => {
      if (!addMode) return;
      addMode = false;
      openPrayerModal(e.latlng.lat, e.latlng.lng);
    });

    console.log("✅ Prayer map initialized");
  }

  function addMarker(prayer) {
    const lat = Number(prayer.lat);
    const lng = Number(prayer.lng);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn("⚠️ Invalid lat/lng:", prayer);
      return;
    }

    if (activeMarkers[prayer.id]) {
      activeMarkers[prayer.id].setLatLng([lat, lng]);
      return;
    }

    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: "#f97316",
      color: "#111827",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.85
    }).addTo(prayerLayer);

      marker.bindPopup(`
      <strong>${prayer.name || "Anonymous"}</strong><br>
      <p>${prayer.message || ""}</p>
      <button 
        data-id="${prayer.id}" 
        class="mark-prayed-btn mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded"
      >
        ${prayer.prayed ? "🙏 Prayed" : "🙏 I Prayed"}
      </button>
    `);
    prayerData[prayer.id] = prayer;
    activeMarkers[prayer.id] = marker;
  }

  function filterMarkers(query) {
  const q = query.toLowerCase();

  Object.keys(activeMarkers).forEach((id) => {
    const marker = activeMarkers[id];
    const prayer = prayerData[id];

    const text = `${prayer.name || ""} ${prayer.message || ""}`.toLowerCase();

    const isPrayed = prayer.prayed === true;
    fillColor: isPrayed ? "#22c55e" : "#f97316"

    if (!q || text.includes(q)) {
      marker.addTo(prayerLayer);
    } else {
      prayerLayer.removeLayer(marker);
    }
  });
}

  function listenForPrayers() {
    const col = collection(db, "prayers");

    onSnapshot(col, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const id = change.doc.id;
        const data = change.doc.data();

        if (change.type === "added" || change.type === "modified") {
          addMarker({ id, ...data });
        }

        if (change.type === "removed" && activeMarkers[id]) {
          prayerLayer.removeLayer(activeMarkers[id]);
          delete activeMarkers[id];
        }
      });
    });
  }

  async function savePrayerMarker(name, message, lat, lng) {
    if (!message) return;

        await addDoc(collection(db, "prayers"), {
        name: name || "Anonymous",
        message,
        lat,
        lng,
        prayed: false, // 👈 changed
        createdAt: serverTimestamp()
      });
        }

  function openPrayerModal(lat, lng) {
    pendingLatLng = { lat, lng };

    const panel = document.getElementById("prayerPorchPanel");
    const title = document.getElementById("prayerPorchTitle");
    const message = document.getElementById("prayerPorchMessage");

    if (!panel || !message) return;

    title.textContent = "Add Prayer";

    message.innerHTML = `
      <input id="prayerNameInput" class="w-full mb-3 px-3 py-2 rounded bg-slate-800 text-white border border-slate-600" placeholder="Name optional">
      <textarea id="prayerMessageInput" class="w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-600" rows="4" placeholder="Prayer request"></textarea>
      <button id="prayerSaveBtn" class="mt-4 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white">
        Save Prayer
      </button>
    `;

    panel.classList.remove("hidden");

    document.getElementById("prayerSaveBtn")?.addEventListener("click", async () => {
      const name = document.getElementById("prayerNameInput")?.value.trim();
      const prayerText = document.getElementById("prayerMessageInput")?.value.trim();

      if (!pendingLatLng || !prayerText) return;

      const btn = document.getElementById("prayerSaveBtn");
      btn.disabled = true;
      btn.textContent = "Saving...";

      await savePrayerMarker(name, prayerText, pendingLatLng.lat, pendingLatLng.lng);

      pendingLatLng = null;
      panel.classList.add("hidden");
    });
  }

  function wireUi() {
    document.getElementById("prayerMapAddBtn")?.addEventListener("click", () => {
      addMode = true;
      alert("Click the map where you want to place the prayer.");
    });

    document.getElementById("prayerPorchCloseBtn")?.addEventListener("click", () => {
      document.getElementById("prayerPorchPanel")?.classList.add("hidden");
      pendingLatLng = null;
      addMode = false;
    });
  }

  document.getElementById("prayerMapSearch")?.addEventListener("input", (e) => {
  filterMarkers(e.target.value);
});

  function init() {
    initMap();
    wireUi();
    listenForPrayers();
  }

  init();

  map.on("popupopen", (e) => {
  const btn = e.popup._contentNode.querySelector(".mark-prayed-btn");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    const id = btn.dataset.id;

    await updateDoc(doc(db, "prayers", id), {
      prayed: true
    });
  });
});

  window.PrayerMapCleanup = function () {
    if (map) map.remove();
  };
})();
