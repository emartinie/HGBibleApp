// prayerMap.dev.js
import { listenForPrayers } from './prayerStore.dev.js';

console.log("🗺️ prayerMap.dev.js loaded");

let prayerLayer = null;
let mapInstance = null;

// Store markers by ID so we can update/remove them
const activeMarkers = {};

export const PrayerMap = {
  init(map) {
    console.log("🔥 PrayerMap.init CALLED", map);

    if (!map || !map.addLayer) {
      console.error("❌ PrayerMap.init expected a Leaflet map object");
      return;
    }

    mapInstance = map;

    if (!prayerLayer) {
      prayerLayer = L.layerGroup().addTo(mapInstance);
      console.log("✅ prayerLayer created and added to map");
    }

    // 🔥 Set up Firebase listener ONCE
    listenForPrayers((change) => {
      console.log("📥 Prayer change received:", change);

      const { id, type, data } = change;

      if (type === "removed") {
        removePrayerMarker(id);
        return;
      }

      if (!data || !data.coordinates) {
        console.warn("⚠️ Missing coordinates:", change);
        return;
      }

      const prayer = { id, ...data };

      if (type === "added") {
        createPrayerMarker(prayer);
      } else if (type === "modified") {
        updatePrayerMarker(prayer);
      }
    });
  }
};

// -------------------------
// Helper functions
// -------------------------

function createPrayerMarker(prayer) {
  let [lng, lat] = prayer.coordinates;

  // Small jitter to separate overlapping markers
  const jitterAmount = 0.00005;
  let key = `${lat}_${lng}`;
  if (activeMarkers[key]) {
    lat += jitterAmount;
    lng += jitterAmount;
    key = `${lat}_${lng}`;
  }

  const marker = L.circleMarker([lat, lng], {
    radius: 8,
    fillColor: "#4a5568",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  }).addTo(prayerLayer);

  marker.bindPopup(`
    <strong>${prayer.name || "Anonymous"}</strong><br>
    <p>${prayer.message || ""}</p>
  `);

  // Track by Firebase ID
  activeMarkers[prayer.id] = marker;
}

function updatePrayerMarker(prayer) {
  const marker = activeMarkers[prayer.id];
  if (!marker) {
    // Marker not found? create it
    createPrayerMarker(prayer);
    return;
  }

  const [lng, lat] = prayer.coordinates;
  marker.setLatLng([lat, lng]);

  marker.bindPopup(`
    <strong>${prayer.name || "Anonymous"}</strong><br>
    <p>${prayer.message || ""}</p>
  `);
}

function removePrayerMarker(id) {
  const marker = activeMarkers[id];
  if (!marker) return;

  prayerLayer.removeLayer(marker);
  delete activeMarkers[id];
}