(() => {
  document.querySelectorAll('[data-scheme1-demo]').forEach(preview => {
    const canvas = preview.querySelector('.cnap-scheme1-card');
    const state = preview.querySelector('[data-scheme1-state]');
    const input = preview.querySelector('[data-scheme1-input]');
    const ripple = preview.querySelector('[data-scheme1-ripple]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const value = document.createElement('span');
    value.className = 'cnap-scheme1-value';
    canvas.append(value);
    input.style.visibility = 'hidden';
    preview.inert = true;
    const slide = preview.closest('.case-slide-frame');
    const stateRows = ['inherited', 'overridden', 'restore'].map(step => {
      const row = document.createElement('span');
      row.className = 'cnap-scheme1-row-fade';
      row.dataset.step = step;
      row.setAttribute('aria-hidden', 'true');
      slide.append(row);
      return row;
    });
    const stateAssets = {
      inherited: '../assets/cnap-case/scheme1-inherited.png',
      overridden: '../assets/cnap-case/scheme1-overridden.png',
      restore: '../assets/cnap-case/scheme1-restore.png',
    };
    const clicks = [
      { at: 1300, x: 1374, y: 58 },
      { at: 2100, x: 1180, y: 123 },
      { at: 6500, x: 1374, y: 58 },
      { at: 8200, x: 1374, y: 58 },
    ];
    let visible = false, elapsed = 0, last = 0, phase = -1;
    const resize = () => { canvas.style.transform = `scale(${preview.getBoundingClientRect().width / 1439})`; };
    const updateVisibility = () => {
      const bounds = preview.getBoundingClientRect();
      visible = bounds.bottom > 0 && bounds.top < innerHeight;
    };
    const renderPhase = next => {
      const editing = next > 0 && next < 9;
      const overridden = next >= 3 && next <= 7;
      state.src = stateAssets[next === 8 ? 'restore' : overridden ? 'overridden' : 'inherited'];
      input.disabled = !editing;
      input.value = next >= 3 && next <= 8 ? '9999'.slice(0, Math.min(4, next - 2)) : '3';
      value.textContent = input.value;
      value.classList.toggle('is-selected', next === 2);
      value.classList.toggle('is-typing', next >= 3 && next <= 6);
      canvas.classList.toggle('is-editing', editing);
      canvas.classList.toggle('is-focused', next >= 2 && next <= 6);
      const activeStep = next === 8 ? 'restore' : overridden ? 'overridden' : 'inherited';
      stateRows.forEach(row => row.classList.toggle('is-active', reduced.matches || row.dataset.step === activeStep));
      state.animate([{ opacity: .65 }, { opacity: 1 }], { duration: 180 });
    };
    const tick = now => {
      const playing = visible && !document.hidden && !reduced.matches;
      if (playing && last) elapsed += now - last;
      last = now;
      const t = elapsed % 10000;
      const next = t < 1300 ? 0 : t < 2100 ? 1 : t < 2900 ? 2 : t < 3250 ? 3 : t < 3600 ? 4 : t < 3950 ? 5 : t < 4400 ? 6 : t < 6500 ? 7 : t < 8200 ? 8 : 9;
      if (next !== phase) { phase = next; renderPhase(next); }
      const click = playing && clicks.find(({ at }) => t >= at && t < at + 480);
      if (click) {
        const progress = (t - click.at) / 480;
        ripple.hidden = false;
        ripple.style.left = `${click.x}px`;
        ripple.style.top = `${click.y}px`;
        ripple.style.opacity = String(1 - progress);
        ripple.style.transform = `translate(-50%, -50%) scale(${0.35 + progress * 1.15})`;
      } else ripple.hidden = true;
      requestAnimationFrame(tick);
    };
    new ResizeObserver(() => { resize(); updateVisibility(); }).observe(preview);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(preview);
    addEventListener('scroll', updateVisibility, { passive: true });
    addEventListener('resize', updateVisibility);
    resize();
    updateVisibility();
    renderPhase(0);
    requestAnimationFrame(tick);
  });

  document.querySelectorAll('[data-live-override]').forEach(iframe => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const slide = iframe.closest('.case-slide-frame');
    const stateRows = ['inherited', 'overridden', 'restore'].map(step => {
      const row = document.createElement('span');
      row.className = 'cnap-scheme1-row-fade cnap-scheme2-state-fade';
      row.dataset.step = step;
      row.setAttribute('aria-hidden', 'true');
      row.classList.toggle('is-active', step === 'inherited');
      slide.append(row);
      return row;
    });
    let visible = false;
    const update = () => {
      const playing = visible && !document.hidden && !reduced.matches;
      iframe.contentWindow?.postMessage({ type: 'case-preview-play', playing }, '*');
    };
    new ResizeObserver(() => { iframe.style.transform = `scale(${iframe.parentElement.getBoundingClientRect().width / 1574})`; }).observe(iframe.parentElement);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }).observe(iframe.parentElement);
    addEventListener('message', event => {
      if (event.source !== iframe.contentWindow) return;
      if (event.data?.type === 'case-preview-ready') update();
      if (event.data?.type === 'case-preview-state') {
        stateRows.forEach(row => row.classList.toggle('is-active', row.dataset.step === event.data.step));
      }
    });
    document.addEventListener('visibilitychange', update);
  });
  const videos = document.querySelectorAll('[data-preview-src]');
  const fallbackPoster = '../assets/cnap-case/workload-preview-poster.jpg';

  videos.forEach((video, index) => {
    const frame = video.closest('.case-slide-frame');
    if (!frame) return;
    const toggle = frame.querySelector('.cnap-preview-toggle');
    const hotspot = video.closest('.cnap-preview-viewport');
    if (!toggle || !hotspot) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let userPaused = reduced.matches;
    let visible = false;
    let hovering = false;
    let keyboardPaused = false;
    const prepare = () => {
      if (!video.poster) {
        video.poster = video.dataset.previewPoster || (index === 0 ? fallbackPoster : '');
        if (video.poster) video.classList.add('is-ready');
      }
    };
    const load = () => {
      if (!video.getAttribute('src')) {
        video.src = video.dataset.previewSrc;
        video.load();
      }
    };
    const update = () => {
      if (visible && !document.hidden && !userPaused && !hovering && !keyboardPaused) {
        load();
        video.play().catch(() => {
          userPaused = true;
          toggle.textContent = '播放演示';
          toggle.setAttribute('aria-label', '播放演示');
          toggle.hidden = false;
        });
      } else video.pause();
    };
    const label = () => {
      toggle.textContent = video.paused ? '播放演示' : '暂停演示';
      toggle.setAttribute('aria-label', toggle.textContent);
    };
    video.addEventListener('playing', () => {
      video.classList.add('is-ready');
      toggle.hidden = false;
      label();
    });
    video.addEventListener('pause', label);
    video.addEventListener('loadeddata', () => video.classList.add('is-ready'));
    video.addEventListener('error', () => {
      video.classList.remove('is-ready');
      toggle.hidden = true;
    });
    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      update();
    });
    hotspot.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') { hovering = true; update(); }
    });
    hotspot.addEventListener('pointerleave', () => { hovering = false; update(); });
    hotspot.addEventListener('focus', () => { keyboardPaused = true; update(); });
    hotspot.addEventListener('blur', () => { keyboardPaused = false; update(); });
    if (reduced.matches) { toggle.hidden = false; label(); }
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { prepare(); if (!reduced.matches) load(); }
    }, { rootMargin: '250px' }).observe(frame);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      update();
    }, { threshold: 0 }).observe(video);
    document.addEventListener('visibilitychange', update);
  });
})();
