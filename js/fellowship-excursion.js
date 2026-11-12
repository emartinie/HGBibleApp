const launch = document.getElementById('mainStageFellowshipPilot');

if (launch) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fellowship-excursion';
  dialog.setAttribute('aria-labelledby', 'fellowshipExcursionTitle');
  dialog.innerHTML = '<header><strong id="fellowshipExcursionTitle">Fellowship</strong><button class="ui-btn" type="button" autofocus>Close Fellowship</button></header><div class="fellowship-excursion-content"></div>';
  const host = dialog.lastElementChild;
  let dispose;
  let opening = 0;

  function close() {
    ++opening;
    dispose?.();
    dispose = undefined;
    if (dialog.open) dialog.close();
  }

  dialog.querySelector('button').onclick = close;
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', () => {
    if (window.HGRoute?.read()?.card === 'mainstage') launch.focus({preventScroll:true});
  });
  window.addEventListener('hg:routechange', event => {
    if (dialog.open && event.detail.route.card !== 'mainstage') close();
  });
  document.body.append(dialog);

  launch.addEventListener('click', async () => {
    if (dialog.open || window.HGFellowshipActive) return;
    const request = ++opening;
    host.textContent = 'Opening Fellowship…';
    dialog.showModal();
    try {
      await import('./fellowship-live.js?v=shared-content-1');
      if (!dialog.open || request !== opening) return;
      dispose = window.destroyFellowshipLiveCard;
      await window.initFellowshipLiveCard(host, {closeExcursion:close});
    } catch {
      if (request === opening) host.textContent = 'Fellowship could not load. Close it and try again.';
    }
  });
}
