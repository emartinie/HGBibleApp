console.log("🔥 cardLoader.js loaded");

class CardLoader {
  constructor() {
    this.host = null;
    this.currentCard = null;
    this.currentScript = null;
  }

  init(hostElementId = "loadedCardHost") {
    this.host = document.getElementById(hostElementId);

    if (!this.host) {
      console.error("❌ CardLoader: host element not found");
    }

    return this;
  }

  async load(cardName) {
    if (!this.host || !cardName) return;

    console.log("📦 Loading card:", cardName);

    this.currentCard = cardName;

    // 1. show loading state
    this.host.innerHTML = `<div class="empty-state">Loading ${cardName}...</div>`;

    // 2. fetch HTML
    const res = await fetch(`cards/${cardName}.html`);
    if (!res.ok) {
      this.host.innerHTML = `<div class="empty-state">Failed to load ${cardName}</div>`;
      throw new Error(`Card not found: ${cardName}`);
    }

    const html = await res.text();
    this.host.innerHTML = html;

    // 3. remove previous script safely
    this._removeScript(cardName);

    // 4. inject new script
    await this._loadScript(cardName);

    console.log("✔ card loaded:", cardName);
  }

  reload() {
    if (!this.currentCard) return;
    return this.load(this.currentCard);
  }

  _removeScript(cardName) {
    const old = document.querySelector(`script[data-card="${cardName}"]`);
    if (old) {
      console.log("🧹 Removing script:", cardName);
      old.remove();
    }
  }

  _loadScript(cardName) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = `js/${cardName}.js?v=${Date.now()}`;
      script.defer = true;

      // mark ownership so we can safely delete later
      script.dataset.card = cardName;

      // module cards (only if you actually need them)
      if (cardName === "commentary" || cardName === "prayermap") {
        script.type = "module";
      }

      script.onload = () => resolve();
      script.onerror = (e) => reject(e);

      document.body.appendChild(script);
    });
  }
}

// expose singleton
const cardLoader = new CardLoader();
window.cardLoader = cardLoader;

export default cardLoader;
