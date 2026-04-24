import { db } from "./firebase-init.js";
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
    `);

    activeMarkers[prayer.id] = marker;
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

  function init() {
    initMap();
    wireUi();
    listenForPrayers();
  }

  init();

  window.PrayerMapCleanup = function () {
    if (map) map.remove();
  };
})();
