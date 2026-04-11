(function () {
  const mapEl = document.getElementById("hgMapCanvas");
  if (!mapEl) return;

  if (typeof L === "undefined") {
    mapEl.innerHTML = "<div style='padding:16px;color:#a8b2c7;'>Leaflet not loaded.</div>";
    return;
  }

  if (mapEl._leaflet_id) return;

  const map = L.map(mapEl).setView([36.1659, -86.7844], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  L.marker([36.1659, -86.7844])
    .addTo(map)
    .bindPopup("Test marker")
    .openPopup();

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
})();
