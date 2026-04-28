import { db } from "./firebase-init.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

console.log("🗺️ prayermap.js loaded");

(function () {
  const mapEl = document.getElementById("prayerMap");
  if (!mapEl || typeof L === "undefined") return;

  let map;
  let prayerLayer;
  let homeGroupLayer;

  let addMode = false;
  let pendingLatLng = null;

  const activeMarkers = {};
  const prayerData = {};

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
      .replace(/([A-Z0-9._%+-]{4,}@[A-Z0-9.-]+\.[A-Z]{2,})/gi, (m) => maskPrivateText(m))
      .replace(/(\+?\d[\d\-\s().]{6,}\d)/g, (m) => maskPrivateText(m))
      .replace(/(Address:\s*)([^<\n]+)/gi, (_, prefix, value) => prefix + maskPrivateText(value.trim()));
  }

  function getHomeGroupsLatLng(feature) {
    const raw = feature?.properties?.Coordinates;
    if (!raw) return null;

    if (typeof raw === "string") {
      const parts = raw.split(",").map(s => Number(s.trim()));
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
  // INIT MAP
  // ======================
  function initMap() {
    map = L.map(mapEl).setView([36.1, -87.4], 8);
    window.currentMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    prayerLayer = L.layerGroup().addTo(map);

    homeGroupLayer =
      typeof L.markerClusterGroup === "function"
        ? L.markerClusterGroup()
        : L.layerGroup();

    map.addLayer(homeGroupLayer);

    L.control.layers(null, {
      "Prayers": prayerLayer,
      "Home Groups": homeGroupLayer
    }).addTo(map);

    map.on("click", (e) => {
      if (!addMode) return;
      addMode = false;
      openPrayerModal(e.latlng.lat, e.latlng.lng);
    });

    map.on("popupopen", (e) => {
      const btn = e.popup._contentNode.querySelector(".mark-prayed-btn");
      if (!btn) return;

      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        await updateDoc(doc(db, "prayers", id), { prayed: true });
      });
    });

    console.log("✅ Map initialized");
  }

  // ======================
  // PRAYER MARKERS
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
      <button data-id="${prayer.id}" class="mark-prayed-btn">
        ${prayer.prayed ? "🙏 Prayed" : "🙏 I Prayed"}
      </button>
    `);

    activeMarkers[prayer.id] = marker;
    prayerData[prayer.id] = prayer;
  }

  function listenForPrayers() {
    onSnapshot(collection(db, "prayers"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const id = change.doc.id;
        const data = change.doc.data();

        if (change.type === "added" || change.type === "modified") {
          addMarker({ id, ...data });
        }

        if (change.type === "removed" && activeMarkers[id]) {
          prayerLayer.removeLayer(activeMarkers[id]);
          delete activeMarkers[id];
        }
      });
    });
  }

  // ======================
  // HOME GROUPS
  // ======================
  async function loadHomeGroups() {
    try {
      const res = await fetch("./data/HomeGroupsMap.geojson");
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

        marker.bindPopup(popupFor(feature, i));
        homeGroupLayer.addLayer(marker);
      });

      console.log("🏠 HomeGroups loaded:", features.length);
    } catch (err) {
      console.error("HomeGroups error:", err);
    }
  }

  // ======================
  // SAVE PRAYER
  // ======================
  async function savePrayerMarker(name, message, lat, lng) {
    if (!message) return;

    await addDoc(collection(db, "prayers"), {
      name: name || "Anonymous",
      message,
      lat,
      lng,
      prayed: false,
      createdAt: serverTimestamp()
    });
  }

  // ======================
  // MODAL
  // ======================
  function openPrayerModal(lat, lng) {
    pendingLatLng = { lat, lng };

    const panel = document.getElementById("prayerPorchPanel");
    const message = document.getElementById("prayerPorchMessage");

    if (!panel || !message) return;

    message.innerHTML = `
      <input id="prayerNameInput" placeholder="Name optional">
      <textarea id="prayerMessageInput" placeholder="Prayer request"></textarea>
      <button id="prayerSaveBtn">Save Prayer</button>
    `;

    panel.classList.remove("hidden");

    document.getElementById("prayerSaveBtn").onclick = async () => {
      const name = document.getElementById("prayerNameInput").value;
      const text = document.getElementById("prayerMessageInput").value;

      await savePrayerMarker(name, text, lat, lng);

      panel.classList.add("hidden");
      pendingLatLng = null;
    };
  }

  // ======================
  // LOCATE USER
  // ======================
  window.locateUser = function () {
    if (!window.currentMap) return;

    window.currentMap.locate({ setView: true, maxZoom: 11 });

    window.currentMap.once("locationfound", (e) => {
      L.marker(e.latlng).addTo(window.currentMap)
        .bindPopup("📍 You are here")
        .openPopup();
    });
  };

// ======================
// UI
// ======================
function wireUi() {
  const btn = document.getElementById("prayerMapAddBtn");

  if (!btn) {
    console.warn("Button not found");
    return;
  }

  btn.onclick = () => {
    addMode = true;
    alert("Click the map where you want to place the prayer.");
  };
}

// ======================
// INIT
// ======================
function init() {
  initMap();
  listenForPrayers();
  loadHomeGroups();
  wireUi();
}

// run AFTER everything is defined
init();
