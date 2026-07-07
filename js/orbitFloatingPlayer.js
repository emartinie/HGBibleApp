// orbitFloatingPlayer.js
(function () {
  "use strict";

  const ORBIT_ID = "floatingPlayer";
  const DOCK_ID = "floating-player-root";
  const LANGS = ["eng", "heb", "grk"];
  const DEFAULT_VIDEO_SRC = "videos/bg-motion.mp4";
  const DEFAULT_PLAYLIST = [
    { title: "Psalms - Sunday - Ch 1-29", src: "https://audio.esvbible.org/hw/19001001-19029011.mp3" },
    { title: "Psalms - Monday - Ch 30-50", src: "https://audio.esvbible.org/hw/19030001-19050023.mp3" },
    { title: "Psalms - Tuesday - Ch 51-72", src: "https://audio.esvbible.org/hw/19051001-19072020.mp3" },
    { title: "Psalms - Wednesday - Ch 73-89", src: "https://audio.esvbible.org/hw/19073001-19089052.mp3" },
    { title: "Psalms - Thursday - Ch 90-106", src: "https://audio.esvbible.org/hw/19090001-19106048.mp3" },
    { title: "Psalms - Friday - Ch 107-119", src: "https://audio.esvbible.org/hw/19107001-19119176.mp3" },
    { title: "Psalms - Saturday - Ch 120-150", src: "https://audio.esvbible.org/hw/19120001-19150006.mp3" }
  ];

  if (window.__orbitPlayer?.initialized) {
    window.__orbitPlayer.mount?.();
    return;
  }

  const state = {
    initialized: true,
    player: null,
    audio: window.globalAudio || new Audio(),
    playlist: [],
    index: 0,
    lang: "eng",
    autoNext: true,
    docked: false,
    minimized: false,
    face: "logo",
    els: {},
    cleanup: [],
    mount: setupFloatingPlayer,
    destroy: destroyFloatingPlayer,
    play: playCurrent,
    pause: pauseCurrent,
    stop: stopCurrent,
    next: nextTrack,
    previous: previousTrack,
    toggleVideo,
    toggleSonograph,
    setDocked,
    setMinimized,
    loadPlaylist
  };

  window.globalAudio = state.audio;
  window.__orbitPlayer = state;

  function on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    state.cleanup.push(() => target.removeEventListener(type, handler, options));
  }

  function createButton(label, title, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.className = "orbit-control";
    Object.assign(button.style, {
      position: "absolute",
      padding: "6px 9px",
      minWidth: "34px",
      minHeight: "30px",
      borderRadius: "9999px",
      border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(15,23,42,0.78)",
      color: "#fff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
      fontSize: "12px",
      cursor: "pointer",
      pointerEvents: "auto",
      userSelect: "none",
      touchAction: "manipulation",
      zIndex: 5
    });
    on(button, "pointerdown", event => event.stopPropagation());
    on(button, "click", event => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
    return button;
  }

  function normalizePlaylist(list) {
    return (Array.isArray(list) ? list : [])
      .map(item => {
        const title = item.label || item.title || item.name || "Untitled";
        const src = cleanSrc(item.src || item.eng || item.heb || item.grk || "");
        return {
          title,
          eng: cleanSrc(item.eng || src),
          heb: cleanSrc(item.heb || src),
          grk: cleanSrc(item.grk || src),
          src
        };
      })
      .filter(item => item.eng || item.heb || item.grk || item.src);
  }

  function cleanSrc(src) {
    return String(src || "").trim().replace(/^http:\/\//i, "https://");
  }

  function currentItem() {
    return state.playlist[state.index] || null;
  }

  function currentSrc() {
    const item = currentItem();
    if (!item) return "";
    return item[state.lang] || item.src || item.eng || item.heb || item.grk || "";
  }

  function updateNowPlaying(extra = {}) {
    const item = currentItem();
    const title = item?.title || "Orbit ready";
    const src = currentSrc();
    state.els.title.textContent = item ? `${title} (${state.lang.toUpperCase()})` : "Orbit";
    state.els.nowPlaying.textContent = item ? `${title} (${state.lang.toUpperCase()})` : "Load a playlist";
    state.els.playPause.textContent = state.audio.paused ? "Play" : "Pause";
    state.els.sleep.style.opacity = state.autoNext ? "1" : "0.55";
    state.els.lang.textContent = state.lang.toUpperCase();
    state.els.minimize.textContent = state.minimized ? "Show" : "Hide";
    state.els.dock.textContent = state.docked ? "Float" : "Dock";

    window.dispatchEvent(new CustomEvent("player:nowPlaying", {
      detail: {
        title: item?.title || "",
        lang: state.lang,
        src,
        index: state.index,
        paused: state.audio.paused,
        ...extra
      }
    }));
  }

  function loadPlaylist(list, options = {}) {
    const next = normalizePlaylist(list);
    state.playlist = next;
    state.index = Math.min(Math.max(Number(options.index) || 0, 0), Math.max(next.length - 1, 0));

    if (!next.length) {
      state.audio.removeAttribute("src");
      state.audio.load();
      updateProgress(0);
      updateNowPlaying();
      return;
    }

    loadTrack({ autoplay: options.autoplay === true });
  }

  function loadTrack(options = {}) {
    const src = currentSrc();
    if (!src) {
      updateNowPlaying();
      return Promise.resolve(false);
    }

    if (state.audio.src !== new URL(src, window.location.href).href) {
      state.audio.src = src;
      state.audio.load();
    }

    updateProgress(0);
    updateNowPlaying();

    if (options.autoplay) {
      return playCurrent();
    }

    return Promise.resolve(true);
  }

  function playCurrent() {
    if (!state.playlist.length) {
      loadPlaylist(DEFAULT_PLAYLIST, { autoplay: true });
      return Promise.resolve(false);
    }

    if (!state.audio.src) {
      return loadTrack({ autoplay: true });
    }

    return state.audio.play()
      .then(() => {
        updateNowPlaying({ action: "play" });
        return true;
      })
      .catch(error => {
        console.warn("Orbit playback blocked:", error);
        updateNowPlaying({ action: "blocked" });
        return false;
      });
  }

  function pauseCurrent() {
    state.audio.pause();
    updateNowPlaying({ action: "pause" });
  }

  function stopCurrent() {
    state.audio.pause();
    state.audio.currentTime = 0;
    updateProgress(0);
    updateNowPlaying({ action: "stop" });
  }

  function nextTrack(autoplay = !state.audio.paused) {
    if (!state.playlist.length) return;
    state.index = (state.index + 1) % state.playlist.length;
    loadTrack({ autoplay });
  }

  function previousTrack() {
    if (!state.playlist.length) return;
    state.index = (state.index - 1 + state.playlist.length) % state.playlist.length;
    loadTrack({ autoplay: !state.audio.paused });
  }

  function cycleLang() {
    const idx = LANGS.indexOf(state.lang);
    state.lang = LANGS[(idx + 1) % LANGS.length];
    loadTrack({ autoplay: !state.audio.paused });
  }

  function cycleSpeed() {
    const speeds = [1, 1.25, 1.5, 2];
    const current = speeds.indexOf(state.audio.playbackRate);
    state.audio.playbackRate = speeds[(current + 1) % speeds.length];
    state.els.speed.textContent = `${state.audio.playbackRate}x`;
  }

  function updateProgress(ratio) {
    const circle = state.els.progress;
    if (!circle) return;
    const circumference = Number(circle.dataset.circumference || 0);
    circle.setAttribute("stroke-dashoffset", String(circumference * (1 - Math.max(0, Math.min(1, ratio)))));
  }

  function setDocked(nextDocked) {
    const dock = document.getElementById(DOCK_ID);
    state.docked = Boolean(nextDocked && dock);

    if (state.docked) {
      dock.appendChild(state.player);
      Object.assign(state.player.style, {
        position: "relative",
        bottom: "auto",
        right: "auto",
        left: "auto",
        top: "auto",
        width: "100%",
        maxWidth: "520px",
        height: "132px",
        borderRadius: "16px",
        padding: "8px 12px"
      });
      state.player.classList.add("is-docked");
    } else {
      document.body.appendChild(state.player);
      Object.assign(state.player.style, {
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        left: "auto",
        top: "auto",
        width: "190px",
        maxWidth: "none",
        height: "190px",
        borderRadius: "50%",
        padding: "10px"
      });
      state.player.classList.remove("is-docked");
    }

    updateNowPlaying();
  }

  function setMinimized(nextMinimized) {
    state.minimized = Boolean(nextMinimized);
    state.els.faceWrap.style.display = state.minimized ? "none" : "block";
    state.els.title.style.display = state.minimized ? "none" : "block";
    state.els.nowPlaying.style.display = state.minimized ? "none" : "block";
    updateNowPlaying();
  }

  function setFace(face) {
    state.face = face;
    const { logo, video, sonograph } = state.els;
    logo.classList.toggle("hidden", face !== "logo");
    video.classList.toggle("hidden", face !== "video");
    sonograph.classList.toggle("hidden", face !== "sonograph");

    if (face === "video") {
      video.play().catch(() => {});
    } else {
      video.pause();
    }

    if (face === "sonograph") drawSonograph();
  }

  function toggleVideo() {
    setFace(state.face === "video" ? "logo" : "video");
  }

  function toggleSonograph() {
    setFace(state.face === "sonograph" ? "logo" : "sonograph");
  }

  function drawSonograph() {
    const canvas = state.els.sonograph;
    if (!canvas || state.face !== "sonograph") return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bars = 28;
    const barWidth = canvas.width / bars;
    const pulse = state.audio.paused ? 0.18 : 0.65;
    for (let i = 0; i < bars; i += 1) {
      const h = (Math.random() * canvas.height * pulse) + 8;
      ctx.fillStyle = "rgba(0, 200, 255, 0.72)";
      ctx.fillRect(i * barWidth, canvas.height - h, barWidth * 0.72, h);
    }
    requestAnimationFrame(drawSonograph);
  }

  function favoriteCurrent() {
    const src = currentSrc();
    if (!src) return;
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    if (!favs.includes(src)) {
      favs.push(src);
      localStorage.setItem("favorites", JSON.stringify(favs));
    }
    state.els.favorite.textContent = "Saved";
  }

  function shareCurrent() {
    const src = currentSrc() || window.location.href;
    if (navigator.share) {
      navigator.share({ title: currentItem()?.title || document.title, url: src }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(src).catch(() => {});
  }

  function buildPlayer() {
    const existing = document.getElementById(ORBIT_ID);
    if (existing) existing.remove();

    const player = document.createElement("div");
    player.id = ORBIT_ID;
    player.setAttribute("role", "region");
    player.setAttribute("aria-label", "Orbit media player");
    Object.assign(player.style, {
      position: "fixed",
      bottom: "1rem",
      right: "1rem",
      width: "190px",
      height: "190px",
      borderRadius: "50%",
      backdropFilter: "blur(8px)",
      background: "radial-gradient(120% 120% at 30% 30%, rgba(31,41,55,0.95), rgba(17,24,39,0.92))",
      boxShadow: "0 12px 28px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
      color: "#fff",
      cursor: "grab",
      overflow: "visible",
      padding: "10px",
      userSelect: "none",
      zIndex: 9999
    });

    const style = document.createElement("style");
    style.id = "orbit-player-styles";
    style.textContent = `
      #floatingPlayer .hidden { display: none !important; }
      #floatingPlayer.is-docked .orbit-control { transform: none !important; }
      #floatingPlayer.is-docked .orbit-controls {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        align-items: center;
        gap: 6px;
        position: absolute;
        inset: 30px 8px 24px;
        width: auto;
        height: auto;
      }
      #floatingPlayer.is-docked .orbit-control {
        position: static !important;
        min-width: 0 !important;
        width: 100%;
        padding: 5px 3px !important;
        font-size: 11px !important;
      }
    `;
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    const ring = document.createElement("div");
    Object.assign(ring.style, {
      position: "absolute",
      inset: "8px",
      borderRadius: "inherit",
      background: "conic-gradient(from 0deg, rgba(59,130,246,0.22), rgba(34,197,94,0.22), rgba(59,130,246,0.22))",
      filter: "blur(8px)",
      opacity: "0.65",
      pointerEvents: "none"
    });

    const faceWrap = document.createElement("div");
    Object.assign(faceWrap.style, {
      position: "absolute",
      inset: "18px",
      borderRadius: "50%",
      overflow: "hidden",
      pointerEvents: "none"
    });

    const logo = document.createElement("img");
    logo.id = "orbitLogo";
    logo.src = "images/HGHouses.png";
    logo.alt = "";
    Object.assign(logo.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain"
    });

    const video = document.createElement("video");
    video.id = "orbitVideo";
    video.src = DEFAULT_VIDEO_SRC;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.className = "hidden";
    Object.assign(video.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    });

    const sonograph = document.createElement("canvas");
    sonograph.id = "orbitSonograph";
    sonograph.width = 180;
    sonograph.height = 180;
    sonograph.className = "hidden";
    Object.assign(sonograph.style, {
      width: "100%",
      height: "100%"
    });

    const title = document.createElement("div");
    Object.assign(title.style, {
      position: "absolute",
      top: "10px",
      left: "50%",
      transform: "translateX(-50%)",
      maxWidth: "78%",
      overflow: "hidden",
      textAlign: "center",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: "13px",
      fontWeight: "700",
      textShadow: "0 1px 1px rgba(0,0,0,0.55)",
      zIndex: 3
    });

    const nowPlaying = document.createElement("div");
    nowPlaying.id = "fpNowPlaying";
    Object.assign(nowPlaying.style, {
      position: "absolute",
      bottom: "12px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "78%",
      overflow: "hidden",
      textAlign: "center",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "#bfdbfe",
      fontSize: "12px",
      zIndex: 3
    });

    const svgNS = "http://www.w3.org/2000/svg";
    const size = 170;
    const radius = 76;
    const circumference = 2 * Math.PI * radius;
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    Object.assign(svg.style, {
      position: "absolute",
      top: "10px",
      left: "50%",
      transform: "translateX(-50%)",
      overflow: "visible",
      pointerEvents: "none"
    });
    const progress = document.createElementNS(svgNS, "circle");
    progress.setAttribute("cx", size / 2);
    progress.setAttribute("cy", size / 2);
    progress.setAttribute("r", radius);
    progress.setAttribute("stroke", "#38bdf8");
    progress.setAttribute("stroke-width", "5");
    progress.setAttribute("fill", "none");
    progress.setAttribute("stroke-linecap", "round");
    progress.setAttribute("stroke-dasharray", String(circumference));
    progress.setAttribute("stroke-dashoffset", String(circumference));
    progress.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
    progress.dataset.circumference = String(circumference);
    svg.appendChild(progress);

    const controls = document.createElement("div");
    controls.className = "orbit-controls";
    Object.assign(controls.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      zIndex: 4
    });

    const buttons = [
      ["previous", "Prev", previousTrack],
      ["playPause", "Play", () => state.audio.paused ? playCurrent() : pauseCurrent()],
      ["stop", "Stop", stopCurrent],
      ["next", "Next", () => nextTrack()],
      ["lang", "ENG", cycleLang],
      ["sleep", "Auto", () => { state.autoNext = !state.autoNext; updateNowPlaying(); }],
      ["playlist", "Psalms", () => loadPlaylist(DEFAULT_PLAYLIST, { autoplay: true })],
      ["speed", "1x", cycleSpeed],
      ["video", "Video", toggleVideo],
      ["sonograph", "Wave", toggleSonograph],
      ["dock", "Dock", () => setDocked(!state.docked)],
      ["minimize", "Hide", () => setMinimized(!state.minimized)],
      ["share", "Share", shareCurrent],
      ["favorite", "Fav", favoriteCurrent]
    ];

    buttons.forEach(([key, label, handler], index) => {
      const button = createButton(label, label, handler);
      const angle = (index / buttons.length) * 2 * Math.PI;
      const orbitRadius = 43;
      Object.assign(button.style, {
        left: `${50 + orbitRadius * Math.cos(angle)}%`,
        top: `${50 + orbitRadius * Math.sin(angle)}%`,
        transform: "translate(-50%, -50%)"
      });
      controls.appendChild(button);
      state.els[key] = button;
    });

    faceWrap.appendChild(logo);
    faceWrap.appendChild(video);
    faceWrap.appendChild(sonograph);
    player.appendChild(ring);
    player.appendChild(faceWrap);
    player.appendChild(svg);
    player.appendChild(title);
    player.appendChild(nowPlaying);
    player.appendChild(controls);

    state.player = player;
    state.els = {
      ...state.els,
      faceWrap,
      logo,
      video,
      sonograph,
      title,
      nowPlaying,
      progress
    };

    document.body.appendChild(player);
    enableDragging();
  }

  function enableDragging() {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;

    on(state.player, "pointerdown", event => {
      if (state.docked || event.target.closest("button")) return;
      dragging = true;
      const rect = state.player.getBoundingClientRect();
      originX = rect.left;
      originY = rect.top;
      startX = event.clientX;
      startY = event.clientY;
      state.player.setPointerCapture?.(event.pointerId);
      state.player.style.cursor = "grabbing";
    });

    on(window, "pointermove", event => {
      if (!dragging) return;
      state.player.style.left = `${originX + event.clientX - startX}px`;
      state.player.style.top = `${originY + event.clientY - startY}px`;
      state.player.style.right = "auto";
      state.player.style.bottom = "auto";
    });

    on(window, "pointerup", () => {
      if (!dragging) return;
      dragging = false;
      state.player.style.cursor = "grab";
      snapToEdge();
    });
  }

  function snapToEdge() {
    const rect = state.player.getBoundingClientRect();
    const margin = 12;
    if (rect.left < window.innerWidth - rect.right) {
      state.player.style.left = `${margin}px`;
      state.player.style.right = "auto";
    } else {
      state.player.style.left = "auto";
      state.player.style.right = `${margin}px`;
    }
  }

  function setupFloatingPlayer() {
    if (state.player?.isConnected) return;
    buildPlayer();

    on(state.audio, "play", () => updateNowPlaying({ action: "play" }));
    on(state.audio, "pause", () => updateNowPlaying({ action: "pause" }));
    on(state.audio, "timeupdate", () => {
      if (Number.isFinite(state.audio.duration) && state.audio.duration > 0) {
        updateProgress(state.audio.currentTime / state.audio.duration);
      }
    });
    on(state.audio, "loadedmetadata", () => updateProgress(0));
    on(state.audio, "ended", () => {
      updateNowPlaying({ action: "ended" });
      if (state.autoNext && state.playlist.length > 1) nextTrack(true);
    });

    on(window, "player:updatePlaylist", event => {
      loadPlaylist(event.detail?.playlist || [], { autoplay: event.detail?.autoplay === true });
    });
    on(window, "player:setLang", event => {
      const lang = String(event.detail?.lang || "").toLowerCase();
      if (LANGS.includes(lang)) {
        state.lang = lang;
        loadTrack({ autoplay: !state.audio.paused });
      }
    });

    window.toggleOrbitVideo = toggleVideo;
    window.toggleOrbitSonograph = toggleSonograph;

    const initialPlaylist =
      window.weekData?.sections?.audio_playlist ||
      window.currentWeekData?.sections?.audio_playlist ||
      window.mainPlaylist ||
      [];
    loadPlaylist(initialPlaylist.length ? initialPlaylist : DEFAULT_PLAYLIST, { autoplay: false });
    setDocked(true);
    updateNowPlaying();
  }

  function destroyFloatingPlayer() {
    state.cleanup.splice(0).forEach(cleanup => cleanup());
    state.player?.remove();
    state.player = null;
    window.__orbitPlayer = null;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupFloatingPlayer, { once: true });
  } else {
    setupFloatingPlayer();
  }
})();
