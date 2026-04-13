import { listenForPrayers } from './prayerStore.dev.js';
console.log("🗺️ prayerMap.dev.js loaded (HG dual pipeline)");

let prayerLayer = null;
let mapInstance = null;


export const PrayerMap = {
  init(map) {
    console.log("🔥 PrayerMap.init CALLED", map);

    if (!map || !map.addLayer) {
      console.error("❌ PrayerMap.init expected a Leaflet map object");
      return;
    }

    // Listen for Firestore prayers
listenForPrayers((snapshot) => {
  console.log("📥 snapshot received:", snapshot); 
  if (!snapshot || !snapshot.forEach) {
    console.warn("⚠️ snapshot is not iterable with forEach");
    return;
  }

  snapshot.forEach(doc => {
    const prayer = doc.data();
    console.log("🟢 creating prayer marker", prayer);
    PrayerMap.createPrayerMarker(prayer);
    console.log("🔹 Inside createPrayerMarker, prayer:", prayer);
    console.log("mapInstance:", mapInstance);
    console.log("prayerLayer:", prayerLayer);
  });
});

    mapInstance = map;

    if (!prayerLayer) {
      prayerLayer = L.layerGroup().addTo(mapInstance);
      console.log("✅ prayerLayer created and added to map");
    } else {
      console.log("ℹ️ prayerLayer already exists, reusing");
    }
  },

  createPrayerMarker(prayer) {
    if (!prayerLayer || !mapInstance) {
      console.warn("💡 prayerLayer or mapInstance missing, cannot add marker");
      return;
    }

    console.log("📌 Creating prayer marker:", prayer.name, prayer.coordinates);

    // Normal green marker
    const marker = L.circleMarker(prayer.coordinates, {
      radius: 7,
      color: "#22c55e",
      fillColor: "#4ade80",
      fillOpacity: 0.85,
      weight: 1.5
    }).addTo(prayerLayer);

    // Popup
    marker.bindPopup(`
      <strong>${prayer.name}</strong><br>
      <p>${prayer.message}</p>
    `);

    // Dual rendering for geoJSON (if coordinates are geoJSON arrays)
    if (prayer.geojson) {
      L.geoJSON(prayer.geojson, {
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 6,
            color: "#3b82f6",
            fillColor: "#60a5fa",
            fillOpacity: 0.7,
            weight: 1
          });
        }
      }).addTo(prayerLayer);
    }

    console.log("✅ Marker added to prayerLayer");
  }
};