(function () {
  const storageKey = "hgbibleapp:textSize";
  const sizes = [
    { label: "Normal", value: "1" },
    { label: "Large", value: "1.12" },
    { label: "XL", value: "1.25" }
  ];

  if (window.HGTextSizePreference && typeof window.HGTextSizePreference.init === "function") {
    window.HGTextSizePreference.init();
    return;
  }

  function findSize(value) {
    return sizes.find((size) => size.value === value) || sizes[0];
  }

  function readSavedSize() {
    try {
      return findSize(localStorage.getItem(storageKey));
    } catch (error) {
      return sizes[0];
    }
  }

  function saveSize(size) {
    try {
      localStorage.setItem(storageKey, size.value);
    } catch (error) {
      /* Preference is still applied for this session when storage is unavailable. */
    }
  }

  function applySize(size) {
    document.documentElement.style.setProperty("--app-text-scale", size.value);
    document.documentElement.dataset.textSizePreference = size.label.toLowerCase();
  }

  function updateButton(button, size) {
    if (!button) return;
    button.textContent = `Text: ${size.label}`;
    button.setAttribute("aria-label", `Reading text size: ${size.label}. Activate to change.`);
  }

  function cycleSize() {
    const current = readSavedSize();
    const currentIndex = sizes.findIndex((size) => size.value === current.value);
    const next = sizes[(currentIndex + 1) % sizes.length];
    saveSize(next);
    applySize(next);
    updateButton(document.getElementById("textSizePreferenceBtn"), next);
  }

  function init() {
    const size = readSavedSize();
    applySize(size);

    const button = document.getElementById("textSizePreferenceBtn");
    updateButton(button, size);

    if (!button || button.dataset.textSizePreferenceBound === "true") return;
    button.dataset.textSizePreferenceBound = "true";
    button.addEventListener("click", cycleSize);
  }

  window.HGTextSizePreference = {
    init,
    applySize,
    sizes: sizes.slice()
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
