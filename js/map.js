(function () {
  const mapEl = document.getElementById("hgMapCanvas");
  if (!mapEl) return;

  if (typeof L === "undefined") {
    mapEl.innerHTML = "<div style='padding:16px;color:#a8b2c7;'>Leaflet not loaded.</div>";
    return;
  }

  // destroy old map if this card reloads into same container
  if (mapEl._hgMapInstance) {
    mapEl._hgMapInstance.remove();
    mapEl._hgMapInstance = null;
  }

  const map = L.map(mapEl).setView([36.1659, -86.7844], 6);
  mapEl._hgMapInstance = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  // use cluster if plugin is loaded, otherwise fall back
  const markers =
    typeof L.markerClusterGroup === "function"
      ? L.markerClusterGroup()
      : L.featureGroup();

  map.addLayer(markers);

  function getLatLngFromFeature(feature) {
    if (!feature || !feature.properties) return null;

    const raw = feature.properties.Coordinates;
    if (!raw) return null;

    if (Array.isArray(raw) && raw.length >= 2) {
      const a = Number(raw[0]);
      const b = Number(raw[1]);

      if (Number.isFinite(a) && Number.isFinite(b)) {
        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
        if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return [b, a];
      }
    }

    if (typeof raw === "string") {
      const parts = raw.split(",").map(s => Number(s.trim()));
      if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        const a = parts[0];
        const b = parts[1];
        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
        if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return [b, a];
      }
    }

    return null;
  }

  function labelFor(feature, i) {
    const p = feature?.properties || {};
    return (
      p.name ||
      p.Name ||
      p.title ||
      p.Title ||
      p.group ||
      p.Group ||
      `Marker ${i + 1}`
    );
  }

  function popupFor(feature, i) {
    const p = feature?.properties || {};
    const name = labelFor(feature, i);
    const desc = p.description || p.Description || "";
    const visibility = p.visibility ?? p.Visibility ?? "";
    const coords = p.Coordinates || "";

    return `
      <div class="map-popup">
        <strong>${name}</strong>
        ${desc ? `<div style="margin-top:6px;">${desc}</div>` : ""}
        ${visibility !== "" ? `<div style="margin-top:6px;opacity:.8;"><strong>Visibility:</strong> ${visibility}</div>` : ""}
        ${coords ? `<div style="margin-top:6px;opacity:.7;font-size:.8rem;"><strong>Coordinates:</strong> ${coords}</div>` : ""}
      </div>
    `;
  }

  fetch("HomeGroupsMap.geojson")
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load GeoJSON: ${res.status}`);
      return res.json();
    })
    .then(data => {
      const features = Array.isArray(data?.features) ? data.features : [];
      let validCount = 0;
      let skippedCount = 0;

      console.log("FIRST FEATURE:", data.features?.[0]);

      features.forEach((feature, i) => {
        const latlng = getLatLngFromFeature(feature);

        if (!latlng) {
          skippedCount++;
          console.warn(`Skipping feature ${i}: bad or missing Coordinates`, feature);
          return;
        }

        const marker = L.marker(latlng);
        marker.bindPopup(popupFor(feature, i));
        markers.addLayer(marker);
        validCount++;
      });

      console.log(`GeoJSON loaded: ${validCount} markers, ${skippedCount} skipped`);

      if (validCount > 0) {
        const bounds = markers.getBounds?.();
        if (bounds && bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } else {
        L.marker([36.1659, -86.7844])
          .addTo(map)
          .bindPopup("No valid GeoJSON coordinates found")
          .openPopup();
      }

      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 600);
    })
    .catch(err => {
      console.error("GeoJSON load error:", err);
      L.marker([36.1659, -86.7844])
        .addTo(map)
        .bindPopup("GeoJSON failed to load")
        .openPopup();

      setTimeout(() => map.invalidateSize(), 200);
    });
})();
