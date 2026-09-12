(() => {
  const card = document.querySelector('.preview-card');
  const input = card.querySelector('input');
  const ripple = card.querySelector('.click-ripple');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clicks = [
    { at: 1200, x: 56, y: 43 },
    { at: 2200, x: 1404, y: 48 },
    { at: 4500, x: 56, y: 43 },
    { at: 6000, x: 56, y: 43 },
  ];
  let playing = false;
  let elapsed = 0;
  let last = 0;
  let phase = -1;

  const render = next => {
    const state = next === 1 ? 'enabled' : next === 2 ? 'overridden' : next === 3 ? 'restore' : 'inherited';
    const enabled = next > 0 && next < 4;
    card.dataset.state = state;
    input.disabled = !enabled;
    input.value = next === 2 || next === 3 ? '5' : '3';
    parent.postMessage({
      type: 'case-preview-state',
      step: next === 2 ? 'overridden' : next === 3 ? 'restore' : 'inherited',
    }, '*');
  };

  const tick = now => {
    if (playing && last) elapsed += now - last;
    last = now;
    const t = elapsed % 7200;
    const next = t < 1200 ? 0 : t < 2200 ? 1 : t < 4500 ? 2 : t < 6000 ? 3 : 4;
    if (next !== phase) {
      phase = next;
      render(next);
    }
    const click = playing && !reduced.matches && clicks.find(({ at }) => t >= at && t < at + 480);
    if (click) {
      const progress = (t - click.at) / 480;
      ripple.hidden = false;
      ripple.style.left = `${click.x}px`;
      ripple.style.top = `${click.y}px`;
      ripple.style.opacity = String(1 - progress);
      ripple.style.transform = `translate(-50%, -50%) scale(${.35 + progress * 1.15})`;
    } else {
      ripple.hidden = true;
    }
    requestAnimationFrame(tick);
  };

  addEventListener('message', event => {
    if (event.source !== parent || event.data?.type !== 'case-preview-play') return;
    playing = Boolean(event.data.playing);
  });
  render(0);
  parent.postMessage({ type: 'case-preview-ready' }, '*');
  requestAnimationFrame(tick);
})();
