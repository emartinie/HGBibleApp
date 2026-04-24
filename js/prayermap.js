import { db } from "./firebase-init.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🗺️ prayermap.js loaded");

(function () {
  const mapEl = document.getElementById("prayerMap");
  if (!mapEl || typeof L === "undefined") return;

  let map;
  let prayerLayer;
  const activeMarkers = {};

  function initMap() {
    map = L.map(mapEl).setView([36.1, -87.4], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    prayerLayer = L.layerGroup().addTo(map);

    console.log("✅ Prayer map initialized");
  }

  function addMarker(prayer) {
    const lat = prayer.lat;
    const lng = prayer.lng;

    if (typeof lat !== "number" || typeof lng !== "number") return;

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

  function wireUi() {
    document.getElementById("prayerMapAddBtn")?.addEventListener("click", () => {
      alert("Add Prayer form coming next.");
    });

    document.getElementById("prayerPorchCloseBtn")?.addEventListener("click", () => {
      document.getElementById("prayerPorchPanel")?.classList.add("hidden");
    });
  }

  function init() {
    initMap();
    wireUi();

    // Temporary test marker until Firestore is connected
    addMarker({
      id: "test-1",
      name: "Test Prayer",
      message: "Firestore connection comes next.",
      lat: 36.1,
      lng: -87.4
    });
  }

  init();

  window.PrayerMapCleanup = function () {
    if (map) map.remove();
  };
})();
