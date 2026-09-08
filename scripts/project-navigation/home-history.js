(() => {
const homeScrollKey = "portfolio:home-scroll-y";
  const restoreHomeScrollKey = "portfolio:restore-home-scroll";
  const returnScrollParam = "returnScroll";
  const restoreScrollParam = "restoreScroll";
  const pageUrl = new URL(window.location.href);
  const isHomepage = document.body.classList.contains("prototype-homepage");
  const storage = {
    get(key) {
      try { return window.sessionStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { window.sessionStorage.setItem(key, value); } catch { /* Storage can be unavailable on file URLs. */ }
    },
    remove(key) {
      try { window.sessionStorage.removeItem(key); } catch { /* Storage can be unavailable on file URLs. */ }
    }
  };

  if (isHomepage) {
    let saveFrame = 0;
    const saveHomeScroll = () => storage.set(homeScrollKey, String(Math.max(0, Math.round(window.scrollY))));
    const scheduleHomeScrollSave = () => {
      if (saveFrame) return;
      saveFrame = window.requestAnimationFrame(() => {
        saveFrame = 0;
        saveHomeScroll();
      });
    };

    window.addEventListener("scroll", scheduleHomeScrollSave, { passive: true });
    window.addEventListener("pagehide", saveHomeScroll);

    document.addEventListener("click", (event) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;
      const destination = new URL(link.href, window.location.href);
      if (!destination.pathname.includes("/pages/") && !destination.pathname.includes("/demos/")) return;
      const currentScroll = String(Math.max(0, Math.round(window.scrollY)));
      destination.searchParams.set(returnScrollParam, currentScroll);
      link.href = destination.href;
      storage.set(homeScrollKey, currentScroll);
    });

    const requestedScroll = Number.parseFloat(pageUrl.searchParams.get(restoreScrollParam) || "");
    const shouldRestore = Number.isFinite(requestedScroll) || storage.get(restoreHomeScrollKey) === "true";
    if (shouldRestore) {
      const savedScroll = Number.isFinite(requestedScroll)
        ? requestedScroll
        : Number.parseFloat(storage.get(homeScrollKey) || "0");
      storage.remove(restoreHomeScrollKey);
      if (pageUrl.searchParams.has(restoreScrollParam)) {
        pageUrl.searchParams.delete(restoreScrollParam);
        window.history.replaceState(window.history.state, "", pageUrl.href);
      }
      const restoreHomeScroll = () => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => window.scrollTo({ top: savedScroll, left: 0, behavior: "auto" }));
        });
      };
      restoreHomeScroll();
      window.addEventListener("load", restoreHomeScroll, { once: true });
    }
  } else {
    const returnScroll = Number.parseFloat(pageUrl.searchParams.get(returnScrollParam) || "");
    if (Number.isFinite(returnScroll)) {
      document.querySelectorAll("a.project-back[href]").forEach((backLink) => {
        const destination = new URL(backLink.href, window.location.href);
        destination.searchParams.set(restoreScrollParam, String(returnScroll));
        backLink.href = destination.href;
      });

      document.addEventListener("click", (event) => {
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!link || link.classList.contains("project-back")) return;
        const destination = new URL(link.href, window.location.href);
        if (!destination.pathname.includes("/pages/") && !destination.pathname.includes("/demos/")) return;
        destination.searchParams.set(returnScrollParam, String(returnScroll));
        link.href = destination.href;
      });
    }

    document.querySelectorAll("a.project-back[href]").forEach((backLink) => {
      backLink.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        storage.set(restoreHomeScrollKey, "true");
      });
    });
  }
})();
