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
    :root[data-hg-theme-preset="sapphire"] {
      --bg-0: #060f24; --bg-1: #0c2040; --bg-2: #153258;
      --panel: rgba(18,43,76,.88); --panel-2: rgba(28,60,98,.85);
      --line: rgba(142,193,244,.26); --soft: rgba(133,180,233,.12);
      --text: #f2f6ff; --muted: #b6c9e2;
      --gold: #f1c779; --gold-2: #ffe1a1; --accent: #75c9ff;
      --shadow: 0 18px 50px rgba(0,8,30,.58);
    }
    :root[data-hg-theme-preset="parchment"] {
      color-scheme: light;
      --bg-0: #e8dcc0; --bg-1: #f4e9d2; --bg-2: #e3d1ab;
      --panel: rgba(255,250,237,.94); --panel-2: rgba(244,231,203,.95);
      --line: rgba(93,65,37,.27); --soft: rgba(112,81,43,.10);
      --text: #302519; --muted: #695541;
      --gold: #80501e; --gold-2: #996124; --accent: #516d47;
      --shadow: 0 14px 40px rgba(83,59,30,.18);
    }
    #${BADGE_ID} {
      position: fixed; right: 12px; bottom: 12px; z-index: 2147483646;
      background: #121212; color: #fff; border: 2px solid #ffeb00;
      border-radius: 12px; padding: 10px 12px; font: 700 12px/1.4 system-ui,sans-serif;
      box-shadow: 0 4px 18px rgba(0,0,0,.5); display: flex;
      align-items: center; gap: 8px; flex-wrap: wrap; max-width: calc(100vw - 24px);
    }
    #${BADGE_ID} button {
      background: #ffeb00; color: #111; border: 0; border-radius: 7px;
      padding: 6px 9px; font: inherit; cursor: pointer;
    }
    #${BADGE_ID} select {
      background: #202020; color: white; border: 1px solid #777;
      border-radius: 7px; padding: 6px; font: inherit; max-width: 155px;
    }
    #${BADGE_ID} .hg-diagnostic-close {
      background: transparent; color: #fff; border: 1px solid #777;
      padding: 5px 9px; font-size: 16px; line-height: 1;
    }
  `;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);

  const PRESETS = ['cosmic', 'diagnostic', 'sapphire', 'parchment'];
  function applyPreset(preset) {
    if (!PRESETS.includes(preset)) return;
    ROOT.removeAttribute(ATTR);
    ROOT.removeAttribute('data-hg-theme-preset');
    if (preset === 'diagnostic') ROOT.setAttribute(ATTR, 'on');
    if (preset === 'sapphire' || preset === 'parchment') {
      ROOT.setAttribute('data-hg-theme-preset', preset);
    }
    const panel = document.getElementById(BADGE_ID);
    if (panel) {
      panel.querySelector('select').value = preset;
      panel.querySelector('span').textContent =
        ({ cosmic: '✨ COSMIC GLASS', diagnostic: '🔬 DIAGNOSTIC', sapphire: '💎 SAPPHIRE', parchment: '📜 PARCHMENT' })[preset];
    }
  }
  function openPanel() {
    if (!document.getElementById(BADGE_ID)) {
      const badge = document.createElement('div');
      badge.id = BADGE_ID;
      badge.setAttribute('role', 'group');
      badge.setAttribute('aria-label', 'Local theme laboratory');
      const label = document.createElement('span');
      badge.appendChild(label);
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Preview theme');
      [
        ['cosmic', 'Cosmic Glass'],
        ['diagnostic', 'Diagnostic'],
        ['sapphire', 'Midnight Sapphire'],
        ['parchment', 'Ancient Parchment']
      ].forEach(([value, title]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = title;
        select.appendChild(option);
      });
      select.addEventListener('change', () => applyPreset(select.value));
      badge.appendChild(select);
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'hg-diagnostic-close';
      close.textContent = '×';
      close.setAttribute('aria-label', 'Close theme laboratory and restore Cosmic Glass');
      close.addEventListener('click', () => {
        applyPreset('cosmic');
        badge.remove();
      });
      badge.appendChild(close);
      document.body.appendChild(badge);
    }
    applyPreset('diagnostic');
  }
  function toggle() {
    const panel = document.getElementById(BADGE_ID);
    if (panel) {
      applyPreset('cosmic');
      panel.remove();
    } else {
      openPanel();
    }
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
