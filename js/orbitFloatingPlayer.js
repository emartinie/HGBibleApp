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
    mode: "audio",
    speechRate: 1,
    speechPaused: false,
    speechToken: 0,
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
    loadPlaylist,
    loadTextPlaylist
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
    return state.mode === "speech" ? (item.ref || window.location.href) : (item[state.lang] || item.src || item.eng || item.heb || item.grk || "");
  }

  function isPaused() {
    return state.mode === "speech" ? state.speechPaused || !window.speechSynthesis?.speaking : state.audio.paused;
  }

  function stopSpeech(resetIndex = false) {
    state.speechToken += 1;
    window.speechSynthesis?.cancel();
    state.speechPaused = false;
    if (resetIndex) state.index = 0;
  }

  function loadTextPlaylist(list, options = {}) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      window.alert("Device-generated narration is not supported by this browser.");
      return false;
    }
    const next = (Array.isArray(list) ? list : []).map(item => ({
      title: item.title || item.label || "Untitled",
      text: String(item.text || "").trim(),
      ref: item.ref || window.location.href
    })).filter(item => item.text);
    if (!next.length) return false;
    state.audio.pause();
    stopSpeech();
    state.mode = "speech";
    state.playlist = next;
    state.index = Math.min(Math.max(Number(options.index) || 0, 0), next.length - 1);
    updateProgress(state.index / next.length);
    updateNowPlaying({ action: "loaded" });
    if (options.autoplay === true) playCurrent();
    return true;
  }

  function updateNowPlaying(extra = {}) {
    const item = currentItem();
    const title = item?.title || "Orbit ready";
    const src = currentSrc();
    const suffix = state.mode === "speech" ? "Device narration" : state.lang.toUpperCase();
    state.els.title.textContent = item ? `${title} (${suffix})` : "Orbit";
    state.els.nowPlaying.textContent = item ? `${title} (${suffix})` : "Load a playlist";
    state.els.playPause.textContent = isPaused() ? "Play" : "Pause";
    state.els.sleep.style.opacity = state.autoNext ? "1" : "0.55";
    state.els.lang.textContent = state.mode === "speech" ? "Voice" : state.lang.toUpperCase();
    state.els.minimize.textContent = state.minimized ? "Show" : "Hide";
    state.els.dock.textContent = state.docked ? "Float" : "Dock";
    if ("mediaSession" in navigator) {
      const item = currentItem();
      navigator.mediaSession.metadata = item ? new MediaMetadata({ title: item.title, artist: "HG Bible App", album: state.mode === "speech" ? "Device narration" : "HomeGroups" }) : null;
      navigator.mediaSession.playbackState = isPaused() ? "paused" : "playing";
    }

    window.dispatchEvent(new CustomEvent("player:nowPlaying", {
      detail: {
        title: item?.title || "",
        lang: state.lang,
        src,
        index: state.index,
        paused: isPaused(),
        mode: state.mode,
        ...extra
      }
    }));
  }

  function loadPlaylist(list, options = {}) {
    stopSpeech();
    state.mode = "audio";
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
    if (state.mode === "speech") return playSpeech();
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
    if (state.mode === "speech") {
      window.speechSynthesis?.pause();
      state.speechPaused = true;
      updateNowPlaying({ action: "pause" });
      return;
    }
    state.audio.pause();
    updateNowPlaying({ action: "pause" });
  }

  function stopCurrent() {
    if (state.mode === "speech") {
      stopSpeech();
      updateProgress(state.playlist.length ? state.index / state.playlist.length : 0);
      updateNowPlaying({ action: "stop" });
      return;
    }
    state.audio.pause();
    state.audio.currentTime = 0;
    updateProgress(0);
    updateNowPlaying({ action: "stop" });
  }

  function nextTrack(autoplay = !isPaused()) {
    if (!state.playlist.length) return;
    if (state.mode === "speech") stopSpeech();
    state.index = (state.index + 1) % state.playlist.length;
    if (state.mode === "speech") {
      updateProgress(state.index / state.playlist.length);
      updateNowPlaying();
      if (autoplay) playSpeech();
    } else loadTrack({ autoplay });
  }

  function previousTrack() {
    if (!state.playlist.length) return;
    const autoplay = !isPaused();
    if (state.mode === "speech") stopSpeech();
    state.index = (state.index - 1 + state.playlist.length) % state.playlist.length;
    if (state.mode === "speech") {
      updateProgress(state.index / state.playlist.length);
      updateNowPlaying();
      if (autoplay) playSpeech();
    } else loadTrack({ autoplay });
  }

  function playSpeech() {
    const synth = window.speechSynthesis;
    const item = currentItem();
    if (!synth || !item?.text) return Promise.resolve(false);
    if (state.speechPaused && synth.paused) {
      state.speechPaused = false;
      synth.resume();
      updateNowPlaying({ action: "play" });
      return Promise.resolve(true);
    }
    stopSpeech();
    const token = state.speechToken;
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = state.speechRate;
    utterance.onstart = () => updateNowPlaying({ action: "play" });
    utterance.onend = () => {
      if (token !== state.speechToken) return;
      updateProgress((state.index + 1) / state.playlist.length);
      if (state.autoNext && state.index < state.playlist.length - 1) nextTrack(true);
      else updateNowPlaying({ action: "ended" });
    };
    utterance.onerror = event => {
      if (event.error !== "canceled" && event.error !== "interrupted") console.warn("Orbit narration error:", event.error);
      updateNowPlaying({ action: "error" });
    };
    synth.speak(utterance);
    return Promise.resolve(true);
  }

  function cycleLang() {
    if (state.mode === "speech") return;
    const idx = LANGS.indexOf(state.lang);
    state.lang = LANGS[(idx + 1) % LANGS.length];
    loadTrack({ autoplay: !state.audio.paused });
  }

  function seekBy(seconds) {
    if (state.mode !== "audio" || !Number.isFinite(state.audio.duration)) return;
    state.audio.currentTime = Math.max(0, Math.min(state.audio.duration, state.audio.currentTime + seconds));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  function persistPlayback() {
    if (state.mode !== "audio" || !currentItem()) return;
    try { localStorage.setItem("hg-orbit-playback", JSON.stringify({ src: currentSrc(), time: state.audio.currentTime, rate: state.audio.playbackRate, volume: state.audio.volume })); } catch {}
  }

  function cycleSpeed() {
    const speeds = [1, 1.25, 1.5, 2];
    const activeRate = state.mode === "speech" ? state.speechRate : state.audio.playbackRate;
    const current = speeds.indexOf(activeRate);
    const next = speeds[(current + 1) % speeds.length];
    if (state.mode === "speech") {
      const wasPlaying = !isPaused();
      state.speechRate = next;
      if (wasPlaying) playSpeech();
    } else state.audio.playbackRate = next;
    state.els.speed.textContent = `${next}x`;
  }

  function updateProgress(ratio) {
    const circle = state.els.progress;
    if (!circle) return;
    const circumference = Number(circle.dataset.circumference || 0);
    circle.setAttribute("stroke-dashoffset", String(circumference * (1 - Math.max(0, Math.min(1, ratio)))));
    if (state.els.seek && state.mode === "audio") state.els.seek.value = String(Math.round(Math.max(0, Math.min(1, ratio)) * 1000));
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
    const pulse = isPaused() ? 0.18 : 0.65;
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
    Object.assign(player.style, {position:"fixed",bottom:"1rem",right:"1rem",width:"190px",height:"190px",borderRadius:"50%",backdropFilter:"blur(12px)",background:"radial-gradient(circle at 30% 30%,rgba(31,41,55,.97),rgba(7,10,17,.95))",boxShadow:"0 12px 28px rgba(0,0,0,.48),inset 0 0 0 1px rgba(255,255,255,.1)",color:"#fff",cursor:"grab",overflow:"visible",padding:"10px",userSelect:"none",zIndex:9999});
    const style=document.createElement("style");
    style.id="orbit-player-styles";
    style.textContent=[
      "#floatingPlayer .hidden{display:none!important}",
      "#floatingPlayer .orbit-primary{position:absolute;inset:0;pointer-events:none;z-index:7}",
      "#floatingPlayer .orbit-drawer[hidden]{display:none!important}",
      "#floatingPlayer .orbit-drawer{position:absolute;right:0;bottom:calc(100% + 10px);width:min(324px,calc(100vw - 24px));display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:12px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:rgba(7,10,17,.98);box-shadow:0 18px 42px rgba(0,0,0,.55);z-index:20}",
      "#floatingPlayer .orbit-drawer .orbit-control{position:static!important;transform:none!important;width:100%;min-width:0!important}",
      "#floatingPlayer .orbit-volume-row,#floatingPlayer .orbit-seek-row{grid-column:1/-1;display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;color:#cbd5e1;font-size:11px}",
      "#floatingPlayer input[type=range]{width:100%;accent-color:#38bdf8}",
      "#floatingPlayer .orbit-time{position:absolute;left:50%;bottom:31px;transform:translateX(-50%);color:#dbeafe;font-size:10px;white-space:nowrap;z-index:6;pointer-events:none}",
      "#floatingPlayer.is-docked .orbit-primary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;inset:36px 10px auto;height:auto}",
      "#floatingPlayer.is-docked .orbit-primary .orbit-control{position:static!important;transform:none!important;width:100%;min-width:0!important}",
      "#floatingPlayer.is-docked .orbit-time{bottom:10px}",
      "@media(max-width:540px){#floatingPlayer:not(.is-docked){width:164px!important;height:164px!important}#floatingPlayer .orbit-drawer{position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom) + 12px);width:auto}}"
    ].join("");
    document.getElementById(style.id)?.remove(); document.head.appendChild(style);
    const ring=document.createElement("div");
    Object.assign(ring.style,{position:"absolute",inset:"8px",borderRadius:"inherit",background:"conic-gradient(rgba(59,130,246,.25),rgba(243,200,120,.24),rgba(59,130,246,.25))",filter:"blur(8px)",opacity:".68",pointerEvents:"none"});
    const faceWrap=document.createElement("div");
    Object.assign(faceWrap.style,{position:"absolute",inset:"28px",borderRadius:"50%",overflow:"hidden",pointerEvents:"none"});
    const logo=document.createElement("img"); logo.id="orbitLogo";logo.src="images/HGHouses.png";logo.alt="";Object.assign(logo.style,{width:"100%",height:"100%",objectFit:"contain"});
    const video=document.createElement("video");video.id="orbitVideo";video.src=DEFAULT_VIDEO_SRC;video.muted=true;video.loop=true;video.playsInline=true;video.preload="metadata";video.className="hidden";Object.assign(video.style,{width:"100%",height:"100%",objectFit:"cover"});
    const sonograph=document.createElement("canvas");sonograph.id="orbitSonograph";sonograph.width=180;sonograph.height=180;sonograph.className="hidden";Object.assign(sonograph.style,{width:"100%",height:"100%"});
    faceWrap.append(logo,video,sonograph);
    const title=document.createElement("div");Object.assign(title.style,{position:"absolute",top:"11px",left:"50%",transform:"translateX(-50%)",width:"58%",overflow:"hidden",textAlign:"center",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:"12px",fontWeight:"700",zIndex:"5"});
    const nowPlaying=document.createElement("div");nowPlaying.id="fpNowPlaying";Object.assign(nowPlaying.style,{position:"absolute",bottom:"15px",left:"50%",transform:"translateX(-50%)",width:"58%",overflow:"hidden",textAlign:"center",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#bfdbfe",fontSize:"10px",zIndex:"5"});
    const timeDisplay=document.createElement("div");timeDisplay.id="orbitTime";timeDisplay.className="orbit-time";timeDisplay.textContent="0:00 / 0:00";
    const ns="http://www.w3.org/2000/svg",size=170,radius=76,circumference=2*Math.PI*radius;
    const svg=document.createElementNS(ns,"svg");svg.setAttribute("width",size);svg.setAttribute("height",size);Object.assign(svg.style,{position:"absolute",top:"10px",left:"50%",transform:"translateX(-50%)",overflow:"visible",pointerEvents:"none"});
    const progress=document.createElementNS(ns,"circle");
    [["cx",85],["cy",85],["r",radius],["stroke","#38bdf8"],["stroke-width",5],["fill","none"],["stroke-linecap","round"],["stroke-dasharray",circumference],["stroke-dashoffset",circumference],["transform","rotate(-90 85 85)"]].forEach(([k,v])=>progress.setAttribute(k,String(v)));
    progress.dataset.circumference=String(circumference);svg.appendChild(progress);
    const primary=document.createElement("div");primary.className="orbit-primary";
    const drawer=document.createElement("div");drawer.className="orbit-drawer";drawer.hidden=true;
    const add=(host,key,label,titleText,handler,position)=>{
      const button=createButton(label,titleText,handler);if(position)Object.assign(button.style,position);host.appendChild(button);state.els[key]=button;return button;
    };
    const pos=(left,top)=>({left,top,transform:"translate(-50%,-50%)"});
    add(primary,"previous","‹","Previous",previousTrack,pos("13%","50%"));
    add(primary,"playPause","Play","Play or pause",()=>isPaused()?playCurrent():pauseCurrent(),pos("50%","82%"));
    add(primary,"next","›","Next",()=>nextTrack(),pos("87%","50%"));
    let settings;
    settings=add(primary,"settings","•••","More player controls",()=>{drawer.hidden=!drawer.hidden;settings.setAttribute("aria-expanded",String(!drawer.hidden));},pos("82%","18%"));
    settings.setAttribute("aria-expanded","false");
    add(primary,"minimize","Hide","Hide player face",()=>setMinimized(!state.minimized),pos("18%","18%"));
    [["rewind","−15s","Rewind 15 seconds",()=>seekBy(-15)],["forward","+15s","Forward 15 seconds",()=>seekBy(15)],["stop","Stop","Stop",stopCurrent],["speed","1x","Playback speed",cycleSpeed],["lang","ENG","Audio language",cycleLang],["sleep","Auto","Automatic next track",()=>{state.autoNext=!state.autoNext;updateNowPlaying();}],["playlist","Psalms","Load Psalms",()=>loadPlaylist(DEFAULT_PLAYLIST,{autoplay:true})],["dock","Dock","Dock or float",()=>setDocked(!state.docked)],["video","Video","Video face",toggleVideo],["sonograph","Wave","Waveform",toggleSonograph],["share","Share","Share",shareCurrent],["favorite","Fav","Favorite",favoriteCurrent]].forEach(args=>add(drawer,...args));
    const seekRow=document.createElement("label");seekRow.className="orbit-seek-row";seekRow.textContent="Position";
    const seek=document.createElement("input");seek.type="range";seek.min="0";seek.max="1000";seek.value="0";seek.setAttribute("aria-label","Seek through track");
    on(seek,"input",()=>{if(state.mode==="audio"&&Number.isFinite(state.audio.duration))state.audio.currentTime=state.audio.duration*Number(seek.value)/1000;});seekRow.appendChild(seek);drawer.prepend(seekRow);
    const volumeRow=document.createElement("label");volumeRow.className="orbit-volume-row";volumeRow.textContent="Volume";
    const volume=document.createElement("input");volume.type="range";volume.min="0";volume.max="1";volume.step=".05";volume.value=String(state.audio.volume);
    let mute;on(volume,"input",()=>{state.audio.muted=false;state.audio.volume=Number(volume.value);mute.textContent=state.audio.volume?"Mute":"Unmute";persistPlayback();});volumeRow.appendChild(volume);drawer.appendChild(volumeRow);
    mute=add(drawer,"mute","Mute","Mute or unmute",()=>{state.audio.muted=!state.audio.muted;mute.textContent=state.audio.muted?"Unmute":"Mute";});
    player.append(ring,faceWrap,svg,title,nowPlaying,timeDisplay,primary,drawer);
    state.player=player;state.els={...state.els,faceWrap,logo,video,sonograph,title,nowPlaying,timeDisplay,progress,drawer,seek,volume,mute};
    document.body.appendChild(player);enableDragging();
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
      if (Number.isFinite(state.audio.duration) && state.audio.duration > 0) updateProgress(state.audio.currentTime / state.audio.duration);
      if (state.els.timeDisplay) state.els.timeDisplay.textContent = `${formatTime(state.audio.currentTime)} / ${formatTime(state.audio.duration)}`;
      if (Math.floor(state.audio.currentTime) % 5 === 0) persistPlayback();
      if ("mediaSession" in navigator && Number.isFinite(state.audio.duration) && state.audio.duration > 0) {
        try { navigator.mediaSession.setPositionState({ duration: state.audio.duration, playbackRate: state.audio.playbackRate, position: Math.min(state.audio.currentTime, state.audio.duration) }); } catch {}
      }
    });
    on(state.audio, "loadedmetadata", () => {
      updateProgress(0);
      try {
        const saved = JSON.parse(localStorage.getItem("hg-orbit-playback") || "null");
        if (saved?.src === currentSrc()) {
          state.audio.currentTime = Math.min(Number(saved.time) || 0, state.audio.duration || 0);
          state.audio.playbackRate = Number(saved.rate) || 1;
          state.audio.volume = Math.max(0, Math.min(1, Number(saved.volume ?? 1)));
          state.els.speed.textContent = `${state.audio.playbackRate}x`;
        }
      } catch {}
    });
    on(state.audio, "waiting", () => { state.els.nowPlaying.textContent = "Loading audio…"; });
    on(state.audio, "error", () => { state.els.nowPlaying.textContent = "Audio unavailable"; });
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

    if ("mediaSession" in navigator) {
      const handlers = { play: playCurrent, pause: pauseCurrent, previoustrack: previousTrack, nexttrack: () => nextTrack(), seekbackward: detail => seekBy(detail.seekOffset || 15), seekforward: detail => seekBy(detail.seekOffset || 15), seekto: detail => { if (state.mode === "audio" && Number.isFinite(detail.seekTime)) state.audio.currentTime = detail.seekTime; } };
      Object.entries(handlers).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch {} });
    }

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
    stopSpeech();
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
