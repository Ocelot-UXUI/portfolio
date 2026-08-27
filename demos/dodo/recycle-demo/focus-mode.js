// Focus mode for the Deck embed: preserve the original UI, but expose only
// the artifact deletion and recycle-bin path as live interactions.
(() => {
  const allowedSelectors = [
    '[data-section="artifacts"]',
    '[data-artifact-more]',
    '[data-artifact-delete]',
    '[data-confirm-artifact-delete]',
    '[data-close-artifact-modal]',
    '[data-open-recycle]',
    '[data-close-recycle]',
    '[data-artifact-restore]',
    '[data-artifact-purge]'
  ];

  const isAllowed = (target) => target instanceof Element && allowedSelectors.some((selector) => target.closest(selector));

  document.addEventListener("click", (event) => {
    if (isAllowed(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();
  }, true);

  // Keep the original visual controls visible, but make search/filter inputs inert.
  document.addEventListener("input", (event) => {
    event.preventDefault();
    event.stopPropagation();
  }, true);

  const appShell = document.querySelector(".app-shell");
  const mainStage = document.querySelector(".main-stage");
  const artifactGrid = document.querySelector("[data-artifact-grid]");
  const recycleEntry = document.querySelector("[data-open-recycle]");
  const recycleModal = document.querySelector("[data-recycle-modal]");
  const DESIGN_WIDTH = 1160;
  const MIN_DESIGN_HEIGHT = 900;

  // Keep the primary action visible while the lower portion of the design
  // canvas is intentionally cropped by the Deck frame.
  if (recycleEntry) document.body.append(recycleEntry);

  // Keep the original desktop composition. The Deck iframe scales this entire
  // canvas as one unit; individual controls and cards must never reflow.
  mainStage?.classList.remove("is-expanded");
  if (typeof showSection === "function") showSection("artifacts");

  // The first pass is intentionally self-explanatory: show the cursor path
  // before asking the viewer to take over the deletion flow.
  let guideStep = "intro";
  let recycleGuideTimer = 0;
  let introRun = 0;

  const demoCursor = document.createElement("div");
  demoCursor.className = "demo-cursor";
  demoCursor.setAttribute("aria-hidden", "true");
  demoCursor.innerHTML = `
    <svg viewBox="0 0 36 37" fill="none" role="presentation">
      <g filter="url(#demo-cursor-shadow)">
        <path d="M11.5444 12.9152C11.191 11.226 12.9993 9.91228 14.4965 10.7704L22.769 15.5114C24.3173 16.3988 24.0164 18.7159 22.2927 19.1783L19.6402 19.89C19.1574 20.0195 18.7406 20.3251 18.4719 20.7466L17.1287 22.8537C16.1649 24.3657 13.8518 23.9433 13.4846 22.1882L11.5444 12.9152Z" fill="#5180F9" />
        <path d="M12.1802 12.7822C11.9416 11.642 13.1629 10.7548 14.1735 11.334L22.4456 16.0755C23.4908 16.6745 23.2877 18.2385 22.1242 18.5506L19.4715 19.2624C18.832 19.4341 18.2802 19.839 17.9242 20.3974L16.581 22.5044C15.9304 23.525 14.3684 23.2399 14.1205 22.0553L12.1802 12.7822Z" stroke="#fff" stroke-width="1.3" />
      </g>
      <defs>
        <filter id="demo-cursor-shadow" x="0" y="0" width="35.2754" height="36.2798" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="5.75" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.317647 0 0 0 0 0.501961 0 0 0 0 0.976471 0 0 0 1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>`;
  appShell?.append(demoCursor);

  const clearGuide = () => {
    document.querySelectorAll(".demo-guide-target").forEach((element) => {
      element.classList.remove("demo-guide-target");
    });
    document.querySelectorAll(".demo-guide-reveal-actions").forEach((element) => {
      element.classList.remove("demo-guide-reveal-actions");
    });
  };

  const applyGuide = () => {
    clearGuide();

    let target = null;
    if (guideStep === "delete") {
      target = document.querySelector(".artifact-card-menu.is-open [data-artifact-delete]");
    } else if (guideStep === "confirm") {
      target = document.querySelector("[data-confirm-artifact-delete]");
    } else if (guideStep === "recycle") {
      target = recycleEntry;
    } else if (guideStep === "restore") {
      const row = document.querySelector("[data-recycle-list] .recycle-item");
      row?.classList.add("demo-guide-reveal-actions");
      target = row?.querySelector("[data-artifact-restore]");
    }

    target?.classList.add("demo-guide-target");
  };

  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

  const setCursorAt = (element, horizontal = 0.5, vertical = 0.5) => {
    if (!appShell || !element) return false;
    const shellRect = appShell.getBoundingClientRect();
    const targetRect = element.getBoundingClientRect();
    const scale = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--demo-scale")) || 1;
    demoCursor.style.left = `${(targetRect.left + targetRect.width * horizontal - shellRect.left) / scale}px`;
    demoCursor.style.top = `${(targetRect.top + targetRect.height * vertical - shellRect.top) / scale}px`;
    return true;
  };

  const startIntro = async () => {
    const run = ++introRun;
    guideStep = "intro";
    clearGuide();
    demoCursor.classList.remove("is-visible", "is-clicking");

    const card = document.querySelector("[data-artifact-grid] .artifact-card");
    if (!card) return;

    // Start beside the card so the pointer has a visible journey into it.
    setCursorAt(card, 0.06, 1.08);
    await wait(400);
    if (run !== introRun) return;
    demoCursor.classList.add("is-visible");

    setCursorAt(card, 0.45, 0.48);
    await wait(700);
    if (run !== introRun) return;
    card.classList.add("demo-card-hover");

    await wait(700);
    if (run !== introRun) return;
    const moreButton = card.querySelector("[data-artifact-more]");
    if (!moreButton) return;
    setCursorAt(moreButton);

    await wait(700);
    if (run !== introRun) return;
    demoCursor.classList.add("is-clicking");
    moreButton.click();

    await wait(220);
    if (run !== introRun) return;
    demoCursor.classList.remove("is-visible", "is-clicking");
    guideStep = "delete";
    applyGuide();
  };

  const restartGuide = () => {
    window.clearTimeout(recycleGuideTimer);
    if (recycleModal) recycleModal.hidden = true;
    requestAnimationFrame(startIntro);
  };

  const showRecycleGuide = () => {
    guideStep = "recycle";
    window.clearTimeout(recycleGuideTimer);
    applyGuide();
    recycleGuideTimer = window.setTimeout(() => {
      if (guideStep === "recycle") {
        recycleEntry?.classList.remove("demo-guide-target");
      }
    }, 1600);
  };

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-artifact-delete]")) {
      guideStep = "confirm";
    } else if (event.target.closest("[data-confirm-artifact-delete]")) {
      showRecycleGuide();
      return;
    } else if (event.target.closest("[data-open-recycle]")) {
      window.clearTimeout(recycleGuideTimer);
      guideStep = "restore";
    } else if (event.target.closest("[data-artifact-purge]")) {
      // Purging is the end of the story: return to the first actionable state
      // so the embedded demo can be replayed without a page refresh.
      restartGuide();
      return;
    } else if (event.target.closest("[data-artifact-restore]")) {
      restartGuide();
      return;
    } else if (event.target.closest("[data-close-artifact-modal]")) {
      guideStep = "delete";
    } else if (event.target.closest("[data-close-recycle]")) {
      showRecycleGuide();
      return;
    } else {
      return;
    }
    applyGuide();
  });

  let fitFrame = 0;
  const fitDemo = () => {
    if (!appShell || !mainStage) return;

    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(() => {
      // Measure at the fixed desktop size before applying the viewport scale.
      appShell.style.width = `${DESIGN_WIDTH}px`;
      appShell.style.height = "auto";
      appShell.style.transform = "none";

      const naturalHeight = Math.max(
        MIN_DESIGN_HEIGHT,
        mainStage.scrollHeight,
        document.querySelector("[data-artifacts-view]")?.scrollHeight || 0
      );
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      // Fill the available width. The Deck is a focused preview, so cropping
      // lower rows is preferable to shrinking every control until it is tiny.
      const scale = Math.min(viewportWidth / DESIGN_WIDTH, 1);
      const left = Math.max(0, (viewportWidth - DESIGN_WIDTH * scale) / 2);
      const top = 0;

      document.documentElement.style.setProperty("--demo-scale", scale);
      document.documentElement.style.setProperty("--recycle-scale", scale * 0.9);
      document.documentElement.style.setProperty("--guide-canvas-outline", `${1.25 / scale}px`);
      document.documentElement.style.setProperty("--guide-recycle-outline", `${1.25 / (scale * 0.9)}px`);
      appShell.style.height = `${naturalHeight}px`;
      appShell.style.left = `${left}px`;
      appShell.style.top = `${top}px`;
      appShell.style.transform = `scale(${scale})`;
    });
  };

  requestAnimationFrame(() => {
    fitDemo();
    startIntro();
  });
  window.addEventListener("resize", fitDemo);
  if (artifactGrid) {
    new MutationObserver(() => {
      fitDemo();
      applyGuide();
    }).observe(artifactGrid, { childList: true });
  }
})();
