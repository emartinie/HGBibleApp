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
  const mapEl = document.getElementById("hgMapCanvas");
  if (!mapEl) return;

  if (typeof L === "undefined") {
    mapEl.innerHTML = "<div style='padding:16px;color:#a8b2c7;'>Leaflet not loaded.</div>";
    return;

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

  }

  if (mapEl._hgMapInstance) {
    mapEl._hgMapInstance.remove();
    mapEl._hgMapInstance = null;
  }

  const map = L.map(mapEl).setView([39.5, -98.35], 4);
  mapEl._hgMapInstance = map;
  window.currentMap = map;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  const markers =
    typeof L.markerClusterGroup === "function"
      ? L.markerClusterGroup()
      : L.featureGroup();

  map.addLayer(markers);

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
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

      return [lat, lon];
    }

    if (Array.isArray(raw) && raw.length >= 2) {
      const lon = Number(raw[0]);
      const lat = Number(raw[1]);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

      return [lat, lon];
    }

    return null;
  }

  function labelFor(feature, i) {
    const p = feature?.properties || {};
    return (
      p.Name ||
      p.name ||
      p.Title ||
      p.title ||
      p.Group ||
      p.group ||
      `Marker ${i + 1}`
    );
  }

  function popupFor(feature, i) {
    const p = feature?.properties || {};
    const name = labelFor(feature, i);
    const message = p.Message || p.message || "";
    const description = maskDescription(p.description || p.Description || "");
    const visibility = p.visibility ?? p.Visibility ?? "";
    const coords = maskDescription(p.Coordinates || "");

    return `
      <div class="map-popup">
        <strong>${name}</strong>
        ${message ? `<div style="margin-top:6px;"><em>${message}</em></div>` : ""}
        ${!message && description ? `<div style="margin-top:6px;">${description}</div>` : ""}
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
      const latlngs = [];
      let validCount = 0;
      let skippedCount = 0;

      features.forEach((feature, i) => {
        const latlng = getHomeGroupsLatLng(feature);

        if (!latlng) {
          skippedCount++;
          console.warn(`Skipping feature ${i}: bad or missing Coordinates`, feature);
          return;
        }

        latlngs.push(latlng);

        const marker = L.marker(latlng);
        marker.bindPopup(popupFor(feature, i));
        markers.addLayer(marker);
        validCount++;
      });

      console.log(`GeoJSON loaded: ${validCount} markers, ${skippedCount} skipped`);

      if (latlngs.length) {
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [8, 8] });

        // one extra zoom-in if possible
        const currentZoom = map.getZoom();
        const maxZoom = map.getMaxZoom() || 19;
        if (currentZoom < maxZoom) {
          setTimeout(() => map.setZoom(Math.min(currentZoom + 2, maxZoom)), 80);
        }
      } else {
        L.marker([36.1659, -86.7844])
          .addTo(map)
          .bindPopup("No valid GeoJSON coordinates found")
          .openPopup();
      }

      setTimeout(() => map.invalidateSize(), 120);
      setTimeout(() => map.invalidateSize(), 500);
    })
    .catch(err => {
      console.error("GeoJSON load error:", err);
      L.marker([36.1659, -86.7844])
        .addTo(map)
        .bindPopup("GeoJSON failed to load")
        .openPopup();
    });

  window.locateUser = function () {
    if (!window.currentMap) return;

    const activeMap = window.currentMap;

    activeMap.locate({
      setView: true,
      maxZoom: 11,
      enableHighAccuracy: true,
      timeout: 10000
    });

    activeMap.once("locationfound", function (e) {
      if (window.userLocationMarker) {
        activeMap.removeLayer(window.userLocationMarker);
      }

      if (window.userLocationCircle) {
        activeMap.removeLayer(window.userLocationCircle);
      }

      window.userLocationMarker = L.marker(e.latlng)
        .addTo(activeMap)
        .bindPopup("📍 You are here. Zoom out to find people near you.")
        .openPopup();

      window.userLocationCircle = L.circle(e.latlng, {
        radius: e.accuracy || 30
      }).addTo(activeMap);
    });

    activeMap.once("locationerror", function (e) {
      console.warn("Geolocation error:", e.message);
    });
  };
})();
