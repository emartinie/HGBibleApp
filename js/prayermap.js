import { db, auth } from "./firebase-init.js";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

console.log("🗺️ prayermap.js loaded");

(function () {

  let mapEl = null;
  let map;
  let prayerLayer;
  let homeGroupLayer;
  let feastLayer;
  let prayersUnsubscribe = null;
  let feastsUnsubscribe = null;
  let modeClickBound = false;
  let prayerSearchEl = null;
  let locateBtn = null;
  let userLocationMarker = null;
  let userLocationCircle = null;

  let addMode = null; // "prayer"
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
  const wrapper = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = labelFor(feature, i);
  wrapper.append(name);

  const descriptionText = maskDescription(p.description || p.Description || "");
  if (descriptionText) {
    const description = document.createElement("div");
    description.style.marginTop = "6px";
    description.textContent = descriptionText;
    wrapper.append(description);
  }

  const coordinatesText = maskDescription(p.Coordinates || "");
  if (coordinatesText) {
    const coordinates = document.createElement("div");
    coordinates.style.fontSize = ".8rem";
    coordinates.style.opacity = ".7";
    coordinates.textContent = coordinatesText;
    wrapper.append(coordinates);
  }

  return wrapper;
}

function prayerPopup(prayer) {
  const wrapper = document.createElement("div");
  const name = document.createElement("strong");
  const message = document.createElement("p");
  const location = document.createElement("small");

  name.textContent = String(prayer.name || "Anonymous");
  message.textContent = String(prayer.message || "");
  location.textContent = "Approximate location";

  wrapper.append(name, message, location);
  return wrapper;
}

function setPrayerMapStatus(message) {
  const status = document.getElementById("prayerMapStatus");
  if (status) status.textContent = message || "";
}

function isGoogleUser(user) {
  return Boolean(
    user &&
    !user.isAnonymous &&
    user.providerData?.some(provider => provider.providerId === "google.com")
  );
}

function prayerSearchText(prayer) {
  return `${prayer.name || ""} ${prayer.message || ""}`.toLowerCase();
}

function applyPrayerSearch() {
  if (!prayerLayer) return;

  const query = String(prayerSearchEl?.value || "").trim().toLowerCase();

  Object.values(activeMarkers).forEach(marker => {
    const matches = !query || String(marker._prayerSearchText || "").includes(query);
    const isVisible = prayerLayer.hasLayer(marker);

    if (matches && !isVisible) prayerLayer.addLayer(marker);
    if (!matches && isVisible) prayerLayer.removeLayer(marker);
  });
}

function handlePrayerSearch() {
  applyPrayerSearch();
}

function handleLocationFound(event) {
  if (!map) return;

  map.off("locationerror", handleLocationError);

  if (userLocationMarker) map.removeLayer(userLocationMarker);
  if (userLocationCircle) map.removeLayer(userLocationCircle);

  userLocationMarker = L.marker(event.latlng)
    .addTo(map)
    .bindPopup("📍 You are here. Zoom out to find people near you.")
    .openPopup();

  userLocationCircle = L.circle(event.latlng, {
    radius: event.accuracy || 30
  }).addTo(map);
}

function handleLocationError(event) {
  if (!map) return;

  map.off("locationfound", handleLocationFound);
  console.warn("Geolocation error:", event.message);
  window.alert(`Unable to locate you. ${event.message || "Please check location permissions."}`);
}

function locateUser() {
  if (!map) return;

  map.off("locationfound", handleLocationFound);
  map.off("locationerror", handleLocationError);
  map.once("locationfound", handleLocationFound);
  map.once("locationerror", handleLocationError);
  map.locate({
    setView: true,
    maxZoom: 11,
    enableHighAccuracy: true,
    timeout: 10000
  });
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
      addMode = null;
    });

    console.log("✅ Map initialized");
  }

  // ======================
  // PRAYERS
  // ======================

  function addMarker(prayer) {
    const lat = Number(Number(prayer.lat).toFixed(2));
    const lng = Number(Number(prayer.lng).toFixed(2));
    if (isNaN(lat) || isNaN(lng)) return;

    const searchText = prayerSearchText(prayer);
    const popup = prayerPopup(prayer);

    if (activeMarkers[prayer.id]) {
      const existingMarker = activeMarkers[prayer.id];
      existingMarker.setLatLng([lat, lng]);
      existingMarker._prayerSearchText = searchText;
      existingMarker.setPopupContent(popup);
      applyPrayerSearch();
      return;
    }

    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: prayer.prayed ? "#22c55e" : "#f97316",
      color: "#111",
      weight: 1,
      fillOpacity: 0.85
    }).addTo(prayerLayer);

    marker._prayerSearchText = searchText;
    marker.bindPopup(popup);

    activeMarkers[prayer.id] = marker;
    applyPrayerSearch();
  }

  function listenForPrayers() {
    const recentPrayers = query(
      collection(db, "prayers"),
      orderBy("createdAt", "desc"),
      limit(250)
    );

    prayersUnsubscribe = onSnapshot(
      recentPrayers,
      snap => {
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
        setPrayerMapStatus("");
      },
      error => {
        console.error("Prayer listener failed:", error);
        setPrayerMapStatus("Prayer requests could not be loaded. Please try again.");
      }
    );
  }

  async function ensureGoogleUser() {
    if (isGoogleUser(auth.currentUser)) return auth.currentUser;

    const provider = new GoogleAuthProvider();

    try {
      if (auth.currentUser?.isAnonymous) {
        await linkWithPopup(auth.currentUser, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      if (
        error.code === "auth/credential-already-in-use" ||
        error.code === "auth/email-already-in-use"
      ) {
        await signOut(auth);
        await signInWithPopup(auth, provider);
      } else {
        throw error;
      }
    }

    if (!isGoogleUser(auth.currentUser)) {
      throw new Error("Google sign-in is required to submit a prayer.");
    }

    return auth.currentUser;
  }

  async function savePrayer(lat, lng, name, message) {
    const user = await ensureGoogleUser();
    const safeMessage = String(message || "").trim().slice(0, 1000);
    if (!safeMessage) throw new Error("Prayer request is required.");

    const approximateLat = Number(Number(lat).toFixed(2));
    const approximateLng = Number(Number(lng).toFixed(2));

    await addDoc(collection(db, "prayers"), {
      lat: approximateLat,
      lng: approximateLng,
      name: String(name || "Anonymous").trim().slice(0, 80) || "Anonymous",
      message: safeMessage,
      prayed: false,
      ownerUid: user.uid,
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
      maxlength="80"
      placeholder="Name or short title (optional)"
      class="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400"
    />

    <textarea
      id="prayerMessageInput"
      maxlength="1000"
      required
      placeholder="Prayer request"
      class="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-400 min-h-[120px]"
    ></textarea>

    <p id="prayerFormStatus" class="text-sm text-amber-200" role="status" aria-live="polite"></p>

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

  const closeBtn = document.getElementById("prayerPorchCloseBtn");

if (closeBtn) {
  closeBtn.onclick = () => {
    panel.classList.add("hidden");
    panel.classList.remove("flex");

    map.dragging.enable();
    map.scrollWheelZoom.enable();

    pendingLatLng = null;
    addMode = null;
  };
}

  // 🔑 disable map interaction while modal is open
  map.dragging.disable();
  map.scrollWheelZoom.disable();

  document.getElementById("prayerSaveBtn").onclick = async () => {
    const nameInput = document.getElementById("prayerNameInput");
    const messageInput = document.getElementById("prayerMessageInput");
    const saveButton = document.getElementById("prayerSaveBtn");
    const formStatus = document.getElementById("prayerFormStatus");
    const name = String(nameInput?.value || "").trim();
    const text = String(messageInput?.value || "").trim();

    if (!text) {
      if (formStatus) formStatus.textContent = "Please enter a prayer request.";
      messageInput?.focus();
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Submitting...";
    if (formStatus) formStatus.textContent = "Google sign-in is required. Opening sign-in...";

    try {
      await savePrayer(lat, lng, name, text);
      panel.classList.add("hidden");
      panel.classList.remove("flex");
      pendingLatLng = null;
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      setPrayerMapStatus("Your prayer was submitted with an approximate location.");
    } catch (error) {
      console.error("Prayer submission failed:", error);
      if (formStatus) {
        formStatus.textContent = error?.code?.startsWith("auth/")
          ? "Google sign-in was not completed. Please allow the sign-in window and try again."
          : (error?.message || "Your prayer could not be submitted. Please try again.");
      }
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Save Prayer";
    }
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

  const closeBtn = document.getElementById("prayerPorchCloseBtn");

if (closeBtn) {
  closeBtn.onclick = () => {
    panel.classList.add("hidden");
    panel.classList.remove("flex");

    map.dragging.enable();
    map.scrollWheelZoom.enable();

    pendingLatLng = null;
    addMode = null;
  };
}

    // 🔑 disable map interaction while modal is open
  map.dragging.disable();
  map.scrollWheelZoom.disable();

  document.getElementById("feastSaveBtn").onclick = async () => {
    const name = document.getElementById("feastNameInput").value;
    const feastType = document.getElementById("feastTypeInput").value;

    const user = await ensureGoogleUser();
    await addDoc(collection(db, "feasts"), {
      name: String(name || "Anonymous").trim().slice(0, 80) || "Anonymous",
      feastType,
      lat,
      lng,
      ownerUid: user.uid,
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

  marker.bindPopup(popupFor(feature, i));

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

    const popup = document.createElement("div");
    const name = document.createElement("strong");
    const feastType = document.createElement("small");
    name.textContent = String(feast.name || "Feast");
    feastType.textContent = String(feast.feastType || "");
    popup.append(name, document.createElement("br"), feastType);
    marker.bindPopup(popup);

    activeFeasts[feast.id] = marker;
  }

  function listenForFeasts() {
    feastsUnsubscribe = onSnapshot(collection(db, "feasts"), snap => {
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

  function handleModeClick(e) {
    if (e.target?.id === "prayerMapAddBtn") {
      addMode = "prayer";
      alert("Click map to add your prayer");
    }

  }

  function wireModeClick() {
    if (modeClickBound) return;
    modeClickBound = true;
    document.addEventListener("click", handleModeClick);
  }

  // ======================
  // INIT
  // ======================

  function init() {
    if (window.prayerMapInitialized) {
      console.warn("prayermap already initialized");
      return;
    }

    mapEl = document.getElementById("prayerMap");
    prayerSearchEl = document.getElementById("prayerMapSearch");
    locateBtn = document.getElementById("prayerMapLocateBtn");
    if (!mapEl || typeof L === "undefined") return;

    prayerSearchEl?.addEventListener("input", handlePrayerSearch);
    locateBtn?.addEventListener("click", locateUser);

    window.prayerMapInitialized = true;
    wireModeClick();
    initMap();
    listenForPrayers();
    listenForFeasts();
    loadHomeGroups();
  }

  function destroy() {
    prayerSearchEl?.removeEventListener("input", handlePrayerSearch);
    locateBtn?.removeEventListener("click", locateUser);

    if (map) {
      map.off("locationfound", handleLocationFound);
      map.off("locationerror", handleLocationError);
      map.stopLocate();
    }
    if (prayersUnsubscribe) {
      prayersUnsubscribe();
      prayersUnsubscribe = null;
    }

    if (feastsUnsubscribe) {
      feastsUnsubscribe();
      feastsUnsubscribe = null;
    }

    if (map) {
      map.remove();
      map = null;
    }

    Object.keys(activeMarkers).forEach(id => delete activeMarkers[id]);
    Object.keys(activeFeasts).forEach(id => delete activeFeasts[id]);

    mapEl = null;
    prayerSearchEl = null;
    locateBtn = null;
    userLocationMarker = null;
    userLocationCircle = null;
    prayerLayer = null;
    homeGroupLayer = null;
    feastLayer = null;
    addMode = null;
    pendingLatLng = null;
    window.currentMap = null;
    window.prayerMapInitialized = false;
    document.removeEventListener("click", handleModeClick);
    modeClickBound = false;
  }

  window.initPrayerMapCard = init;
  window.destroyPrayerMapCard = destroy;

})();
