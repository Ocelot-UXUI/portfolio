(() => {
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

  const createSwapLabel = (text, extraClass = "") => {
    const label = document.createElement("span");
    label.className = `nav-random-swap ${extraClass}`.trim();

    const accessible = document.createElement("span");
    accessible.className = "nav-random-swap-sr";
    accessible.textContent = text;
    label.append(accessible);

    [...text].forEach((character) => {
      const slot = document.createElement("span");
      slot.className = "nav-random-swap-slot";
      slot.setAttribute("aria-hidden", "true");
      if (/\s/.test(character)) slot.classList.add("is-space");

      const primary = document.createElement("span");
      primary.className = "nav-random-swap-primary";
      primary.textContent = character === " " ? "\u00a0" : character;

      const secondary = document.createElement("span");
      secondary.className = "nav-random-swap-secondary";
      secondary.textContent = character === " " ? "\u00a0" : character;

      slot.append(primary, secondary);
      label.append(slot);
    });
    return label;
  };

  const bindRandomSwap = (target, label) => {
    if (!target || !label || target.dataset.randomSwapBound === "true") return;
    target.dataset.randomSwapBound = "true";
    const slots = [...label.querySelectorAll(".nav-random-swap-slot:not(.is-space)")];
    const randomize = () => {
      shuffle(slots).forEach((slot, order) => slot.style.setProperty("--nav-swap-order", order));
    };
    const enter = () => {
      randomize();
      label.classList.add("is-swap-hovered");
    };
    const leave = () => {
      randomize();
      label.classList.remove("is-swap-hovered");
    };
    randomize();
    target.addEventListener("pointerenter", enter);
    target.addEventListener("pointerleave", leave);
    target.addEventListener("focus", enter);
    target.addEventListener("blur", leave);
  };

  const enhanceElement = (element) => {
    if (!element || element.dataset.randomSwapEnhanced === "true") return;
    const text = element.textContent.trim();
    if (!text) return;
    const label = createSwapLabel(text);
    element.replaceChildren(label);
    element.dataset.randomSwapEnhanced = "true";
    bindRandomSwap(element, label);
  };

  const enhanceDirectText = (element) => {
    if (!element || element.dataset.randomSwapEnhanced === "true") return;
    const textNodes = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    textNodes.forEach((node) => {
      const label = createSwapLabel(node.textContent.trim());
      node.replaceWith(label);
      bindRandomSwap(element, label);
    });
    element.dataset.randomSwapEnhanced = "true";
  };

  const isDemoNavigation = (header) => (
    document.body.matches(".demo-page, .dodo-demo-page")
    || header.classList.contains("portfolio-project-nav")
  );

  const addDemoNavigationToggle = (header) => {
    if (!isDemoNavigation(header) || header.querySelector(".demo-nav-toggle")) return;

    const button = document.createElement("button");
    button.className = "demo-nav-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "隐藏导航");
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
        <path d="M3 9h18"></path>
        <path d="m9 16 3-3 3 3"></path>
      </svg>
      <span>隐藏导航</span>
    `;
    const back = header.querySelector(":scope > .project-back");
    const actions = document.createElement("div");
    actions.className = "demo-nav-actions";
    header.insertBefore(actions, back || header.firstChild);
    if (back) actions.append(back);
    actions.append(button);
    document.body.classList.add("demo-nav-capable");

    const setHidden = (hidden) => {
      document.body.classList.toggle("demo-nav-hidden", hidden);
      document.body.classList.remove("demo-nav-hovering");
      button.setAttribute("aria-pressed", String(hidden));
      button.setAttribute("aria-label", hidden ? "固定显示导航" : "隐藏导航");
      button.querySelector("span").textContent = hidden ? "固定导航" : "隐藏导航";
    };

    button.addEventListener("click", () => {
      const hidden = !document.body.classList.contains("demo-nav-hidden");
      setHidden(hidden);
      if (hidden) button.blur();
    });

    const compactViewport = matchMedia("(max-width: 700px)");
    compactViewport.addEventListener("change", (event) => {
      if (event.matches && document.body.classList.contains("demo-nav-hidden")) {
        setHidden(false);
      }
    });

    document.addEventListener("pointermove", (event) => {
      if (!document.body.classList.contains("demo-nav-hidden")) return;
      const revealHeight = compactViewport.matches ? 52 : 56;
      const companion = document.body.querySelector(":scope > .demo-nav-companion");
      const isInsideNavigation = header.contains(event.target) || companion?.contains(event.target);
      document.body.classList.toggle("demo-nav-hovering", event.clientY <= revealHeight || isInsideNavigation);
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("demo-nav-hidden")) {
        setHidden(false);
        button.focus({ preventScroll: true });
      }
    });
  };

  document.querySelectorAll(".project-nav").forEach((header) => {
    const switcher = header.querySelector(".project-view-switch, .portfolio-view-switch");
    const select = switcher?.querySelector("select");
    const title = header.querySelector(".project-nav-title");
    if (!switcher || !select || !title) return;

    const tabs = document.createElement("nav");
    tabs.className = "project-view-tabs";
    tabs.setAttribute("aria-label", select.getAttribute("aria-label") || "切换项目展示");
    tabs.append(title);
    [...select.options].forEach((option) => {
      const tab = document.createElement(option.disabled ? "span" : "a");
      tab.className = "project-view-tab";
      const tabText = document.createElement("span");
      tabText.className = "project-view-tab-text";
      tabText.textContent = option.text;
      tab.append(tabText);
      if (option.disabled) {
        tab.setAttribute("aria-disabled", "true");
      } else {
        tab.href = option.value;
        tab.setAttribute("aria-label", option.text);
      }
      if (option.selected) {
        tab.classList.add("is-active");
        tab.setAttribute("aria-current", "page");
        const highlight = document.createElement("span");
        highlight.className = "project-view-tab-highlight";
        highlight.setAttribute("aria-hidden", "true");
        tab.prepend(highlight);
      }
      tabs.append(tab);
    });

    header.insertBefore(tabs, switcher);
    header.classList.add("project-nav--tabs", "project-nav--title-in-tabs");
    tabs.classList.add("is-ready");
    addDemoNavigationToggle(header);
  });

  document.querySelectorAll(".project-nav .project-nav-index").forEach(enhanceElement);
  document.querySelectorAll(".prototype-homepage .nav-logo, .prototype-homepage .nav-label, .prototype-homepage .nav-contact-label").forEach(enhanceElement);

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
