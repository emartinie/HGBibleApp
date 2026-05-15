import { db } from "./firebase-init.js";
import {
  doc,
  updateDoc,
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🗺️ prayermap.js loaded");

(function () {

  if (window.prayerMapInitialized) {
    console.warn("prayermap already initialized");
    return;
  }
  window.prayerMapInitialized = true;

  const mapEl = document.getElementById("prayerMap");
  if (!mapEl || typeof L === "undefined") return;

  let map;
  let prayerLayer;
  let homeGroupLayer;
  let feastLayer;

  let addMode = null; // "prayer" | "feast"
  let pendingLatLng = null;

  const activeMarkers = {};
  const activeFeasts = {};

// ======================
// HELPERS (GLOBAL SAFE)
// ======================

function maskPrivateText(value) {
  if (!value) return "";

  const str = String(value);
  if (str.length <= 3) return str;

  return str.slice(0, 3) + "*".repeat(str.length - 3);
}

function maskDescription(description) {
  if (!description) return "";

  return String(description)
    .replace(
      /([A-Z0-9._%+-]{4,}@[A-Z0-9.-]+\.[A-Z]{2,})/gi,
      (m) => maskPrivateText(m)
    )
    .replace(
      /(\+?\d[\d\-\s().]{6,}\d)/g,
      (m) => maskPrivateText(m)
    )
    .replace(
      /(Address:\s*)([^<\n]+)/gi,
      (_, prefix, value) => prefix + maskPrivateText(value.trim())
    );
}

function getHomeGroupsLatLng(feature) {
  const raw = feature?.properties?.Coordinates;
  if (!raw) return null;

  if (typeof raw === "string") {
    const parts = raw.split(",").map((s) => Number(s.trim()));
    if (parts.length < 2) return null;

    const lon = parts[0];
    const lat = parts[1];

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return [lat, lon];
  }

  if (Array.isArray(raw) && raw.length >= 2) {
    const lon = Number(raw[0]);
    const lat = Number(raw[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return [lat, lon];
  }

  return null;
}

function labelFor(feature, i) {
  const p = feature?.properties || {};
  return p.Name || p.name || p.Title || p.title || `Group ${i + 1}`;
}

function popupFor(feature, i) {
  const p = feature?.properties || {};
  const name = labelFor(feature, i);
  const description = maskDescription(p.description || p.Description || "");
  const coords = maskDescription(p.Coordinates || "");

  return `
    <div>
      <strong>${name}</strong>
      ${description ? `<div style="margin-top:6px;">${description}</div>` : ""}
      ${coords ? `<div style="font-size:.8rem;opacity:.7;">${coords}</div>` : ""}
    </div>
  `;
}

  // ======================
  // MAP INIT
  // ======================

  function initMap() {
    map = L.map(mapEl).setView([36.1, -87.4], 8);
    window.currentMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    prayerLayer = L.layerGroup().addTo(map);
    homeGroupLayer = L.layerGroup().addTo(map);
    feastLayer = L.layerGroup().addTo(map);

    L.control.layers(null, {
      "Prayers": prayerLayer,
      "Home Groups": homeGroupLayer,
      "Feasts": feastLayer
    }).addTo(map);

    map.on("click", (e) => {
      if (!addMode) return;

      if (addMode === "prayer") openPrayerModal(e.latlng.lat, e.latlng.lng);
      if (addMode === "feast") openFeastModal(e.latlng.lat, e.latlng.lng);

      addMode = null;
    });

    console.log("✅ Map initialized");
  }

  // ======================
  // PRAYERS
  // ======================

  function addMarker(prayer) {
    const lat = Number(prayer.lat);
    const lng = Number(prayer.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    if (activeMarkers[prayer.id]) {
      activeMarkers[prayer.id].setLatLng([lat, lng]);
      return;
    }

    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: prayer.prayed ? "#22c55e" : "#f97316",
      color: "#111",
      weight: 1,
      fillOpacity: 0.85
    }).addTo(prayerLayer);

    marker.bindPopup(`
      <strong>${prayer.name || "Anonymous"}</strong><br>
      <p>${prayer.message || ""}</p>
    `);

    activeMarkers[prayer.id] = marker;
  }

  function listenForPrayers() {
    onSnapshot(collection(db, "prayers"), snap => {
      snap.docChanges().forEach(change => {
        const id = change.doc.id;
        const data = change.doc.data();

        if (change.type !== "removed") {
          addMarker({ id, ...data });
        }

        if (change.type === "removed" && activeMarkers[id]) {
          prayerLayer.removeLayer(activeMarkers[id]);
          delete activeMarkers[id];
        }
      });
    });
  }

  async function savePrayer(lat, lng, name, message) {
    await addDoc(collection(db, "prayers"), {
      lat,
      lng,
      name: name || "Anonymous",
      message,
      prayed: false,
      createdAt: serverTimestamp()
    });
  }

// ======================
// MODALS
// ======================

function openPrayerModal(lat, lng) {
    console.log("OPENING MODAL");
  pendingLatLng = { lat, lng };

  const panel = document.getElementById("prayerPorchPanel");
  const message = document.getElementById("prayerPorchMessage");

  if (!panel || !message) return;

  message.innerHTML = `
  <div class="flex flex-col gap-3">
    <input
      id="prayerNameInput"
      placeholder="Name optional"
      class="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400"
    />

    <textarea
      id="prayerMessageInput"
      placeholder="Prayer request"
      class="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400 min-h-[120px]"
    ></textarea>

    <button
      id="prayerSaveBtn"
      type="button"
      class="w-full px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium"
    >
      Save Prayer
    </button>
  </div>

`;

  panel.classList.remove("hidden");
  panel.classList.add("flex");

  // 🔑 disable map interaction while modal is open
  map.dragging.disable();
  map.scrollWheelZoom.disable();

  document.getElementById("prayerSaveBtn").onclick = async () => {
    const name = document.getElementById("prayerNameInput").value;
    const text = document.getElementById("prayerMessageInput").value;

    await savePrayerMarker(name, text, lat, lng);

    panel.classList.add("hidden");
    panel.classList.remove("flex");
    pendingLatLng = null;

    // 🔑 re-enable map
    map.dragging.enable();
    map.scrollWheelZoom.enable();
  };
}

function openFeastModal(lat, lng) {
  const panel = document.getElementById("prayerPorchPanel");
  const message = document.getElementById("prayerPorchMessage");
  if (!panel || !message) return;

  message.innerHTML = `
    <div class="flex flex-col gap-3">
      <input
        id="feastNameInput"
        placeholder="Name optional"
        class="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white"
      />

      <select
        id="feastTypeInput"
        class="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white"
      >
        <option value="Shavuot">Shavuot</option>
        <option value="Sukkot">Sukkot</option>
      </select>

      <button
        id="feastSaveBtn"
        class="w-full px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
      >
        Save Feast
      </button>
    </div>

  `;

  panel.classList.remove("hidden");
  panel.classList.add("flex");

  map.dragging.disable();
  map.scrollWheelZoom.disable();

  document.getElementById("feastSaveBtn").onclick = async () => {
    const name = document.getElementById("feastNameInput").value;
    const feastType = document.getElementById("feastTypeInput").value;

    await addDoc(collection(db, "feasts"), {
      name: name || "Anonymous",
      feastType,
      lat,
      lng,
      createdAt: serverTimestamp()
    });

    panel.classList.add("hidden");
    panel.classList.remove("flex");

    map.dragging.enable();
    map.scrollWheelZoom.enable();
  };
}

  // ======================
  // HOME GROUPS (RESTORED)
  // ======================

  async function loadHomeGroups() {
    try {
      const res = await fetch("./data/HomeGroupsMap.geojson");

      if (!res.ok) {
        console.error("HomeGroups fetch failed:", res.status);
        return;
      }

      const data = await res.json();
      const features = data.features || [];

      features.forEach((feature, i) => {
        const latlng = getHomeGroupsLatLng(feature);
        if (!latlng) return;

        const marker = L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#3b82f6",
          color: "#111",
          weight: 1,
          fillOpacity: 0.9
        });

        marker.bindPopup(`
          <strong>${feature?.properties?.Name || `Group ${i + 1}`}</strong>
        `);

        homeGroupLayer.addLayer(marker);
      });

      console.log("🏠 HomeGroups loaded:", features.length);

    } catch (err) {
      console.error("HomeGroups error:", err);
    }
  }

  // ======================
  // FEASTS
  // ======================

  function addFeastMarker(feast) {
    const lat = Number(feast.lat);
    const lng = Number(feast.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    if (activeFeasts[feast.id]) {
      activeFeasts[feast.id].setLatLng([lat, lng]);
      return;
    }

    const marker = L.circleMarker([lat, lng], {
      radius: 7,
      fillColor: "#facc15",
      color: "#111",
      weight: 1,
      fillOpacity: 0.9
    }).addTo(feastLayer);

    marker.bindPopup(`
      <strong>${feast.name || "Feast"}</strong><br>
      <small>${feast.feastType || ""}</small>
    `);

    activeFeasts[feast.id] = marker;
  }

  function listenForFeasts() {
    onSnapshot(collection(db, "feasts"), snap => {
      snap.docChanges().forEach(change => {
        const id = change.doc.id;
        const data = change.doc.data();

        if (change.type !== "removed") {
          addFeastMarker({ id, ...data });
        }

        if (change.type === "removed" && activeFeasts[id]) {
          feastLayer.removeLayer(activeFeasts[id]);
          delete activeFeasts[id];
        }
      });
    });
  }

  // ======================
  // UI MODE SWITCH
  // ======================

  document.addEventListener("click", (e) => {
    if (e.target?.id === "prayerMapAddBtn") {
      addMode = "prayer";
      alert("Click map for prayer");
    }

    if (e.target?.id === "feastMapAddBtn") {
      addMode = "feast";
      alert("Click map for feast");
    }
  });

  // ======================
  // INIT
  // ======================

  function init() {
    initMap();
    listenForPrayers();
    listenForFeasts();
    loadHomeGroups();
  }

  init();

})();
