  let currentDataset = "homegroups";

  async function loadCard(name) {
    const viewport = document.getElementById("viewport");
    viewport.innerHTML = "";

    if (name === "prayermap" || name === "radioMapCard") {
      currentDataset = name === "radioMapCard" ? "radio" : "homegroups";

      viewport.innerHTML = `
       <div class="map-shell" style="position:absolute; width:90%; height:80svh; min-height:560px; overflow:hidden;">
          <div class="map-topbar" style="
            position:absolute; top:0px; left:10px; right:10px; z-index:1000;
            display:flex; gap:8px; justify-content:center; flex-wrap:wrap;
            padding:10px 12px; border-radius:14px;
            background:rgba(2,6,23,.68); backdrop-filter:blur(8px);
            box-shadow:0 10px 24px rgba(0,0,0,.28);
          ">
            <button type="button" onclick="switchMapDataset('homegroups')"><img src="images/HGHouses.png" alt="logo" class="w-7 h-7" /></button>
            <button type="button" onclick="switchMapDataset('radio')">📡</button>
            <!--<button type="button" onclick="resetMapView()">Reset</button>-->
            <button type="button" onclick="locateUser()">📍</button>
            <span id="mapStatus" style="margin-left:auto; opacity:.85; font-size:.9rem;"></span>
            <input id="mapSearchInput" type="text" placeholder="Search..."
  style="
    padding:6px 10px;
    border-radius:8px;
    background:rgba(255,255,255,0.1);
    color:white;
    border:none;
    outline:none;
  "
/>

<button onclick="runMapSearch()">🔍</button>
          </div>

          <div id="map" style="min-height:560px; border-radius:18px; overflow:hidden;"></div>

          <div class="map-bottombar" style="
          position:absolute; bottom:20px; left:10px; right:10px; z-index:1000;
          display:flex; gap:8px; justify-content:center; flex-wrap:wrap;
          padding:10px 12px; border-radius:14px;
          background:rgba(2,6,23,.58); backdrop-filter:blur(8px);
          box-shadow:0 10px 24px rgba(0,0,0,.22);
        ">
            <button type="button" onclick="switchMapDataset('homegroups')">PrayerMap</button>
            <!--<button type="button" onclick="switchMapDataset('radio')">Comms</button>-->
            <button type="button" disabled>Filters</button>
          </div>
        </div>
                          <div id="cardinalPad" class="absolute top-60 left-4 z-99999
            grid grid-cols-3 grid-rows-3 gap-1">

                    <!-- North -->
                    <button data-dir="north" class="campPad col-start-2 row-start-1">↑</button>
                    <!-- West -->
                    <button data-dir="west" class="campPad col-start-1 row-start-2">←</button>
                    <!-- East -->
                    <button data-dir="east" class="campPad col-start-3 row-start-2">→</button>
                    <!-- South -->
                    <button data-dir="south" class="campPad col-start-2 row-start-3">↓</button>
                  </div>
                   <!-- 🔥 Fireside Prayer Map Card 
                  <div class="relative rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">-->

                    <!-- Warm ambient overlay -->
                    <!--<div class="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black"></div>-->

                    <!-- Subtle ember glow -->
                    <div class="absolute inset-0 pointer-events-none">
                      <div
                        class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,140,0,0.15),transparent_60%)]">
                      </div>
                    </div>
      `;

      initPrayerMap(currentDataset);
    }
  }

  function updateMapStatus(text) {
    const el = document.getElementById("mapStatus");
    if (el) el.textContent = text;
  }

  function resetMapView() {
    if (!window.currentMap) return;
    window.currentMap.setView([39.5, -98.35], 4);
  }

  function switchMapDataset(dataset) {
    currentDataset = dataset;
    initPrayerMap(dataset);
  }

  function getRadioIcon(p = {}) {
    const type = p.type || "default";
    const label =
      p.channel ? String(p.channel) :
      type === "repeater" ? "R" :
      type === "simplex" ? "S" :
      type === "family" ? "F" : "•";

    const className =
      type === "repeater" ? "radio-marker repeater" :
      type === "simplex" ? "radio-marker simplex" :
      type === "family" ? "radio-marker family" :
      "radio-marker default";

    return L.divIcon({
      className: "radio-div-icon-wrap",
      html: `<div class="${className}">${label}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -16]
    });
  }

  function initPrayerMap(dataset = "homegroups") {
    const mapEl = document.getElementById("map");
    if (!mapEl) {
      console.error("Map container not found");
      return;
    }

    if (window.currentMap) {
      window.currentMap.remove();
      window.currentMap = null;
    }

    const map = L.map("map").setView([39.5, -98.35], 4);
    window.currentMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    const fetchedMarkers = L.markerClusterGroup();
    const latlngs = [];

    const dataUrl =
      dataset === "radio"
        ? "./data/radio_nodes.geojson"
        : "./HomeGroupsMap.geojson";

    fetch(dataUrl)
      .then((response) => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then((data) => {
        data.features.forEach((feature, idx) => {
          let lon, lat;
          const p = feature.properties || {};

          if (dataset === "radio") {
            const coords = feature.geometry?.coordinates;
            if (!coords || coords.length < 2) {
              console.warn(`⚠️ Radio feature ${idx} missing geometry.coordinates`);
              return;
            }
            [lon, lat] = coords;
          } else {
            const coordsStr = p.Coordinates;
            if (!coordsStr) {
              console.warn(`⚠️ Feature ${idx} missing Coordinates`);
              return;
            }
            const coords = coordsStr.split(",").map(Number);
            if (coords.length < 2) {
              console.warn(`⚠️ Feature ${idx} has invalid Coordinates`);
              return;
            }
            [lon, lat] = coords;
          }

          latlngs.push([lat, lon]);

          const marker =
            dataset === "radio"
              ? L.marker([lat, lon], { icon: getRadioIcon(p) })
              : L.marker([lat, lon]);

          if (dataset === "radio") {
            marker.bindPopup(`
              <div class="map-popup">
                <strong>${p.name || "Unnamed"}</strong><br>
                ${p.type ? `Type: ${p.type}<br>` : ""}
                ${p.channel ? `CH ${p.channel}<br>` : ""}
                ${p.frequency ? `Freq: ${p.frequency}<br>` : ""}
                ${p.offset ? `Offset: ${p.offset}<br>` : ""}
                ${p.tone ? `Tone: ${p.tone}<br>` : ""}
                ${p.zone ? `Zone: ${p.zone}<br>` : ""}
                ${p.notes ? `<em>${p.notes}</em>` : ""}
              </div>
            `);
          } else {
            marker.bindPopup(`
              <div class="map-popup">
                <strong>${p.Name || "Unnamed"}</strong><br>
                ${p.Message ? `<em>${p.Message}</em>` : ""}
              </div>
            `);
          }

          fetchedMarkers.addLayer(marker);
        });

        map.addLayer(fetchedMarkers);

        if (latlngs.length) {
          map.fitBounds(latlngs, { padding: [15, 15] });
          setTimeout(() => map.zoomIn(1), 50);
        }

        updateMapStatus(
          dataset === "radio"
            ? `📡 Comms • ${data.features.length} nodes`
            : `🙏 HG© • over ${data.features.length} people`
        );

        setTimeout(() => map.invalidateSize(), 120);
        console.log(`✅ ${dataset} map initialized with ${data.features.length} features`);
      })
      .catch((err) => {
        console.error(`❌ Error loading ${dataset} GeoJSON:`, err);
        updateMapStatus(`Error loading ${dataset}`);
      });
  }

     function locateUser() {
  if (!window.currentMap) return;
  addGeoLocateMarker(window.currentMap);
     }
  
function addGeoLocateMarker(map) {
  if (!map) return;

  map.locate({
    setView: true,
    maxZoom: 12,
    enableHighAccuracy: true,
    timeout: 10000
  });

  map.once("locationfound", function (e) {
    // remove old marker if exists
    if (window.userLocationMarker) {
      map.removeLayer(window.userLocationMarker);
    }

    if (window.userLocationCircle) {
      map.removeLayer(window.userLocationCircle);
    }

    window.userLocationMarker = L.marker(e.latlng)
      .addTo(map)
      .bindPopup("📍 You are here.<br>Zoom out to find people nearby.")
      .openPopup();

    window.userLocationCircle = L.circle(e.latlng, {
      radius: e.accuracy || 30
    }).addTo(map);
  });

  map.once("locationerror", function (e) {
    console.warn("Geolocation error:", e.message);
  });
}
