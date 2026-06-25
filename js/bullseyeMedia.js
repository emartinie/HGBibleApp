// bullseyeMedia.js
(function () {
  "use strict";

  const logoSrc = "images/HGHouses.png";
  const videoSrc = "videos/bg-motion.mp4";

  function waitForPlayer() {
    const floatingPlayer = document.getElementById("floatingPlayer");
    if (!floatingPlayer) {
      window.setTimeout(waitForPlayer, 200);
      return;
    }

    if (window.__orbitPlayer) {
      window.toggleOrbitVideo = window.__orbitPlayer.toggleVideo || window.toggleOrbitVideo;
      window.toggleOrbitSonograph = window.__orbitPlayer.toggleSonograph || window.toggleOrbitSonograph;
      return;
    }

    installFallbackFace(floatingPlayer);
  }

  function installFallbackFace(floatingPlayer) {
    if (document.getElementById("orbitLogo")) return;

    const logoEl = document.createElement("img");
    logoEl.id = "orbitLogo";
    logoEl.src = logoSrc;
    Object.assign(logoEl.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "150px",
      height: "140px",
      objectFit: "contain",
      pointerEvents: "none",
      zIndex: "10000"
    });
    floatingPlayer.appendChild(logoEl);

    const videoEl = document.createElement("video");
    videoEl.id = "orbitVideo";
    videoEl.src = videoSrc;
    videoEl.autoplay = false;
    videoEl.loop = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.classList.add("hidden");
    Object.assign(videoEl.style, {
      position: "absolute",
      borderRadius: "50%",
      objectFit: "cover",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "190px",
      height: "190px",
      pointerEvents: "none",
      zIndex: "10000"
    });
    floatingPlayer.appendChild(videoEl);

    const sonographEl = document.createElement("canvas");
    sonographEl.id = "orbitSonograph";
    sonographEl.width = 200;
    sonographEl.height = 200;
    sonographEl.classList.add("hidden");
    Object.assign(sonographEl.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: "9999"
    });
    floatingPlayer.appendChild(sonographEl);

    let face = "logo";

    function setFace(nextFace) {
      face = nextFace;
      logoEl.classList.toggle("hidden", face !== "logo");
      videoEl.classList.toggle("hidden", face !== "video");
      sonographEl.classList.toggle("hidden", face !== "sonograph");

      if (face === "video") videoEl.play().catch(() => {});
      else videoEl.pause();

      if (face === "sonograph") drawSonograph();
    }

    function drawSonograph() {
      if (face !== "sonograph") return;
      const ctx = sonographEl.getContext("2d");
      ctx.clearRect(0, 0, sonographEl.width, sonographEl.height);
      const bars = 30;
      const barWidth = sonographEl.width / bars;
      for (let i = 0; i < bars; i += 1) {
        const h = Math.random() * sonographEl.height * 0.6;
        ctx.fillStyle = "rgba(0, 200, 255, 0.7)";
        ctx.fillRect(i * barWidth, sonographEl.height - h, barWidth * 0.8, h);
      }
      requestAnimationFrame(drawSonograph);
    }

    window.toggleOrbitVideo = () => setFace(face === "video" ? "logo" : "video");
    window.toggleOrbitSonograph = () => setFace(face === "sonograph" ? "logo" : "sonograph");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForPlayer, { once: true });
  } else {
    waitForPlayer();
  }
})();
