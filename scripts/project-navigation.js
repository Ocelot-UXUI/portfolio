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
})();
