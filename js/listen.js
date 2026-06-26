(function () {
  const ARTICLES = {
    "reader-template": {
      title: "Article Reader Template",
      html: `
        <h2>Article Reader Template</h2>
        <p>
          Use this card for articles, reflections, and study pieces that should be readable and
          listenable. The controls above read the current article aloud using the browser's speech
          synthesis.
        </p>
        <h3>What belongs here</h3>
        <ul>
          <li>Seasonal reflections that should rotate in and out.</li>
          <li>Teaching articles that are too long for a dashboard card.</li>
          <li>Personal notes or study essays that benefit from read-aloud support.</li>
        </ul>
        <h3>Current seasonal shelf</h3>
        <p>
          The Hanukkah reflection has been moved into the queue as a seasonal article. It can later
          be promoted into a proper article data file or seasonal card without breaking this reader.
        </p>
      `
    },
    "hanukkah-trust": {
      title: "A Note on Trust, Hanukkah, and What I Believe",
      html: `
        <h2>A Note on Trust, Hanukkah, and What I Believe</h2>
        <p>
          Chanukah did not begin as a legend about miracles. It began as a response to loss: a
          desecrated Temple, interrupted worship, and a people asking what it means to dedicate
          something again after it has been violated.
        </p>
        <p>
          The first shape of the story was practical and reverent. The space was cleaned. Worship
          resumed. Light was tended again, not because everything was fixed, but because beginning
          again mattered.
        </p>
        <h3>Why it belongs here seasonally</h3>
        <p>
          This reflection is about light, dedication, Jewish memory, and the world Yeshua inhabited.
          It matters deeply, but it should return in season rather than permanently define the Listen
          card.
        </p>
        <h3>Thread for future expansion</h3>
        <p>
          A later seasonal article pass can restore the full essay, including first-century Judaism,
          the Feast of Dedication in John 10, trust between Jewish and Christian readers, and the
          idea of tending light without turning reflection into argument.
        </p>
        <p>
          For now, this card keeps the piece on the shelf while restoring Listen as the reusable
          article reader it was originally meant to be.
        </p>
      `
    }
  };

  let currentArticleId = "reader-template";
  let utterance = null;
  let isReading = false;
  let isPaused = false;
  let voicesChangedHandler = null;

  function getEls(root = document) {
    const scope = root && typeof root.querySelector === "function" ? root : document;

    return {
      card: scope.querySelector("#listenReaderCard"),
      article: scope.querySelector("#listenArticle"),
      items: Array.from(scope.querySelectorAll("[data-listen-article]")),
      playBtn: scope.querySelector("#listenPlayBtn"),
      pauseBtn: scope.querySelector("#listenPauseBtn"),
      resumeBtn: scope.querySelector("#listenResumeBtn"),
      stopBtn: scope.querySelector("#listenStopBtn"),
      status: scope.querySelector("#listenAudioStatus")
    };
  }

  function setStatus(text, root = document) {
    const { status } = getEls(root);
    if (status) status.textContent = text;
  }

  function setButtonState(root = document) {
    const { playBtn, pauseBtn, resumeBtn, stopBtn } = getEls(root);

    if (playBtn) playBtn.textContent = isReading ? "Restart" : "Listen";
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

  function readCurrentArticle(root = document) {
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
      setStatus(`Reading: ${ARTICLES[currentArticleId]?.title || "article"}.`, root);
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
    setStatus(`Reading: ${ARTICLES[currentArticleId]?.title || "article"}.`, root);
  }

  function renderArticle(articleId, root = document) {
    const { article, items } = getEls(root);
    const next = ARTICLES[articleId] || ARTICLES["reader-template"];
    if (!article) return;

    stopReading(root);
    currentArticleId = articleId in ARTICLES ? articleId : "reader-template";
    article.innerHTML = next.html;
    article.focus({ preventScroll: true });

    items.forEach(item => {
      item.setAttribute("aria-current", item.dataset.listenArticle === currentArticleId ? "true" : "false");
    });

    setStatus(`Loaded: ${next.title}.`, root);
  }

  function initListenCard(root = document) {
    const els = getEls(root);
    if (!els.card) return;

    els.items.forEach(item => {
      item.onclick = () => renderArticle(item.dataset.listenArticle, root);
    });

    if (els.playBtn) els.playBtn.onclick = () => readCurrentArticle(root);
    if (els.pauseBtn) els.pauseBtn.onclick = () => pauseReading(root);
    if (els.resumeBtn) els.resumeBtn.onclick = () => resumeReading(root);
    if (els.stopBtn) els.stopBtn.onclick = () => stopReading(root);

    if ("speechSynthesis" in window && !voicesChangedHandler && window.speechSynthesis.onvoiceschanged === null) {
      voicesChangedHandler = () => setStatus("Ready to read aloud.", root);
      window.speechSynthesis.onvoiceschanged = voicesChangedHandler;
    }

    setButtonState(root);
    setStatus("Ready to read aloud.", root);
  }

  function destroyListenCard(root = document) {
    stopReading(root);

    if ("speechSynthesis" in window && window.speechSynthesis.onvoiceschanged === voicesChangedHandler) {
      window.speechSynthesis.onvoiceschanged = null;
    }

    voicesChangedHandler = null;
  }

  window.initListenCard = initListenCard;
  window.destroyListenCard = destroyListenCard;
  initListenCard(document);
})();
