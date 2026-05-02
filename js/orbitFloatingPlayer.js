// orbitFloatingPlayer.js

function setupFloatingPlayer() {
  console.log("🎧 Creating Floating Player");

  // Remove any existing player
  const existing = document.getElementById("floatingPlayer");
  if (existing) existing.remove();

  // Create container
  const player = document.createElement("div");
  player.id = "floatingPlayer";
  player.innerHTML = "Hi. I'm <div class="flame">HGSpark©</div>";

  // Style it
  Object.assign(player.style, {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    backdropFilter: "blur(8px)",
    background: "radial-gradient(120% 120% at 30% 30%, rgba(31,41,55,0.95), rgba(17,24,39,0.9))",
    boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    padding: "10px",
    cursor: "grab",
    zIndex: 9999,
    userSelect: "none",
    overflow: "visible"
  });

  // Append to panel if it exists, otherwise to body
  const host = document.getElementById("playerHost") || document.body;
  host.appendChild(player);

  console.log("✅ Floating player mounted in:", host.id || "body");
}

// Run after DOM loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupFloatingPlayer);
} else {
  setupFloatingPlayer();
}
  // --- GLOW EFFECT ---
  let glowGrowing = true;
  setInterval(() => {
    floatingPlayer.style.boxShadow = glowGrowing
      ? "0 0 30px rgba(0,255,255,1), 0 0 50px rgba(0,255,255,0.5) inset"
      : "0 0 20px rgba(0,255,255,0.😎, 0 0 40px rgba(0,255,255,0.4) inset";
    glowGrowing = !glowGrowing;
  }, 800); // pulses every 0.8s

  // --- ORBIT EFFECT ---
  const centerX = 300; // adjust to orbit center X
  const centerY = 200; // adjust to orbit center Y
  const radius = 100; // orbit radius
  let orbitAngle = 0;

  setInterval(() => {
    orbitAngle += 0.02; // orbit speed
    const x = centerX + radius * Math.cos(orbitAngle);
    const y = centerY + radius * Math.sin(orbitAngle);
    floatingPlayer.style.left = `${x}px`;
    floatingPlayer.style.top = `${y}px`;
  }, 16); // ~60fps



  // --- Glow ring ---
  const ring = document.createElement("div");
  Object.assign(ring.style, {
    position: "absolute",
    inset: "8px",
    borderRadius: "50%",
    background: "conic-gradient(from 0deg, rgba(59,130,246,0.25), rgba(34,197,94,0.25), rgba(59,130,246,0.25))",
    filter: "blur(8px)",
    opacity: "0.6",
    pointerEvents: "none"
  });
  player.appendChild(ring);

  // --- SVG progress ---
  const svgNS = "http://www.w3.org/2000/svg";
  const size = 170, r = 76, C = 2*Math.PI*r;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  Object.assign(svg.style,{
    position:"absolute",
    top:"10px",
    left:"50%",
    transform:"translateX(-50%)",
    overflow:"visible",
    pointerEvents:"none"
  });
  const circleBg = document.createElementNS(svgNS,"circle");
  circleBg.setAttribute("cx", size/2);
  circleBg.setAttribute("cy", size/2);
  circleBg.setAttribute("r", r);
  circleBg.setAttribute("stroke", "rgba(255,255,255,0.15)");
  circleBg.setAttribute("stroke-width", "6");
  circleBg.setAttribute("fill", "none");
  const circleProgress = document.createElementNS(svgNS,"circle");
  circleProgress.setAttribute("cx", size/2);
  circleProgress.setAttribute("cy", size/2);
  circleProgress.setAttribute("r", r);
  circleProgress.setAttribute("stroke", "url(#fpGrad)");
  circleProgress.setAttribute("stroke-width", "6");
  circleProgress.setAttribute("fill", "none");
  circleProgress.setAttribute("stroke-linecap", "round");
  circleProgress.setAttribute("stroke-dasharray", C.toString());
  circleProgress.setAttribute("stroke-dashoffset", C.toString());
  circleProgress.setAttribute("transform", `rotate(-90 ${size/2} ${size/2})`);
  const defs = document.createElementNS(svgNS,"defs");
  const grad = document.createElementNS(svgNS,"linearGradient");
  grad.setAttribute("id","fpGrad");
  grad.setAttribute("x1","0%");
  grad.setAttribute("y1","0%");
  grad.setAttribute("x2","100%");
  grad.setAttribute("y2","0%");
  const stop1 = document.createElementNS(svgNS,"stop");
  stop1.setAttribute("offset","0%");
  stop1.setAttribute("stop-color","#60a5fa");
  const stop2 = document.createElementNS(svgNS,"stop");
  stop2.setAttribute("offset","100%");
  stop2.setAttribute("stop-color","#34d399");
  grad.appendChild(stop1); grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);
  svg.appendChild(circleBg);
  svg.appendChild(circleProgress);
  player.appendChild(svg);

  // --- Center content ---
  const center = document.createElement("div");
  Object.assign(center.style, {
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    width: "100%",
    height: "100%",
    position: "relative"
  });

  // --- Title ---
  //const titleEl = document.createElement("div");
  Object.assign(titleEl.style,{
    position:"absolute",
    top:"8px",
    left:"50%",
    transform:"translateX(-50%)",
    fontWeight:"600",
    lineHeight:"1.1",
    padding:"0 12px",
    maxWidth:"90%",
    color:"#e5e7eb",
    fontSize:"clamp(14px,2.4vw,16px)",
    textShadow:"0 1px 1px rgba(0,0,0,0.5)",
    pointerEvents:"none",
    textAlign:"center",
    zIndex:100000
  });
  center.appendChild(titleEl);

  // --- Marquee for now playing ---
  const marquee = document.createElement("marquee");
  marquee.setAttribute("behavior","scroll");
  marquee.setAttribute("direction","right");
  Object.assign(marquee.style,{
    position:"absolute",
    bottom:"8px",
    left:"50%",
    width:"90%",
    transform:"translateX(-50%)",
    pointerEvents:"none",
    zIndex:10001
  });
  const fpNowPlaying = document.createElement("p");
  fpNowPlaying.id="fpNowPlaying";
  fpNowPlaying.className="mt-1 text-sm text-blue-600 dark:text-blue-400";
  marquee.appendChild(fpNowPlaying);
  center.appendChild(marquee);

  // --- Audio element ---
  const audio2 = document.createElement("audio");
  audio.setAttribute("preload","metadata");
  audio.style.display="none";
  center.appendChild(audio);

  // --- Button helper ---
  const btn = (label,title,cb)=>{
    const b = document.createElement("button");
    b.textContent=label;
    b.title=title;
    Object.assign(b.style,{
      padding:"6px 10px",
      borderRadius:"9999px",
      border:"1px solid rgba(255,255,255,0.15)",
      background:"rgba(255,255,255,0.08)",
      color:"#fff",
      backdropFilter:"blur(4px)",
      boxShadow:"0 1px 4px rgba(0,0,0,0.25)",
      fontSize:"12px",
      cursor:"pointer",
      pointerEvents:"auto",
      userSelect:"none",
      touchAction:"manipulation",
      zIndex:5
    });
    b.addEventListener("pointerdown",e=>e.stopPropagation());
    b.addEventListener("click",cb);
    b.addEventListener("touchend",e=>{ e.preventDefault(); cb(e); });
    return b;
  };

  // --- State ---
  let autoNext=true, currentLang="eng", autoplay=false, docked=true;
  let playlist=[];

  // ---Psalms Playlist ---
  const psalmsPlaylist = [
  { title: "Psalms- Sunday- Ch 1-29 Day 1", src: "http://audio.esvbible.org/hw/19001001-19029011.mp3" },
  { title: "Psalms- Monday- Ch 30-50 Day 2", src: "http://audio.esvbible.org/hw/19030001-19050023.mp3" },
  { title: "Psalms- Tuesday- Ch 51-72 Day 3", src: "http://audio.esvbible.org/hw/19051001-19072020.mp3" },
  { title: "Psalms- Wednesday- Ch 73-89 Day 4", src: "http://audio.esvbible.org/hw/19063001-19089052.mp3" },
  { title: "Psalms- Thursday- Ch 90-106 Day 5", src: "http://audio.esvbible.org/hw/19090001-19106048.mp3" },
  { title: "Psalms- Friday- Ch 107-119 Day 6", src: "http://audio.esvbible.org/hw/19107001-19119176.mp3" },
  { title: "Psalms- Saturday- Ch 120-150 Day 7", src: "http://audio.esvbible.org/hw/19120001-19150006.mp3" }
  ]
  // --- Buttons ---
  const playPauseBtn = btn("▶","Play / Pause",()=>{
    if(!audio.src){ loadTrack(); return; }
    if(audio.paused){
      audio.play().then(()=>playPauseBtn.textContent="⏸").catch(()=>playPauseBtn.textContent="▶");
    } else {
  audio.pause();
  playPauseBtn.textContent="▶";
}
  });
  audio.addEventListener("play",()=>playPauseBtn.textContent="⏸");
  audio.addEventListener("pause",()=>playPauseBtn.textContent="▶");
  audio.addEventListener("ended",()=>playPauseBtn.textContent="▶");

  const nextBtn  = btn("⏭","Next",()=>{
    currentIndex.issue=(currentIndex.issue+1)%playlist.length;
    loadTrack();
  });

  const langBtn  = btn("🌐","Language",()=>{
    currentLang=currentLang==="eng" ? "heb" :
                currentLang==="heb" ? "grk" : "eng";
    loadTrack();
  });

  const sleepBtn = btn("🌙","Auto-next (sleep) on/off",()=>{
    autoNext=!autoNext;
    sleepBtn.style.opacity=autoNext?"1":"0.55";
    sleepBtn.style.borderColor=autoNext
      ? "rgba(255,255,255,0.15)"
      : "rgba(255,255,255,0.35)";
  });
  sleepBtn.dataset.active="1";

  // --- NEW: Psalms Playlist Button ---
  const psalmsBtn = btn("🎵","Switch to Psalms Playlist",()=>{
    if(typeof psalmsPlaylist!=="undefined" && psalmsPlaylist.length>0){
      playlist = psalmsPlaylist;
      currentIndex.issue = 0;
      loadTrack();
    } else {
      console.warn("⚠ No psalmsPlaylist defined!");
    }
  });

  // --- NEW: Playback Speed Button ---
  const speedBtn = btn("⏩","Toggle Playback Speed",()=>{
    const speeds = [1, 1.25, 1.5, 2];
    let idx = speeds.indexOf(audio.playbackRate);
    audio.playbackRate = speeds[(idx+1)%speeds.length];
    speedBtn.textContent = audio.playbackRate+"x";
  });

    const videoBtn = btn("🎬", "Open Video (popup)", () => { toggleOrbitVideo(); })
    const shareBtn = btn("🔗","Share Track",()=>{ console.log("TODO: share logic"); });
    const favBtn   = btn("⭐","Favorite",()=>{ console.log("TODO: favorites logic"); 

  });


