
document.addEventListener("DOMContentLoaded", () => {

  // Quick Access buttons
  document.getElementById("openIntertextBtn")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("open-intertext"));
  });

  document.getElementById("openNtReaderBtn")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("open-nt-reader"));
  });

  // Reference loader
  document.getElementById("loadBtn")?.addEventListener("click", () => {
    const val = document.getElementById("referenceSelect")?.value;
    window.dispatchEvent(new CustomEvent("load-reference", { detail: val }));
  });

  // Toggle sections
  const toggles = {
    toggleJewish: "jewishSection",
    toggleNT: "ntSection",
    toggleFathers: "fathersSection",
    toggleDSS: "dssSection",
    togglePeople: "peopleSection"
  };

  Object.entries(toggles).forEach(([btnId, sectionId]) => {
    document.getElementById(btnId)?.addEventListener("click", () => {
      const el = document.getElementById(sectionId);
      if (!el) return;
      el.classList.toggle("hidden");
    });
  });

});
