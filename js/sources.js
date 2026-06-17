console.log("sources.js executed");
console.log("sources init");
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded callback fired");
});

  // Quick Access buttons
console.log("sources init");

document.getElementById("openIntertextBtn")?.addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("open-intertext"));
});

document.getElementById("openNtReaderBtn")?.addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("open-nt-reader"));
});

document.getElementById("loadBtn")?.addEventListener("click", () => {
  const val = document.getElementById("referenceSelect")?.value;
  window.dispatchEvent(new CustomEvent("load-reference", { detail: val }));
});

const toggles = {
  toggleJewish: "jewishSection",
  toggleNT: "ntSection",
  toggleFathers: "fathersSection",
  toggleDSS: "dssSection",
  togglePeople: "peopleSection"
};

Object.entries(toggles).forEach(([btnId, sectionId]) => {
  document.getElementById(btnId)?.addEventListener("click", () => {
    document.getElementById(sectionId)?.classList.toggle("hidden");
  });
});

console.log("sources listeners attached");