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

function listenForPrayers() {
  const col = collection(db, "prayers");

  onSnapshot(col, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const id = change.doc.id;
      const data = change.doc.data();

      if (change.type === "added") {
        addMarker({ id, ...data });
      }
    });
  });
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
      listenForPrayers();

    // Temporary test marker until Firestore is connected
  //  addMarker({
   //   id: "test-1",
   //   name: "Test Prayer",
  //    message: "Firestore connection comes next.",
   //   lat: 36.1,
    //  lng: -87.4
  //  });
//  }

  init();

  window.PrayerMapCleanup = function () {
    if (map) map.remove();
  };
})();
