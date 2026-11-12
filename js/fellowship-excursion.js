const launch = document.getElementById('mainStageFellowshipPilot');

if (launch) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fellowship-excursion';
  dialog.setAttribute('aria-labelledby', 'fellowshipExcursionTitle');
  dialog.innerHTML = '<header><strong id="fellowshipExcursionTitle">Fellowship</strong><button class="ui-btn" type="button" aria-label="Close Fellowship" autofocus>Close</button></header><div class="fellowship-excursion-content"></div>';
  const host = dialog.lastElementChild;
  let dispose;
  let opening = 0;

  let viewportFrame;
  const viewport=window.visualViewport;
  function fitViewport(){
    cancelAnimationFrame(viewportFrame);
    viewportFrame=requestAnimationFrame(()=>{
      if(!dialog.open||viewport?.scale&&viewport.scale!==1)return;
      dialog.style.setProperty('--fellowship-viewport-height',(viewport?.height||innerHeight)+'px');
      dialog.style.setProperty('--fellowship-viewport-top',(viewport?.offsetTop||0)+'px');
    });
  }
  function watchViewport(){viewport?.addEventListener('resize',fitViewport);viewport?.addEventListener('scroll',fitViewport);window.addEventListener('resize',fitViewport);fitViewport();}
  function stopViewport(){viewport?.removeEventListener('resize',fitViewport);viewport?.removeEventListener('scroll',fitViewport);window.removeEventListener('resize',fitViewport);cancelAnimationFrame(viewportFrame);}
  function close() {
    ++opening;
    stopViewport();
    dispose?.();
    dispose = undefined;
    if (dialog.open) dialog.close();
    window.HGCommonsWeekCompanion?.refresh();
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
    watchViewport();
    window.HGCommonsWeekCompanion?.refresh();
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
