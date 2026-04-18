console.log("🗺️ prayermap.js loaded");

(function () {
  const mapEl = document.getElementById("prayerMap");
  if (!mapEl) {
    console.warn("⚠️ #prayerMap not found");
    return;
  }

  if (typeof L === "undefined") {
    console.error("❌ Leaflet is not loaded");
    return;
  }

  let prayerLayer = null;
  let mapInstance = null;
  let unsubscribe = null;
  const activeMarkers = {};

  function createPrayerMarker(prayer) {
    let [lng, lat] = prayer.coordinates || [];
    if (typeof lat !== "number" || typeof lng !== "number") return;

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

    activeMarkers[prayer.id] = marker;
  }

  function updatePrayerMarker(prayer) {
    const marker = activeMarkers[prayer.id];
    if (!marker) {
      createPrayerMarker(prayer);
      return;
    }

    const [lng, lat] = prayer.coordinates || [];
    if (typeof lat !== "number" || typeof lng !== "number") return;

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

  function initPrayerListener() {
    if (typeof window.listenForPrayers !== "function") {
      console.error("❌ listenForPrayers is not available on window");
      return;
    }

    unsubscribe = window.listenForPrayers((change) => {
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

  function initMap() {
    mapInstance = L.map(mapEl).setView([36.1, -87.4], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapInstance);

    prayerLayer = L.layerGroup().addTo(mapInstance);

    console.log("✅ Prayer map initialized");
  }

  function wireUi() {
    document.getElementById("prayerMapAddBtn")?.addEventListener("click", () => {
      alert("Add Prayer form coming next.");
    });

    document.getElementById("prayTogetherBtn")?.addEventListener("click", () => {
      alert("Pray Together flow coming next.");
    });

    document.getElementById("joinCommunityBtn")?.addEventListener("click", () => {
      alert("Join Community flow coming next.");
    });

    document.getElementById("prayerPorchCloseBtn")?.addEventListener("click", () => {
      document.getElementById("prayerPorchPanel")?.classList.add("hidden");
    });
  }

  function init() {
    initMap();
    wireUi();
    initPrayerListener();
  }

  init();

  window.PrayerMapCleanup = function () {
    if (typeof unsubscribe === "function") unsubscribe();
    if (mapInstance) mapInstance.remove();
  };
})();
