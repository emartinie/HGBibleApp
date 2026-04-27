(function () {
  const mapEl = document.getElementById("prayerMap");
  if (!mapEl || typeof L === "undefined") return;

  let map;
  let prayerLayer;
  let homeGroupLayer;

  function initMap() {
    map = L.map(mapEl).setView([36.1, -87.4], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    prayerLayer = L.layerGroup().addTo(map);
    homeGroupLayer = L.layerGroup().addTo(map);

    L.control.layers(null, {
      "Prayers": prayerLayer,
      "Home Groups": homeGroupLayer
    }).addTo(map);

    console.log("✅ Map ready");
  }

  // ------------------------
  // HOMEGROUPS (SAFE VERSION)
  // ------------------------
  async function loadHomeGroups() {
    try {
      const res = await fetch('./data/HomeGroupsMap.geojson');
      if (!res.ok) throw new Error("GeoJSON load failed");

      const data = await res.json();

      const layer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: "#3b82f6",
            color: "#111827",
            weight: 1,
            fillOpacity: 0.7
          });
        }
      }).addTo(homeGroupLayer);

      // 🔥 SAFE bounds (prevents black map)
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds);
      }

      console.log(`🏠 Loaded ${data.features.length} HomeGroups`);

    } catch (err) {
      console.error("❌ HomeGroups failed:", err);
    }
  }

  // ------------------------
  // INIT
  // ------------------------
  function init() {
    initMap();
    loadHomeGroups();
  }

  init();

})();
