/* HomeGroups local-only theme diagnostic. No storage, network, or privileged actions. */
(() => {
  'use strict';
  const ROOT = document.documentElement;
  const ATTR = 'data-hg-theme-diagnostic';
  const STYLE_ID = 'hg-theme-diagnostic-styles';
  const BADGE_ID = 'hg-theme-diagnostic-badge';
  const css = `
    :root[${ATTR}="on"] {
      --bg-0: #fa00ed;
      --bg-1: #b500ff;
      --bg-2: #7800aa;
      --panel: #00e66a;
      --panel-2: #00bbd4;
      --line: #ffeb00;
      --soft: rgba(255,235,0,.30);
      --text: #101010;
      --muted: #4b0055;
      --gold: #003cff;
      --gold-2: #ff4b00;
      --accent: #ff3b00;
      --shadow: 0 0 0 4px #ffeb00;
    }
    #${BADGE_ID} {
      position: fixed; right: 12px; bottom: 12px; z-index: 2147483646;
      background: #121212; color: #fff; border: 2px solid #ffeb00;
      border-radius: 12px; padding: 10px 12px; font: 700 12px/1.4 system-ui,sans-serif;
      box-shadow: 0 4px 18px rgba(0,0,0,.5); display: flex;
      align-items: center; gap: 10px;
    }
    #${BADGE_ID} button {
      background: #ffeb00; color: #111; border: 0; border-radius: 7px;
      padding: 6px 9px; font: inherit; cursor: pointer;
    }
  `;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);

  function setDiagnostic(enabled) {
    if (enabled) {
      ROOT.setAttribute(ATTR, 'on');
      if (!document.getElementById(BADGE_ID)) {
        const badge = document.createElement('div');
        badge.id = BADGE_ID;
        badge.setAttribute('role', 'status');
        const label = document.createElement('span');
        badge.appendChild(label);
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.addEventListener('click', toggle);
        badge.appendChild(reset);
        document.body.appendChild(badge);
      }
    } else {
      ROOT.removeAttribute(ATTR);
    }
    const badge = document.getElementById(BADGE_ID);
    if (badge) {
      badge.querySelector('span').textContent = enabled ? '🔬 DIAGNOSTIC MODE' : '✨ COSMIC GLASS';
      const button = badge.querySelector('button');
      button.textContent = enabled ? 'Normal Mode' : 'Diagnostic Mode';
      button.setAttribute('aria-label', enabled ? 'Switch to normal Cosmic Glass theme' : 'Switch to diagnostic theme');
    }
  }
  function toggle() {
    setDiagnostic(ROOT.getAttribute(ATTR) !== 'on');
  }

  // Secret trigger: tap/click the MainStage title five times within 3 seconds.
  // Keyboard fallback: Ctrl+Alt+Shift+D (Option+Control+Shift+D on macOS).
  let taps = 0;
  let lastTap = 0;
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#mainStageTitle')) return;
    const now = Date.now();
    taps = now - lastTap <= 3000 ? taps + 1 : 1;
    lastTap = now;
    if (taps >= 5) {
      taps = 0;
      toggle();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      toggle();
    }
  });
})();
