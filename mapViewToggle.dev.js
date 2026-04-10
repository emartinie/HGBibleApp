console.log("🗺️ mapFullscreen.dev.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("fullscreenMapBtn");
  const mapContainer = document.getElementById("mapContainer");

  if (!btn || !mapContainer) {
    console.warn("⚠️ Fullscreen button or mapContainer missing");
    return;
  }

  let isFullscreen = false;

  btn.addEventListener("click", () => {
    isFullscreen = !isFullscreen;

    mapContainer.classList.toggle("fullscreen");

    btn.textContent = isFullscreen
      ? "❌ Exit"
      : "🗺️ Fullscreen";

    // Let CSS apply before Leaflet recalculates
    setTimeout(() => {
      if (window.map) {
        window.map.invalidateSize();
        console.log("🟢 Leaflet size recalculated");
      }
    }, 100);
  });
});