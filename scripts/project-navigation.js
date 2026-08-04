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

  document.querySelectorAll(".project-nav").forEach((header) => {
    const switcher = header.querySelector(".project-view-switch, .portfolio-view-switch");
    const select = switcher?.querySelector("select");
    const title = header.querySelector(".project-nav-title");
    if (!switcher || !select || !title) return;

    const tabs = document.createElement("nav");
    tabs.className = "project-view-tabs";
    tabs.setAttribute("aria-label", select.getAttribute("aria-label") || "切换项目展示");
    [...select.options].forEach((option) => {
      const tab = document.createElement(option.disabled ? "span" : "a");
      tab.className = "project-view-tab";
      tab.textContent = option.text;
      if (option.disabled) {
        tab.setAttribute("aria-disabled", "true");
      } else {
        tab.href = option.value;
        tab.setAttribute("aria-label", option.text);
      }
      if (option.selected) {
        tab.classList.add("is-active");
        tab.setAttribute("aria-current", "page");
      }
      tabs.append(tab);
    });
    header.insertBefore(tabs, switcher);
    header.classList.add("project-nav--tabs");
  });

  document.querySelectorAll(".project-nav .project-nav-index").forEach(enhanceElement);
  document.querySelectorAll(".prototype-homepage .nav-logo, .prototype-homepage .nav-label, .prototype-homepage .nav-contact-label").forEach(enhanceElement);
})();
