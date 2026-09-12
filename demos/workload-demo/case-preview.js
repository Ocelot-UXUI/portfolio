// The case study uses the live Demo row, with its existing listeners and SVGs.
(() => {
  if (new URLSearchParams(location.search).get('casePreview') !== 'override') return;
  const start = () => {
    applyRuntimeContext('environment', undefined, { announce: false });
    clearTimeout(runtimeContextRefreshTimer);
    const runtime = document.querySelector('#runtimePage');
    const row = runtime.querySelector('.runtime-setting-row');
    const button = row.querySelector('[data-runtime-field-toggle]');
    const input = row.querySelector('input');
    runtime.replaceChildren(row);
    runtime.classList.remove('hidden', 'is-application-context');
    runtime.classList.remove('is-context-refreshing');
    runtime.classList.add('is-help-mode');
    const shell = document.createElement('div');
    shell.id = 'case-preview-shell';
    shell.append(runtime);
    document.body.append(shell);
    document.body.classList.add('case-component-preview');
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = './case-preview.css?v=3';
    document.head.append(css);
    const ripple = document.createElement('div');
    ripple.className = 'case-demo-ripple';
    ripple.hidden = true;
    shell.append(ripple);
    const clicks = [
      { at: 1200, x: 62, y: 49 },
      { at: 2200, x: 1410, y: 54 },
      { at: 4500, x: 62, y: 49 },
      { at: 6000, x: 62, y: 49 },
    ];
    let playing = false, elapsed = 0, last = 0, phase = -1;
    const reset = () => {
      if (button.dataset.runtimeFieldState === 'active') button.click();
      if (button.dataset.runtimeFieldState === 'restore') button.click();
      input.value = '3';
    };
    reset();
    const tick = now => {
      if (playing && last) elapsed += now - last;
      last = now;
      const t = elapsed % 7200;
      const next = t < 1200 ? 0 : t < 2200 ? 1 : t < 4500 ? 2 : t < 6000 ? 3 : 4;
      if (next !== phase) {
        phase = next;
        if (next === 0 || next === 4) reset();
        if (next === 1) button.click();
        if (next === 2) { input.value = '5'; input.dispatchEvent(new Event('input', { bubbles: true })); }
        if (next === 3) button.click();
        parent.postMessage({ type: 'case-preview-state', step: next === 3 ? 'restore' : next === 1 || next === 2 ? 'overridden' : 'inherited' }, '*');
      }
      const enabled = next === 1 || next === 2 || next === 3;
      setRuntimeFieldEnabled(row, enabled);
      input.disabled = !enabled;
      row.classList.toggle('case-demo-input-active', enabled);
      row.classList.toggle('case-demo-input-focused', next === 2);
      if (next === 2 || next === 3) input.value = '5';
      const click = playing && clicks.find(({ at }) => t >= at && t < at + 480);
      if (click) {
        const progress = (t - click.at) / 480;
        ripple.hidden = false;
        ripple.style.left = `${click.x}px`;
        ripple.style.top = `${click.y}px`;
        ripple.style.opacity = String(1 - progress);
        ripple.style.transform = `translate(-50%, -50%) scale(${0.35 + progress * 1.15})`;
      } else {
        ripple.hidden = true;
      }
      requestAnimationFrame(tick);
    };
    addEventListener('message', event => {
      if (event.source !== parent || event.data?.type !== 'case-preview-play') return;
      playing = Boolean(event.data.playing);
    });
    parent.postMessage({ type: 'case-preview-ready' }, '*');
    requestAnimationFrame(tick);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
