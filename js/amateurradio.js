(function () {
  function showMessage(text) {
    if (typeof window.openPorchPanel === "function") {
      window.openPorchPanel("Amateur Radio", `<p>${text}</p>`);
    } else {
      alert(text);
    }
  }

  function setFreq(freq) {
    showMessage(`Tune radio to ${freq} MHz`);
    console.log("Set frequency:", freq);
  }

  function logContact() {
    const call = prompt("Callsign / Notes:");
    if (!call) return;
    console.log("Logged:", call);
    showMessage(`Saved: ${call}`);
  }

  function centerMap() {
    showMessage("This will link radio → map markers.");
  }

  function openLibrary() {
    if (typeof getResource === "function") {
      getResource("htmlPanel")?.open("https://emartinie.github.io/MainStage/2-prepper/index.html");
    } else {
      window.open("https://emartinie.github.io/MainStage/2-prepper/index.html", "_blank", "noopener");
    }
  }

  function wireButtons() {
    document.querySelectorAll(".ar-card [data-freq]").forEach(btn => {
      btn.addEventListener("click", () => setFreq(btn.dataset.freq));
    });

    document.getElementById("arOfflineGuideBtn")?.addEventListener("click", () => {
      showMessage("Offline comms guide coming soon.");
    });

    document.getElementById("arLoadoutBtn")?.addEventListener("click", () => {
      showMessage("Gear builder coming soon.");
    });

    document.getElementById("arScanModeBtn")?.addEventListener("click", () => {
      showMessage("Scan mode coming soon.");
    });

    document.getElementById("arRepeatersBtn")?.addEventListener("click", () => {
      showMessage("Local repeater lookup coming.");
    });

    document.getElementById("arCheckInBtn")?.addEventListener("click", () => {
      showMessage("Check-in system coming.");
    });

    document.getElementById("arActiveNetsBtn")?.addEventListener("click", () => {
      showMessage("Active nets coming.");
    });

    document.getElementById("arLogContactBtn")?.addEventListener("click", logContact);
    document.getElementById("arCenterMapBtn")?.addEventListener("click", centerMap);
    document.getElementById("arBrowseLibraryBtn")?.addEventListener("click", openLibrary);
  }

  wireButtons();
})();
