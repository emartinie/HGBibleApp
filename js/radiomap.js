(function () {
  let map = null;
  let markers = [];

  function getEls() {
    const root = document.getElementById("radiomap");
    if (!root) return null;

    return {
      root,
      mapEl: root.querySelector("#map"),
      zoneFilter: root.querySelector("#mapFilterZone"),
      typeFilter: root.querySelector("#mapFilterType"),
      statusFilter: root.querySelector("#mapFilterStatus"),
      searchInput: root.querySelector("#mapFilterSearch"),
      resetBtn: root.querySelector("#mapFilterReset")
    };
  }

  function loadMarkers() {
    if (!map) return;

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
    const els = getEls();
    if (!els || !map) return;

    const zone = els.zoneFilter.value;
    const type = els.typeFilter.value;
    const status = els.statusFilter.value;
    const search = els.searchInput.value.toLowerCase();

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
    const els = getEls();
    if (!els) return;

    els.zoneFilter.value = "all";
    els.typeFilter.value = "all";
    els.statusFilter.value = "all";
    els.searchInput.value = "";
    applyFilters();
  }

  function wireEvents() {
    const els = getEls();
    if (!els) return;

    els.zoneFilter.onchange = applyFilters;
    els.typeFilter.onchange = applyFilters;
    els.statusFilter.onchange = applyFilters;
    els.searchInput.oninput = applyFilters;
    els.resetBtn.onclick = resetFilters;
  }

  function initRadioMapCard() {
    const els = getEls();
    if (!els || !els.mapEl || typeof L === "undefined") return;

    destroyRadioMapCard();

    map = L.map(els.mapEl).setView([36.1, -87.4], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap contributors"
    }).addTo(map);

    loadMarkers();
    wireEvents();
    console.log("[radiomap] initialized");
  }

  function destroyRadioMapCard() {
    markers = [];

    if (map) {
      map.remove();
      map = null;
    }
  }

  window.initRadioMapCard = initRadioMapCard;
  window.destroyRadioMapCard = destroyRadioMapCard;
  initRadioMapCard();
})();
