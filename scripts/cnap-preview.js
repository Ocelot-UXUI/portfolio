(() => {
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
