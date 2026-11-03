(() => {
  const preview = document.querySelector('[data-scheme2-demo]');
  if (!preview) return;
  const card = preview.querySelector('.cnap-scheme2-card');
  const action = card.querySelector('button');
  const input = card.querySelector('input');
  const ripple = card.querySelector('.cnap-scheme2-ripple');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, manual = false, covered = false, elapsed = 0, last = 0, phase = -1;
  const render = (active, hover, buttonHover, value, typing = false) => {
    covered = active;
    card.classList.remove('is-selecting');
    card.classList.toggle('is-covered', active);
    card.classList.toggle('is-hovered', hover);
    card.classList.toggle('is-button-hovered', buttonHover);
    card.classList.toggle('is-typing', typing);
    card.style.setProperty('--typed-width', `${value.length * 13.8}px`);
    action.setAttribute('aria-label', active ? '还原继承配置' : '解锁此配置项');
    action.querySelector('span').textContent = active ? '还原' : '解锁';
    input.disabled = !active;
    input.value = value;
  };
  const resize = () => {
    const bounds = preview.getBoundingClientRect();
    const scale = bounds.width / 1560.714;
    card.style.transform = `scale(${scale})`;
    if (scale) card.style.height = `${bounds.height / scale}px`;
  };
  const clickCue = target => {
    if (reduced.matches) return;
    const bounds = target.getBoundingClientRect();
    const parent = card.getBoundingClientRect();
    const scale = parent.width / 1560.714;
    ripple.style.left = `${(bounds.x + bounds.width / 2 - parent.x) / scale}px`;
    ripple.style.top = `${(bounds.y + bounds.height / 2 - parent.y) / scale}px`;
    ripple.hidden = false;
    ripple.getAnimations().forEach(animation => animation.cancel());
    const animation = ripple.animate([
      { transform: 'translate(-50%, -50%) scale(.35)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 },
    ], { duration: 480, easing: 'ease-out' });
    animation.onfinish = () => { ripple.hidden = true; };
  };
  const interact = () => {
    if (!manual) {
      manual = true;
      render(covered, true, false, input.value);
    }
  };
  preview.addEventListener('pointerenter', interact);
  preview.addEventListener('focusin', interact);
  const resume = () => {
    if (preview.matches(':hover') || preview.contains(document.activeElement)) return;
    manual = false; elapsed = 0; phase = -1;
    render(false, false, false, '3');
  };
  preview.addEventListener('pointerleave', resume);
  preview.addEventListener('focusout', () => setTimeout(resume, 0));
  action.addEventListener('click', () => {
    manual = true;
    clickCue(action);
    render(!covered, true, false, '3');
    if (covered) input.focus();
  });
  const tick = now => {
    if (last && visible && !manual && !document.hidden && !reduced.matches) elapsed += now - last;
    last = now;
    const t = elapsed % 6400;
    const next = t < 800 ? 0 : t < 1250 ? 1 : t < 1750 ? 2 : t < 2200 ? 3 : t < 2650 ? 4 : t < 2820 ? 5 : t < 2990 ? 6 : t < 3160 ? 7 : t < 4100 ? 8 : t < 4600 ? 9 : t < 5050 ? 10 : 11;
    if (!manual && next !== phase) {
      phase = next;
      if (next === 3 || next === 11) clickCue(action);
      if (next === 4) clickCue(input);
      const active = next >= 3 && next <= 10;
      const hover = next === 1 || next === 2 || next === 9 || next === 10;
      const value = next >= 5 && next <= 10 ? '9999'.slice(0, Math.min(next - 4, 4)) : '3';
      render(active, hover, next === 2 || next === 10, value, next >= 5 && next <= 8);
      card.classList.toggle('is-selecting', next === 4);
    }
    requestAnimationFrame(tick);
  };
  new ResizeObserver(resize).observe(preview);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(preview);
  document.addEventListener('visibilitychange', () => { last = 0; });
  render(false, false, false, '3');
  resize();
  requestAnimationFrame(tick);
})();
