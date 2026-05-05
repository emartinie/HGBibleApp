(function () {
  console.log("🌟 Orbit Face Manager initializing...");

  const logoSrc = "./images/HGHouses.png";
  const videoSrc = "https://github.com/emartinie/MainStage/blob/main/videos/build_your_kingdom_here.mp4";

  let logoEl, videoEl, sonographEl;
  let showingVideo = false;
  let showingSonograph = false;

  const waitForPlayer = setInterval(() => {
    const floatingPlayer = document.getElementById("floatingPlayer");
    if (!floatingPlayer) return;

    clearInterval(waitForPlayer);
    console.log("✅ Floating player found, adding logo, video, and sonograph...");

    // --- Logo ---
    logoEl = document.createElement("img");
    logoEl.id = "orbitLogo";
    logoEl.src = logoSrc;
    logoEl.style.position = "absolute";
    logoEl.style.top = "50%";
    logoEl.style.left = "50%";
    logoEl.style.transform = "translate(-50%, -50%)";
    logoEl.style.width = "150px";
    logoEl.style.height = "140px";
    logoEl.style.pointerEvents = "none";
    logoEl.style.zIndex = "10000";
    floatingPlayer.appendChild(logoEl);

    // --- Video ---
    videoEl = document.createElement("video");
    videoEl.id = "orbitVideo";
    videoEl.src = videoSrc;
    videoEl.autoplay = false;
    videoEl.loop = false;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.style.position = "absolute";
    videoEl.style.borderRadius = "50%";
    videoEl.style.objectFit = "cover";
    videoEl.style.top = "50%";
    videoEl.style.left = "50%";
    videoEl.style.transform = "translate(-50%, -50%)";
    videoEl.style.width = "190px";
    videoEl.style.height = "190px";
    videoEl.style.pointerEvents = "none";
    videoEl.style.zIndex = "10000";
    videoEl.classList.add("hidden");
    floatingPlayer.appendChild(videoEl);

    // --- Sonograph (fake waveform) ---
    sonographEl = document.createElement("canvas");
    sonographEl.id = "orbitSonograph";
    sonographEl.width = 200;
    sonographEl.height = 200;
    sonographEl.style.position = "absolute";
    sonographEl.style.top = "50%";
    sonographEl.style.left = "50%";
    sonographEl.style.transform = "translate(-50%, -50%)";
    sonographEl.style.borderRadius = "50%";
    sonographEl.style.pointerEvents = "none";
    sonographEl.style.zIndex = "9999";
    sonographEl.classList.add("hidden");
    floatingPlayer.appendChild(sonographEl);

    const ctx = sonographEl.getContext("2d");
    function drawFakeSonograph() {
      if (sonographEl.classList.contains("hidden")) return;
      ctx.clearRect(0, 0, sonographEl.width, sonographEl.height);
      const bars = 30;
      const barWidth = sonographEl.width / bars;
      for (let i = 0; i < bars; i++) {
        const h = Math.random() * sonographEl.height * 0.6;
        ctx.fillStyle = rgba(0, 200, 255, 0.7);
        ctx.fillRect(i * barWidth, sonographEl.height - h, barWidth * 0.8, h);
      }
      requestAnimationFrame(drawFakeSonograph);
    }

    // --- Toggle functions ---
    function toggleVideo() {
      showingVideo = !showingVideo;
      if (showingVideo) {
        logoEl.classList.add("hidden");
        videoEl.classList.remove("hidden");
        videoEl.play();
        sonographEl.classList.add("hidden");
      } else {
        videoEl.pause();
        videoEl.classList.add("hidden");
        logoEl.classList.remove("hidden");
      }
    }

    function toggleSonograph() {
      showingSonograph = !showingSonograph;
      if (showingSonograph) {
        logoEl.classList.add("hidden");
        videoEl.classList.add("hidden");
        sonographEl.classList.remove("hidden");
        drawFakeSonograph();
      } else {
        sonographEl.classList.add("hidden");
        logoEl.classList.remove("hidden");
      }
    }

    // Expose toggles globally
    window.toggleOrbitVideo = toggleVideo;
    window.toggleOrbitSonograph = toggleSonograph;

    console.log("ℹ Use toggleOrbitVideo() or toggleOrbitSonograph() in console.");
  }, 200);
})();
