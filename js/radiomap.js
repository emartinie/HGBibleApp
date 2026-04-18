(function () {
  const root = document.getElementById("radiomap");
  if (!root) return;

  const mapEl = root.querySelector("#map");
  const zoneFilter = root.querySelector("#mapFilterZone");
  const typeFilter = root.querySelector("#mapFilterType");
  const statusFilter = root.querySelector("#mapFilterStatus");
  const searchInput = root.querySelector("#mapFilterSearch");
  const resetBtn = root.querySelector("#mapFilterReset");

  let map;
  let markers = [];

  function initMap() {
    if (!mapEl) return;

    map = L.map(mapEl).setView([36.1, -87.4], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    console.log("🗺 Radio map initialized");
  }

  function loadMarkers() {
    // Placeholder for now
    const sample = [
      { lat: 36.1, lng: -87.4, zone: "dickson", type: "repeater", status: "active", label: "Dickson Repeater" },
      { lat: 36.3, lng: -86.8, zone: "field", type: "simplex", status: "planned", label: "Field Node" }
    ];

    sample.forEach(data => {
      const marker = L.marker([data.lat, data.lng]).addTo(map);
      marker.meta = data;
      marker.bindPopup(data.label);
      markers.push(marker);
    });
  }

  function applyFilters() {
    const zone = zoneFilter.value;
    const type = typeFilter.value;
    const status = statusFilter.value;
    const search = searchInput.value.toLowerCase();

    markers.forEach(marker => {
      const m = marker.meta;

      const matches =
        (zone === "all" || m.zone === zone) &&
        (type === "all" || m.type === type) &&
        (status === "all" || m.status === status) &&
        (!search || m.label.toLowerCase().includes(search));

      if (matches) {
        marker.addTo(map);
      } else {
        map.removeLayer(marker);
      }
    });
  }

  function resetFilters() {
    zoneFilter.value = "all";
    typeFilter.value = "all";
    statusFilter.value = "all";
    searchInput.value = "";
    applyFilters();
  }

  function wireEvents() {
    zoneFilter.addEventListener("change", applyFilters);
    typeFilter.addEventListener("change", applyFilters);
    statusFilter.addEventListener("change", applyFilters);
    searchInput.addEventListener("input", applyFilters);
    resetBtn.addEventListener("click", resetFilters);
  }

  function init() {
    initMap();
    loadMarkers();
    wireEvents();
  }

  init();
})();
