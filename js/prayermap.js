import { db } from "./firebase-init.js";
import { collection, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🗺️ prayermap.js loaded");

(function () {
  const mapEl = document.getElementById("prayerMap");
  if (!mapEl || typeof L === "undefined") return;

  let map;
  let addMode = false;
  let prayerLayer;
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
    savePrayerMarker(e.latlng.lat, e.latlng.lng);
  });

    console.log("✅ Prayer map initialized");
  }

  function addMarker(prayer) {
    const lat = prayer.lat;
    const lng = prayer.lng;

    if (typeof lat !== "number" || typeof lng !== "number") {
      console.warn("⚠️ Prayer missing lat/lng:", prayer);
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

  async function savePrayerMarker(lat, lng) {
  const name = prompt("Your name?") || "Anonymous";
  const message = prompt("Prayer request?");

  if (!message) return;

  await addDoc(collection(db, "prayers"), {
    name,
    message,
    lat,
    lng,
    createdAt: serverTimestamp()
  });
}

  function wireUi() {
    document.getElementById("prayerMapAddBtn")?.addEventListener("click", () => {
      addMode = true;
      alert("Click the map to place your prayer.");
    });

    document.getElementById("prayerPorchCloseBtn")?.addEventListener("click", () => {
      document.getElementById("prayerPorchPanel")?.classList.add("hidden");
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
