(() => {
  const makeRollingLabel = (text) => {
    const label = document.createElement("span");
    label.className = "project-view-tab-label";
    label.setAttribute("aria-hidden", "true");
    [...text].forEach((character, index) => {
      const item = document.createElement("span");
      item.className = "project-view-tab-char";
      item.style.setProperty("--project-tab-delay", `${index * 30}ms`);
      item.textContent = character;
      label.append(item);
    });
    return label;
  };

  document.querySelectorAll(".project-nav").forEach((header) => {
    const switcher = header.querySelector(".project-view-switch, .portfolio-view-switch");
    const select = switcher?.querySelector("select");
    const title = header.querySelector(".project-nav-title");
    if (!switcher || !select || !title) return;

    const tabs = document.createElement("nav");
    tabs.className = "project-view-tabs";
    tabs.setAttribute("aria-label", select.getAttribute("aria-label") || "切换项目展示");
    const indicator = document.createElement("span");
    indicator.className = "project-view-tab-indicator";
    indicator.setAttribute("aria-hidden", "true");

    [...select.options].forEach((option) => {
      const tab = document.createElement(option.disabled ? "span" : "a");
      tab.className = "project-view-tab";
      tab.append(makeRollingLabel(option.text));
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
    tabs.append(indicator);
    header.insertBefore(tabs, title);
    header.classList.add("project-nav--tabs");

    const interactiveTabs = [...tabs.querySelectorAll("a.project-view-tab")];
    const positionIndicator = (tab, instant = false) => {
      if (!tab) return;
      const tabsRect = tabs.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      indicator.style.transitionDuration = instant ? "0ms" : "380ms";
      indicator.style.width = `${tabRect.width}px`;
      indicator.style.transform = `translateX(${tabRect.left - tabsRect.left}px)`;
    };
    const activeTab = () => tabs.querySelector(".project-view-tab.is-active") || interactiveTabs[0];

    interactiveTabs.forEach((tab) => {
      tab.addEventListener("pointerenter", () => positionIndicator(tab));
      tab.addEventListener("mouseenter", () => positionIndicator(tab));
      tab.addEventListener("focus", () => positionIndicator(tab));
    });
    tabs.addEventListener("pointerleave", () => positionIndicator(activeTab()));
    tabs.addEventListener("mouseleave", () => positionIndicator(activeTab()));
    window.addEventListener("resize", () => positionIndicator(activeTab(), true));
    requestAnimationFrame(() => {
      positionIndicator(activeTab(), true);
      tabs.classList.add("is-ready");
    });
  });
})();
