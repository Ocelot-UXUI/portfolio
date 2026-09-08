(() => {
const collectSectionRailTargets = () => {
    if (document.body.matches(".prototype-homepage, .demo-page, .dodo-demo-page") || document.querySelector(".portfolio-demo-app")) return [];

    const deck = document.querySelector("main .slides");
    if (deck) {
      return [...deck.children].filter((item) => item.matches("img, .case-slide-frame"));
    }

    if (document.body.classList.contains("dodo-page")) {
      return [...document.querySelectorAll("main > section")];
    }

    return [...document.querySelectorAll("main h1, main h2, main h3")].filter((heading) => !heading.closest("[hidden]"));
  };

  let sectionRailTargets = [];
  let sectionRailButtons = [];
  let sectionRailFrame = 0;

  const updateSectionRail = () => {
    sectionRailFrame = 0;
    if (!sectionRailTargets.length) return;

    const readingLine = window.scrollY + (window.innerHeight * .42);
    let activeIndex = 0;
    sectionRailTargets.forEach((target, index) => {
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      if (targetTop <= readingLine) activeIndex = index;
    });

    sectionRailButtons.forEach((button, index) => {
      const active = index === activeIndex;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  };

  const requestSectionRailUpdate = () => {
    if (sectionRailFrame) return;
    sectionRailFrame = requestAnimationFrame(updateSectionRail);
  };

  const buildSectionRail = () => {
    const targets = collectSectionRailTargets();
    const existing = document.querySelector(".project-section-rail");
    existing?.remove();
    document.querySelector(".project-section-rail-tooltip")?.remove();
    sectionRailTargets = targets;
    sectionRailButtons = [];
    if (targets.length < 2) return;

    const rail = document.createElement("nav");
    rail.className = "project-section-rail";
    rail.setAttribute("aria-label", "项目页面导航");

    const tooltip = document.createElement("aside");
    tooltip.className = "project-section-rail-tooltip";
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.innerHTML = '<span class="project-section-rail-tooltip-kicker"></span><strong class="project-section-rail-tooltip-title"></strong>';
    const tooltipKicker = tooltip.querySelector(".project-section-rail-tooltip-kicker");
    const tooltipTitle = tooltip.querySelector(".project-section-rail-tooltip-title");

    const showTooltip = (button, title, kicker) => {
      tooltipKicker.textContent = kicker;
      tooltipTitle.textContent = title;
      tooltip.classList.add("is-visible");
      const { top, height, right } = button.getBoundingClientRect();
      const tooltipHeight = tooltip.offsetHeight;
      const desiredTop = top + (height / 2) - (tooltipHeight / 2);
      tooltip.style.left = `${Math.max(52, right + 12)}px`;
      tooltip.style.top = `${Math.max(12, Math.min(window.innerHeight - tooltipHeight - 12, desiredTop))}px`;
    };

    const hideTooltip = () => tooltip.classList.remove("is-visible");

    targets.forEach((target, index) => {
      const button = document.createElement("button");
      const heading = target.matches("h1, h2, h3") ? target : target.querySelector("h1, h2, h3");
      const image = target.matches("img") ? target : target.querySelector("img");
      const label = image?.dataset.sectionTitle || heading?.textContent.trim() || image?.alt || `第 ${index + 1} 页`;
      const kicker = image?.dataset.sectionKicker || "项目内容";
      button.type = "button";
      button.setAttribute("aria-label", label);
      button.addEventListener("pointerenter", () => showTooltip(button, label, kicker));
      button.addEventListener("pointerleave", hideTooltip);
      button.addEventListener("focus", () => showTooltip(button, label, kicker));
      button.addEventListener("blur", hideTooltip);
      button.addEventListener("click", () => {
        const top = target.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
      rail.append(button);
    });

    document.body.append(rail);
    document.body.append(tooltip);
    sectionRailButtons = [...rail.querySelectorAll("button")];
    updateSectionRail();
  };

  const loadCaseDeckImage = (image) => {
    const source = image?.dataset.src;
    if (!source || image.dataset.loaded === "true") return;
    image.dataset.loaded = "true";
    image.removeAttribute("data-src");
    image.loading = "eager";
    image.src = source;
  };

  const lazyCaseDeckImages = [...document.querySelectorAll(".case-deck-page .slides img[data-src]")];
  if (lazyCaseDeckImages.length) {
    if ("IntersectionObserver" in window) {
      const caseDeckImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadCaseDeckImage(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "400px 0px" });
      lazyCaseDeckImages.forEach((image) => caseDeckImageObserver.observe(image));
    } else {
      lazyCaseDeckImages.forEach(loadCaseDeckImage);
    }
  }

  buildSectionRail();
  window.addEventListener("scroll", requestSectionRailUpdate, { passive: true });
  window.addEventListener("resize", requestSectionRailUpdate, { passive: true });

  const projectMain = document.querySelector("main");
  if (projectMain && document.body.matches(".deliverables-page")) {
    let railRebuildTimer = 0;
    new MutationObserver(() => {
      window.clearTimeout(railRebuildTimer);
      railRebuildTimer = window.setTimeout(buildSectionRail, 80);
    }).observe(projectMain, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  }
})();
