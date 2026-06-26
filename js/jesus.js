(function () {
  let utterance = null;
  let isReading = false;
  let isPaused = false;
  let voicesChangedHandler = null;

  function getEls(root = document) {
    const scope = root && typeof root.querySelector === "function" ? root : document;

    return {
      card: scope.querySelector("#jesusReaderCard"),
      article: scope.querySelector("#jesusReaderArticle"),
      listenBtn: scope.querySelector("#jesusListenBtn"),
      pauseBtn: scope.querySelector("#jesusPauseBtn"),
      resumeBtn: scope.querySelector("#jesusResumeBtn"),
      stopBtn: scope.querySelector("#jesusStopBtn"),
      status: scope.querySelector("#jesusAudioStatus")
    };
  }

  function setStatus(text, root = document) {
    const { status } = getEls(root);
    if (status) status.textContent = text;
  }

  function setButtonState(root = document) {
    const { listenBtn, pauseBtn, resumeBtn, stopBtn } = getEls(root);

    if (listenBtn) listenBtn.textContent = isReading ? "Restart" : "Listen";
    if (pauseBtn) pauseBtn.disabled = !isReading || isPaused;
    if (resumeBtn) resumeBtn.disabled = !isReading || !isPaused;
    if (stopBtn) stopBtn.disabled = !isReading;
  }

  function pickVoice() {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices ? synth.getVoices() : [];

    return (
      voices.find(voice => voice.lang?.startsWith("en") && /natural|premium|david|mark|daniel/i.test(voice.name)) ||
      voices.find(voice => voice.lang?.startsWith("en")) ||
      null
    );
  }

  function stopReading(root = document) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    utterance = null;
    isReading = false;
    isPaused = false;
    setButtonState(root);
    setStatus("Ready to read aloud.", root);
  }

  function readArticle(root = document) {
    const { article } = getEls(root);

    if (!("speechSynthesis" in window)) {
      setStatus("Read aloud is not available in this browser.", root);
      return;
    }

    if (!article) return;

    const text = article.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;

    window.speechSynthesis.cancel();

    utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.82;
    utterance.pitch = 0.86;
    utterance.volume = 0.92;

    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      isReading = true;
      isPaused = false;
      setButtonState(root);
      setStatus("Reading aloud.", root);
    };

    utterance.onend = () => {
      utterance = null;
      isReading = false;
      isPaused = false;
      setButtonState(root);
      setStatus("Finished reading.", root);
    };

    utterance.onerror = () => {
      utterance = null;
      isReading = false;
      isPaused = false;
      setButtonState(root);
      setStatus("The reader stopped before finishing.", root);
    };

    window.speechSynthesis.speak(utterance);
  }

  function pauseReading(root = document) {
    if (!isReading || !("speechSynthesis" in window)) return;

    window.speechSynthesis.pause();
    isPaused = true;
    setButtonState(root);
    setStatus("Paused.", root);
  }

  function resumeReading(root = document) {
    if (!isReading || !("speechSynthesis" in window)) return;

    window.speechSynthesis.resume();
    isPaused = false;
    setButtonState(root);
    setStatus("Reading aloud.", root);
  }

  function initJesusCard(root = document) {
    const els = getEls(root);
    if (!els.card) return;

    if (els.listenBtn) {
      els.listenBtn.onclick = () => readArticle(root);
    }

    if (els.pauseBtn) {
      els.pauseBtn.onclick = () => pauseReading(root);
    }

    if (els.resumeBtn) {
      els.resumeBtn.onclick = () => resumeReading(root);
    }

    if (els.stopBtn) {
      els.stopBtn.onclick = () => stopReading(root);
    }

    if ("speechSynthesis" in window && !voicesChangedHandler && window.speechSynthesis.onvoiceschanged === null) {
      voicesChangedHandler = () => setStatus("Ready to read aloud.", root);
      window.speechSynthesis.onvoiceschanged = voicesChangedHandler;
    }

    setButtonState(root);
    setStatus("Ready to read aloud.", root);
  }

  function destroyJesusCard(root = document) {
    stopReading(root);

    if ("speechSynthesis" in window && window.speechSynthesis.onvoiceschanged === voicesChangedHandler) {
      window.speechSynthesis.onvoiceschanged = null;
    }

    voicesChangedHandler = null;
  }

  window.initJesusCard = initJesusCard;
  window.destroyJesusCard = destroyJesusCard;
  initJesusCard(document);
})();
