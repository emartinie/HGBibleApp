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
  const prayerData = {};

  const activeFeasts = {};

  // ======================
  // HELPERS
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
      .replace(/([A-Z0-9._%+-]{4,}@[A-Z0-9.-]+\.[A-Z]{2,})/gi, m => maskPrivateText(m))
      .replace(/(\+?\d[\d\-\s().]{6,}\d)/g, m => maskPrivateText(m))
      .replace(/(Address:\s*)([^<\n]+)/gi, (_, p, v) => p + maskPrivateText(v.trim()));
  }

  function getHomeGroupsLatLng(feature) {
    const raw = feature?.properties?.Coordinates;
    if (!raw) return null;

    if (typeof raw === "string") {
      const parts = raw.split(",").map(s => Number(s.trim()));
      if (parts.length < 2) return null;
      return [parts[1], parts[0]];
    }

    if (Array.isArray(raw) && raw.length >= 2) {
      return [Number(raw[1]), Number(raw[0])];
    }

    return null;
  }

  function popupFor(feature, i) {
    const p = feature?.properties || {};
    return `
      <div>
        <strong>${p.Name || p.name || `Group ${i + 1}`}</strong>
        ${p.Description ? `<div>${maskDescription(p.Description)}</div>` : ""}
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

      if (addMode === "prayer") {
        openPrayerModal(e.latlng.lat, e.latlng.lng);
      }

      if (addMode === "feast") {
        openFeastModal(e.latlng.lat, e.latlng.lng);
      }

      addMode = null;
    });

    map.on("popupopen", (e) => {
      const btn = e.popup._contentNode.querySelector(".mark-prayed-btn");
      if (!btn) return;

      btn.addEventListener("click", async () => {
        await updateDoc(doc(db, "prayers", btn.dataset.id), {
          prayed: true
        });
      });
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
      <button data-id="${prayer.id}" class="mark-prayed-btn">
        🙏 I Prayed
      </button>
    `);

    activeMarkers[prayer.id] = marker;
    prayerData[prayer.id] = prayer;
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

  // ======================
  // FEASTS (FIXED)
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
  // MODALS
  // ======================

  function openPrayerModal(lat, lng) {
    const panel = document.getElementById("prayerPorchPanel");
    const message = document.getElementById("prayerPorchMessage");
    if (!panel || !message) return;

    message.innerHTML = `
      <input id="prayerNameInput" placeholder="Name" />
      <textarea id="prayerMessageInput"></textarea>
      <button id="prayerSaveBtn">Save Prayer</button>
    `;

    panel.classList.remove("hidden");
    map.dragging.disable();

    document.getElementById("prayerSaveBtn").onclick = async () => {
      await addDoc(collection(db, "prayers"), {
        name: document.getElementById("prayerNameInput").value,
        message: document.getElementById("prayerMessageInput").value,
        lat,
        lng,
        prayed: false,
        createdAt: serverTimestamp()
      });

      panel.classList.add("hidden");
      map.dragging.enable();
    };
  }

  function openFeastModal(lat, lng) {
    const panel = document.getElementById("prayerPorchPanel");
    const message = document.getElementById("prayerPorchMessage");
    if (!panel || !message) return;

    message.innerHTML = `
      <input id="feastNameInput" />
      <select id="feastTypeInput">
        <option>Shavuot</option>
        <option>Sukkot</option>
      </select>
      <button id="feastSaveBtn">Save Feast</button>
    `;

    panel.classList.remove("hidden");
    map.dragging.disable();

    document.getElementById("feastSaveBtn").onclick = async () => {
      await addDoc(collection(db, "feasts"), {
        name: document.getElementById("feastNameInput").value,
        feastType: document.getElementById("feastTypeInput").value,
        lat,
        lng,
        createdAt: serverTimestamp()
      });

      panel.classList.add("hidden");
      map.dragging.enable();
    };
  }

  // ======================
  // UI EVENTS
  // ======================

  document.addEventListener("click", e => {
    if (e.target?.id === "prayerMapAddBtn") {
      addMode = "prayer";
    }

    if (e.target?.id === "feastMapAddBtn") {
      addMode = "feast";
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
