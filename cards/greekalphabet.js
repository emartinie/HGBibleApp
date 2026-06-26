(function () {
  const GREEK_ALPHABET = [
    { upper: "Α", lower: "α", name: "Alpha", translit: "a", sound: "a as in father" },
    { upper: "Β", lower: "β", name: "Beta", translit: "b", sound: "b as in boy" },
    { upper: "Γ", lower: "γ", name: "Gamma", translit: "g", sound: "g as in go" },
    { upper: "Δ", lower: "δ", name: "Delta", translit: "d", sound: "d as in door" },
    { upper: "Ε", lower: "ε", name: "Epsilon", translit: "e", sound: "e as in met" },
    { upper: "Ζ", lower: "ζ", name: "Zeta", translit: "z", sound: "z as in zeal" },
    { upper: "Η", lower: "η", name: "Eta", translit: "e", sound: "long e" },
    { upper: "Θ", lower: "θ", name: "Theta", translit: "th", sound: "th as in thin" },
    { upper: "Ι", lower: "ι", name: "Iota", translit: "i", sound: "i as in machine" },
    { upper: "Κ", lower: "κ", name: "Kappa", translit: "k", sound: "k as in king" },
    { upper: "Λ", lower: "λ", name: "Lambda", translit: "l", sound: "l as in lamp" },
    { upper: "Μ", lower: "μ", name: "Mu", translit: "m", sound: "m as in mother" },
    { upper: "Ν", lower: "ν", name: "Nu", translit: "n", sound: "n as in now" },
    { upper: "Ξ", lower: "ξ", name: "Xi", translit: "x", sound: "x as in ax" },
    { upper: "Ο", lower: "ο", name: "Omicron", translit: "o", sound: "o as in not" },
    { upper: "Π", lower: "π", name: "Pi", translit: "p", sound: "p as in peace" },
    { upper: "Ρ", lower: "ρ", name: "Rho", translit: "r", sound: "r as in road" },
    { upper: "Σ", lower: "σ/ς", name: "Sigma", translit: "s", sound: "s as in seed" },
    { upper: "Τ", lower: "τ", name: "Tau", translit: "t", sound: "t as in truth" },
    { upper: "Υ", lower: "υ", name: "Upsilon", translit: "u/y", sound: "u or y sound" },
    { upper: "Φ", lower: "φ", name: "Phi", translit: "ph", sound: "ph as in phone" },
    { upper: "Χ", lower: "χ", name: "Chi", translit: "ch", sound: "ch/kh sound" },
    { upper: "Ψ", lower: "ψ", name: "Psi", translit: "ps", sound: "ps as in lips" },
    { upper: "Ω", lower: "ω", name: "Omega", translit: "o", sound: "long o" }
  ];

  const SONG_PATH = "assets/sounds/greek/greek-alphabet.mp3";

  let activeController = null;
  let index = 0;
  let songAudio = null;

  function getRoot(host) {
    return host?.querySelector?.("#greekAlphabetCard") || document.getElementById("greekAlphabetCard");
  }

  function getEls(root) {
    return {
      root,
      upper: root.querySelector("#greekLetter"),
      lower: root.querySelector("#greekLower"),
      name: root.querySelector("#greekName"),
      sound: root.querySelector("#greekSound"),
      translit: root.querySelector("#greekTranslit"),
      index: root.querySelector("#greekIndex"),
      prev: root.querySelector("#greekPrev"),
      next: root.querySelector("#greekNext"),
      speak: root.querySelector("#greekPlay"),
      song: root.querySelector("#greekAudioBtn"),
      grid: root.querySelector("#greekAlphabetGrid"),
      status: root.querySelector("#greekStatus")
    };
  }

  function setStatus(els, message) {
    if (els.status) els.status.textContent = message || "";
  }

  function render(els) {
    const letter = GREEK_ALPHABET[index];
    if (!letter) return;

    if (els.upper) els.upper.textContent = letter.upper;
    if (els.lower) els.lower.textContent = letter.lower;
    if (els.name) els.name.textContent = letter.name;
    if (els.sound) els.sound.textContent = letter.sound;
    if (els.translit) els.translit.textContent = letter.translit;
    if (els.index) els.index.textContent = String(index + 1);

    els.grid?.querySelectorAll(".greek-tile").forEach((tile, tileIndex) => {
      tile.classList.toggle("is-active", tileIndex === index);
      tile.setAttribute("aria-current", tileIndex === index ? "true" : "false");
    });

    stopAudio();
    setStatus(els, `${letter.name}: ${letter.sound}`);
  }

  function go(els, direction) {
    index = (index + direction + GREEK_ALPHABET.length) % GREEK_ALPHABET.length;
    render(els);
  }

  function speakCurrent(els) {
    const letter = GREEK_ALPHABET[index];
    if (!letter) return;

    stopAudio();

    if (!("speechSynthesis" in window)) {
      setStatus(els, "Speech is not available in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${letter.name}. ${letter.sound}.`);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
    setStatus(els, `Speaking ${letter.name}.`);
  }

  function stopAudio() {
    if (songAudio) {
      songAudio.pause();
      songAudio.currentTime = 0;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function playSong(els) {
    stopAudio();
    songAudio = songAudio || new Audio(SONG_PATH);

    songAudio.play()
      .then(() => setStatus(els, "Playing the Greek alphabet song."))
      .catch(() => setStatus(els, "Greek alphabet song file is not available yet."));
  }

  function renderGrid(els) {
    if (!els.grid) return;

    els.grid.innerHTML = "";
    GREEK_ALPHABET.forEach((letter, tileIndex) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "greek-tile";
      tile.textContent = `${letter.upper} ${letter.lower}`;
      tile.setAttribute("aria-label", `Go to ${letter.name}`);
      tile.addEventListener("click", () => {
        index = tileIndex;
        render(els);
      }, { signal: activeController.signal });
      els.grid.appendChild(tile);
    });
  }

  function initGreekAlphabetCard(host) {
    destroyGreekAlphabetCard();

    const root = getRoot(host);
    if (!root) return;

    activeController = new AbortController();
    const els = getEls(root);

    renderGrid(els);
    render(els);

    els.prev?.addEventListener("click", () => go(els, -1), { signal: activeController.signal });
    els.next?.addEventListener("click", () => go(els, 1), { signal: activeController.signal });
    els.speak?.addEventListener("click", () => speakCurrent(els), { signal: activeController.signal });
    els.song?.addEventListener("click", () => playSong(els), { signal: activeController.signal });
  }

  function destroyGreekAlphabetCard() {
    stopAudio();

    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  }

  window.initGreekAlphabetCard = initGreekAlphabetCard;
  window.destroyGreekAlphabetCard = destroyGreekAlphabetCard;

  document.addEventListener("card:init", event => {
    if (event.detail?.cardName === "greekalphabet") {
      initGreekAlphabetCard(event.target);
    }
  });

  queueMicrotask(() => {
    const root = getRoot(document);
    if (root) initGreekAlphabetCard(root.closest("#loadedCardHost") || document);
  });
})();
