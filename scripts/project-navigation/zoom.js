(() => {
  const main = document.querySelector('main');
  if (!main || !document.querySelector('.project-nav')) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'project-zoom';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', '页面缩放');
  toolbar.innerHTML = '<button type="button" data-zoom="out" aria-label="缩小" title="缩小">−</button><button type="button" data-zoom="reset" aria-label="恢复原样，当前缩放 100%" title="恢复原样">100%</button><button type="button" data-zoom="in" aria-label="放大" title="放大">+</button>';
  document.body.append(toolbar);
  const originalStyle = main.getAttribute('style');
  const decrease = toolbar.querySelector('[data-zoom="out"]');
  const reset = toolbar.querySelector('[data-zoom="reset"]');
  const increase = toolbar.querySelector('[data-zoom="in"]');
  decrease.disabled = true;
  let scale = 1;
  let baseWidth = document.documentElement.clientWidth;
  let drag = null;
  let suppressClick = false;

  const finishDrag = () => {
    if (!drag) return;
    const pointerId = drag.pointerId;
    drag = null;
    main.classList.remove('project-is-panning');
    if (main.hasPointerCapture(pointerId)) main.releasePointerCapture(pointerId);
  };

  main.addEventListener('pointerdown', (event) => {
    if (scale <= 1 || event.button !== 0 || !event.isPrimary || event.pointerType === 'touch') return;
    if (event.target.closest('a, button, input, textarea, select, video, iframe, [contenteditable], [role="button"]')) return;
    suppressClick = false;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: window.scrollX, top: window.scrollY, moved: false };
  });
  main.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) main.setPointerCapture(event.pointerId);
    drag.moved = true;
    suppressClick = true;
    main.classList.add('project-is-panning');
    event.preventDefault();
    window.scrollTo({ left: drag.left - dx, top: drag.top - dy, behavior: 'instant' });
  });
  window.addEventListener('pointerup', finishDrag);
  window.addEventListener('pointercancel', finishDrag);
  main.addEventListener('lostpointercapture', finishDrag);
  window.addEventListener('blur', finishDrag);
  main.addEventListener('dragstart', (event) => { if (scale > 1) event.preventDefault(); });
  main.addEventListener('click', (event) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  const apply = (next) => {
    finishDrag();
    // Keep the same point of the content under the viewport's reading centre.
    const readingY = window.innerHeight * 0.45;
    const before = main.getBoundingClientRect();
    const fractionY = (readingY - before.top) / before.height;
    const fractionX = (window.innerWidth / 2 - before.left) / before.width;
    if (scale === 1) baseWidth = document.documentElement.clientWidth;
    scale = Math.max(1, Math.min(3, next));
    if (originalStyle === null) main.removeAttribute('style');
    else main.setAttribute('style', originalStyle);
    document.documentElement.classList.toggle('project-is-zoomed', scale !== 1);
    if (scale !== 1) {
      main.style.setProperty('width', `${baseWidth}px`, 'important');
      main.style.setProperty('max-width', 'none', 'important');
      main.style.setProperty('zoom', String(scale));
    }
    const after = main.getBoundingClientRect();
    window.scrollBy({
      top: after.top + fractionY * after.height - readingY,
      left: after.left + fractionX * after.width - window.innerWidth / 2,
      behavior: 'instant',
    });
    reset.textContent = `${Math.round(scale * 100)}%`;
    reset.setAttribute('aria-label', `恢复原样，当前缩放 ${Math.round(scale * 100)}%`);
    decrease.disabled = scale <= 1;
    increase.disabled = scale >= 3;
  };
  decrease.addEventListener('click', () => apply(scale - 0.25));
  increase.addEventListener('click', () => apply(scale + 0.25));
  reset.addEventListener('click', () => apply(1));
  window.addEventListener('resize', () => { if (scale !== 1) apply(1); });
})();
