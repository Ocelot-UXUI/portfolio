      const stickyNav = document.querySelector(".nav");
      let previousScrollY = window.scrollY;
      let downwardScrollDistance = 0;
      const NAV_HIDE_DISTANCE = 24;

      const updateStickyNav = () => {
        if (!stickyNav) return;
        const currentScrollY = window.scrollY;
        const pastHero = currentScrollY > 96;
        const scrollDelta = currentScrollY - previousScrollY;

        if (!pastHero || scrollDelta <= 0) {
          downwardScrollDistance = 0;
        } else {
          downwardScrollDistance += scrollDelta;
        }

        stickyNav.classList.toggle("is-scrolled", currentScrollY > 16);
        stickyNav.classList.toggle("nav--compact", pastHero);
        stickyNav.classList.toggle("nav--hidden", pastHero && downwardScrollDistance >= NAV_HIDE_DISTANCE);
        previousScrollY = currentScrollY;
      };

      updateStickyNav();
      window.addEventListener("scroll", updateStickyNav, { passive: true });

      const contactPanels = [...document.querySelectorAll(".nav-contact")];
      const copyToast = document.querySelector(".copy-toast");
      let copyToastTimer = 0;

      const setContactPanelOpen = (panel, isOpen) => {
        panel?.classList.toggle("is-open", isOpen);
        panel?.querySelector(".nav-contact-trigger")?.setAttribute("aria-expanded", String(isOpen));
      };

      contactPanels.forEach((panel) => {
        const trigger = panel.querySelector(".nav-contact-trigger");
        const isCopyTrigger = !panel.classList.contains("about-contact-popover");

        panel.addEventListener("pointerenter", () => setContactPanelOpen(panel, true));
        panel.addEventListener("pointerleave", () => setContactPanelOpen(panel, false));
        trigger?.addEventListener("focus", () => setContactPanelOpen(panel, true));
        trigger?.addEventListener("blur", () => {
          window.setTimeout(() => {
            if (!panel.matches(":focus-within")) setContactPanelOpen(panel, false);
          }, 0);
        });
        trigger?.addEventListener("click", () => {
          setContactPanelOpen(panel, true);
          if (isCopyTrigger) copyContactValue("qwe1004080451", "微信号");
        });
      });
      document.addEventListener("pointerdown", (event) => {
        contactPanels.forEach((panel) => {
          if (!panel.contains(event.target)) setContactPanelOpen(panel, false);
        });
      });

      const showContactToast = (message) => {
        if (!copyToast) return;
        window.clearTimeout(copyToastTimer);
        copyToast.textContent = message;
        copyToast.classList.add("is-visible");
        copyToastTimer = window.setTimeout(() => copyToast.classList.remove("is-visible"), 1800);
      };

      const showCopyToast = (label) => showContactToast(`已复制${label}`);

      const copyContactValue = async (value, label) => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
          } else {
            const temporaryInput = document.createElement("textarea");
            temporaryInput.value = value;
            temporaryInput.style.position = "fixed";
            temporaryInput.style.opacity = "0";
            document.body.append(temporaryInput);
            temporaryInput.select();
            document.execCommand("copy");
            temporaryInput.remove();
          }
          showCopyToast(label);
        } catch {
          showContactToast(`${label}复制失败，请手动复制`);
        }
      };

      const copyQrImage = async () => {
        const qrImage = document.querySelector(".nav-contact-qr img");
        try {
          if (!qrImage || !window.ClipboardItem || !navigator.clipboard?.write) throw new Error("Image clipboard unavailable");
          if (!qrImage.complete) await qrImage.decode();
          const canvas = document.createElement("canvas");
          canvas.width = qrImage.naturalWidth;
          canvas.height = qrImage.naturalHeight;
          canvas.getContext("2d").drawImage(qrImage, 0, 0);
          const qrBlob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG conversion failed")), "image/png");
          });
          await navigator.clipboard.write([new ClipboardItem({ "image/png": qrBlob })]);
          showCopyToast("二维码");
        } catch {
          showContactToast("二维码复制失败，请使用支持图片剪贴板的浏览器");
        }
      };

      document.querySelectorAll("[data-copy-value]").forEach((button) => {
        button.addEventListener("click", () => copyContactValue(button.dataset.copyValue, button.dataset.copyLabel));
      });
      document.querySelectorAll("[data-copy-qr]").forEach((button) => button.addEventListener("click", copyQrImage));

      const navLinks = [...document.querySelectorAll("[data-nav-link]")];
      const navIndicator = document.querySelector(".nav-active-indicator");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      const positionNavIndicator = (link, instant = false) => {
        if (!navIndicator || !link) return;
        const linksBounds = navIndicator.parentElement.getBoundingClientRect();
        const linkBounds = link.getBoundingClientRect();
        navIndicator.style.transitionDuration = instant || reducedMotion.matches ? "0ms" : "420ms";
        navIndicator.style.width = `${linkBounds.width}px`;
        navIndicator.style.transform = `translateX(${linkBounds.left - linksBounds.left}px)`;
      };

      const updateNavIndicator = (link, instant = false) => {
        navLinks.forEach((item) => item.classList.toggle("is-active", item === link));
        positionNavIndicator(link, instant);
      };

      const sectionLinks = navLinks
        .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
        .filter(({ section }) => section);

      navLinks.forEach((link) => {
        link.addEventListener("click", () => updateNavIndicator(link));
        link.addEventListener("focus", () => updateNavIndicator(link));
        link.addEventListener("pointerenter", () => positionNavIndicator(link));
        link.addEventListener("mouseenter", () => positionNavIndicator(link));
      });
      const restoreActiveIndicator = () => {
        const activeLink = navLinks.find((link) => link.classList.contains("is-active"));
        positionNavIndicator(activeLink || navLinks[0]);
      };
      navIndicator?.parentElement.addEventListener("pointerleave", restoreActiveIndicator);
      navIndicator?.parentElement.addEventListener("mouseleave", restoreActiveIndicator);

      let navScrollFrame;
      const updateNavFromScroll = () => {
        navScrollFrame = undefined;
        const readingLine = window.innerHeight * 0.33;
        const currentSection = sectionLinks.reduce((closest, item) => {
          const distance = Math.abs(item.section.getBoundingClientRect().top - readingLine);
          return distance < closest.distance ? { ...item, distance } : closest;
        }, { distance: Infinity });
        if (currentSection.link) updateNavIndicator(currentSection.link);
      };
      window.addEventListener("scroll", () => {
        if (!navScrollFrame) navScrollFrame = requestAnimationFrame(updateNavFromScroll);
      }, { passive: true });
      window.addEventListener("resize", () => {
        const activeLink = navLinks.find((link) => link.classList.contains("is-active"));
        updateNavIndicator(activeLink || navLinks[0], true);
      });
      requestAnimationFrame(() => {
        updateNavIndicator(navLinks[0], true);
        updateNavFromScroll();
      });

      document.documentElement.classList.add("motion-ready");
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
      document.querySelectorAll(".reveal, .section-reveal").forEach((element) => observer.observe(element));

      let lastProjectScrollY = window.scrollY;
      let projectScrollDirection = "down";
      window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        if (Math.abs(currentScrollY - lastProjectScrollY) < 2) return;
        projectScrollDirection = currentScrollY > lastProjectScrollY ? "down" : "up";
        lastProjectScrollY = currentScrollY;
      }, { passive: true });

      const projectCopyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const project = entry.target.closest(".project-showcase");
          if (!project) return;
          if (entry.intersectionRatio >= 0.25) {
            if (projectScrollDirection === "down") {
              project.classList.remove("copy-static");
              project.classList.add("copy-visible");
            } else {
              project.classList.remove("copy-visible");
              project.classList.add("copy-static");
            }
          } else if (!entry.isIntersecting) {
            project.classList.remove("copy-visible");
          }
        });
      }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
      document.querySelectorAll(".project-showcase .showcase-copy").forEach((element) => projectCopyObserver.observe(element));

      const aboutHeading = document.querySelector(".about-heading h2");
      if (aboutHeading) {
        const aboutHeadingObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const about = entry.target.closest(".about");
            if (!about) return;
            if (entry.intersectionRatio >= 0.35) {
              about.classList.add("about-heading-visible");
            } else if (!entry.isIntersecting) {
              about.classList.remove("about-heading-visible");
            }
          });
        }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });
        aboutHeadingObserver.observe(aboutHeading);
      }

      const heroProjectStack = document.querySelector(".hero-project-stack");
      const heroCnapCard = heroProjectStack?.querySelector(".hero-stack-cnap");
      const canShowHeroCursorGuide = window.matchMedia("(hover: hover) and (pointer: fine)").matches
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (heroProjectStack && heroCnapCard && canShowHeroCursorGuide) {
        const guideCursor = document.createElement("span");
        guideCursor.className = "hero-stack-demo-cursor";
        guideCursor.setAttribute("aria-hidden", "true");
        guideCursor.innerHTML = `
          <svg viewBox="0 0 36 37" fill="none" role="presentation">
            <path d="M11.5444 12.9152C11.191 11.226 12.9993 9.91228 14.4965 10.7704L22.769 15.5114C24.3173 16.3988 24.0164 18.7159 22.2927 19.1783L19.6402 19.89C19.1574 20.0195 18.7406 20.3251 18.4719 20.7466L17.1287 22.8537C16.1649 24.3659 13.8518 23.9433 13.4846 22.1882L11.5444 12.9152Z" fill="#EE6F2D" />
            <path d="M12.1802 12.7822C11.9416 11.642 13.1629 10.7548 14.1735 11.334L22.4456 16.0755C23.4908 16.6745 23.2877 18.2385 22.1242 18.5506L19.4715 19.2624C18.832 19.4341 18.2802 19.839 17.9242 20.3974L16.581 22.5044C15.9304 23.525 14.3684 23.2399 14.1205 22.0553L12.1802 12.7822Z" stroke="#fff" stroke-width="1.3" />
          </svg>`;
        heroProjectStack.append(guideCursor);

        let guideRunId = 0;
        let guideRestartTimer = 0;
        let userHoverTimer = 0;
        let guideCompleted = false;
        const waitForGuide = (duration, runId) => new Promise((resolve) => {
          window.setTimeout(() => resolve(runId === guideRunId), duration);
        });
        const clearGuideVisuals = () => {
          guideCursor.classList.remove("is-visible", "is-hovering");
          heroCnapCard.classList.remove("is-demo-hover");
          heroProjectStack.classList.remove("is-demo-preview");
        };
        const stopHeroCursorGuide = (completed = false) => {
          guideRunId += 1;
          clearGuideVisuals();
          if (completed) guideCompleted = true;
        };
        const placeGuideCursor = (x, y) => {
          guideCursor.style.left = `${x}px`;
          guideCursor.style.top = `${y}px`;
        };
        const runHeroCursorGuide = async () => {
          if (guideCompleted || heroProjectStack.matches(":hover")) return;
          const runId = ++guideRunId;
          if (!(await waitForGuide(420, runId))) return;

          const stackRect = heroProjectStack.getBoundingClientRect();
          const cardRect = heroCnapCard.getBoundingClientRect();
          const targetX = cardRect.left - stackRect.left + cardRect.width * .55;
          const targetY = cardRect.top - stackRect.top + cardRect.height * .55;
          placeGuideCursor(Math.min(stackRect.width - 28, targetX + cardRect.width * .42), Math.min(stackRect.height - 24, targetY + 96));
          guideCursor.classList.add("is-visible");

          if (!(await waitForGuide(280, runId))) return;
          placeGuideCursor(targetX, targetY);

          if (!(await waitForGuide(740, runId))) return;
          heroProjectStack.classList.add("is-demo-preview");
          heroCnapCard.classList.add("is-demo-hover");
          guideCursor.classList.add("is-hovering");

          if (!(await waitForGuide(1350, runId))) return;
          stopHeroCursorGuide(true);
        };

        heroProjectStack.querySelectorAll(".hero-project-stack-card").forEach((card) => {
          card.addEventListener("pointerenter", () => {
            if (guideCompleted) return;
            stopHeroCursorGuide();
            window.clearTimeout(userHoverTimer);
            userHoverTimer = window.setTimeout(() => {
              guideCompleted = true;
            }, 650);
          });
          card.addEventListener("pointerleave", () => {
            window.clearTimeout(userHoverTimer);
            if (!guideCompleted && !heroProjectStack.matches(":hover")) {
              window.clearTimeout(guideRestartTimer);
              guideRestartTimer = window.setTimeout(runHeroCursorGuide, 520);
            }
          });
        });
        heroProjectStack.addEventListener("pointerleave", () => {
          if (guideCompleted) return;
          window.clearTimeout(guideRestartTimer);
          guideRestartTimer = window.setTimeout(runHeroCursorGuide, 520);
        });
        ["pointerdown", "focusin"].forEach((eventName) => {
          heroProjectStack.addEventListener(eventName, () => stopHeroCursorGuide(true), { once: true });
        });
        const heroGuideObserver = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= .55)) {
            heroGuideObserver.disconnect();
            if (heroProjectStack.matches(":hover")) return;
            runHeroCursorGuide();
          }
        }, { threshold: [.55] });
        heroGuideObserver.observe(heroProjectStack);
      }

      const projectCursor = document.querySelector(".project-hover-cursor");
      const projectCursorLabel = projectCursor?.querySelector(".project-hover-label");
      const projectArea = document.querySelector(".showcase-projects");
      const projectHotspots = document.querySelectorAll("[data-project-hotspot]");
      if (projectCursor && projectCursorLabel && projectArea && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const cursorMotion = {
          targetX: 0,
          targetY: 0,
          labelX: 0,
          labelY: 0,
          labelRotation: 0,
          initialized: false,
          visible: false,
          pressed: false,
          frame: 0,
        };

        const renderProjectCursor = () => {
          const labelEase = 0.18;
          const labelOffsetX = 24;
          const labelOffsetY = 15;
          const nextLabelX = cursorMotion.targetX + labelOffsetX;
          const nextLabelY = cursorMotion.targetY + labelOffsetY;
          const horizontalLag = nextLabelX - cursorMotion.labelX;
          cursorMotion.labelX += horizontalLag * labelEase;
          cursorMotion.labelY += (nextLabelY - cursorMotion.labelY) * labelEase;
          const rotationTarget = Math.max(-7, Math.min(7, horizontalLag * 0.18));
          cursorMotion.labelRotation += (rotationTarget - cursorMotion.labelRotation) * 0.16;
          const scale = cursorMotion.pressed ? 0.92 : 1;
          projectCursorLabel.style.transform = `translate3d(${cursorMotion.labelX}px, ${cursorMotion.labelY}px, 0) rotate(${cursorMotion.labelRotation}deg) scale(${scale})`;
          const unsettled = Math.abs(nextLabelX - cursorMotion.labelX) > 0.1
            || Math.abs(nextLabelY - cursorMotion.labelY) > 0.1
            || Math.abs(cursorMotion.labelRotation) > 0.1;
          if (cursorMotion.visible || unsettled) cursorMotion.frame = requestAnimationFrame(renderProjectCursor);
          else cursorMotion.frame = 0;
        };

        const startProjectCursorMotion = () => {
          if (!cursorMotion.frame) cursorMotion.frame = requestAnimationFrame(renderProjectCursor);
        };

        const updateProjectPointer = (event) => {
          const bounds = projectArea.getBoundingClientRect();
          projectArea.style.setProperty("--project-glow-x", `${event.clientX - bounds.left}px`);
          projectArea.style.setProperty("--project-glow-y", `${event.clientY - bounds.top}px`);
          cursorMotion.targetX = event.clientX;
          cursorMotion.targetY = event.clientY;
          if (!cursorMotion.initialized) {
            cursorMotion.labelX = event.clientX + 24;
            cursorMotion.labelY = event.clientY + 15;
            cursorMotion.initialized = true;
          }
          startProjectCursorMotion();
        };
        let activeProjectHotspot = null;
        const getProjectHotspot = (target) => target instanceof Element
          ? target.closest("[data-project-hotspot]")
          : null;
        const hideProjectCursor = () => {
          activeProjectHotspot = null;
          cursorMotion.visible = false;
          cursorMotion.pressed = false;
          projectArea.classList.remove("project-glow-active");
          projectCursor.classList.remove("visible");
        };
        const showProjectCursor = (event, hotspot) => {
          if (!hotspot) {
            hideProjectCursor();
            return;
          }
          activeProjectHotspot = hotspot;
          updateProjectPointer(event);
          cursorMotion.visible = true;
          projectArea.classList.add("project-glow-active");
          projectCursor.classList.add("visible");
        };

        /* Delegate from the whole showcase section so the custom pointer also
           works over each project's copy column, not only its image. */
        projectArea.addEventListener("pointermove", (event) => {
          showProjectCursor(event, getProjectHotspot(event.target));
        });
        projectArea.addEventListener("pointerleave", hideProjectCursor);
        projectArea.addEventListener("pointerdown", (event) => {
          if (getProjectHotspot(event.target)) {
            cursorMotion.pressed = true;
            startProjectCursorMotion();
          }
        });
        projectArea.addEventListener("pointerup", () => {
          cursorMotion.pressed = false;
          startProjectCursorMotion();
        });
      }

      const heroCoverflow = document.querySelector("[data-hero-coverflow]");
      if (heroCoverflow) {
        const heroCards = [...heroCoverflow.querySelectorAll(".hero-coverflow-card:not(.is-hero-placeholder)")];
        const heroPlaceholder = heroCoverflow.querySelector(".is-hero-placeholder");
        const heroProgressFills = heroCards.map((card) => card.querySelector(".hero-coverflow-progress > i"));
        const previousHeroControl = heroCoverflow.querySelector("[data-hero-previous]");
        const nextHeroControl = heroCoverflow.querySelector("[data-hero-next]");
        const desktopHeroSlots = [
          { left: "0%", offset: "0%", scale: "1", rotate: "0deg" },
          { left: "28%", offset: "0%", scale: "1.25", rotate: "0deg" },
          { left: "56%", offset: "0%", scale: "1", rotate: "0deg" },
        ];
        const mobileHeroSlots = [
          { left: "-50%", offset: "0%", scale: ".9", rotate: "0deg" },
          { left: "50%", offset: "-50%", scale: "1", rotate: "0deg" },
          { left: "82%", offset: "0%", scale: ".9", rotate: "0deg" },
        ];
        const mobileHeroQuery = window.matchMedia("(max-width: 700px)");
        const getHeroSlots = () => mobileHeroQuery.matches ? mobileHeroSlots : desktopHeroSlots;
        const HERO_AUTOPLAY_DURATION = 4000;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let activeCard = 0;
        let pointerStartX = 0;
        let pointerDeltaX = 0;
        let isDragging = false;
        let isAnimating = false;
        let blockClick = false;
        let heroAutoplayTimer = 0;
        let heroProgressFrame = 0;
        let heroInteractionPaused = false;
        let heroHoveredCard = null;

        const stopHeroAutoplay = (resetProgress = true) => {
          window.clearTimeout(heroAutoplayTimer);
          window.cancelAnimationFrame(heroProgressFrame);
          if (!resetProgress) {
            heroProgressFills.forEach((fill) => {
              if (!fill) return;
              const trackWidth = fill.parentElement?.getBoundingClientRect().width || 0;
              const renderedWidth = parseFloat(window.getComputedStyle(fill).width) || 0;
              if (trackWidth > 0) {
                fill.style.transition = "none";
                fill.style.width = `${Math.min(100, Math.max(0, (renderedWidth / trackWidth) * 100))}%`;
              }
            });
            return;
          }
          heroProgressFills.forEach((fill) => {
            if (!fill) return;
            fill.style.transition = "none";
            fill.style.width = "0%";
          });
        };

        const resetHeroAutoplay = (preserveProgress = false) => {
          stopHeroAutoplay(!preserveProgress);
          if (reducedMotion || heroInteractionPaused || document.hidden) return;
          const activeFill = heroCards.find((card) => card.classList.contains("is-hero-active"))?.querySelector(".hero-coverflow-progress > i");
          if (!activeFill) return;
          const currentProgress = Math.min(100, Math.max(0, parseFloat(activeFill.style.width) || 0));
          const remainingDuration = Math.max(240, HERO_AUTOPLAY_DURATION * (1 - currentProgress / 100));
          heroProgressFrame = window.requestAnimationFrame(() => {
            activeFill.style.transition = `width ${remainingDuration}ms linear`;
            activeFill.style.width = "100%";
            heroAutoplayTimer = window.setTimeout(() => animateHeroStep(-1), remainingDuration);
          });
        };

        const renderHeroCoverflow = (delta = 0, instant = false) => {
          const heroSlots = getHeroSlots();
          heroCards.forEach((card, index) => {
            const slot = heroSlots[(index - activeCard + heroCards.length) % heroCards.length];
            card.style.left = slot.left;
            card.style.zIndex = String(slot === heroSlots[1] ? 2 : 1);
            card.style.transitionDuration = instant ? "0ms" : "500ms";
            card.style.transform = `translateX(calc(${slot.offset} + ${delta}px)) scale(${slot.scaleX || slot.scale}, ${slot.scaleY || slot.scale}) rotate(${slot.rotate})`;
            card.classList.toggle("is-hero-active", slot === heroSlots[1]);
            card.classList.toggle("is-hero-muted", slot !== heroSlots[1]);
          });
          if (heroPlaceholder) {
            heroPlaceholder.style.left = mobileHeroQuery.matches ? "96%" : "84%";
            heroPlaceholder.style.zIndex = "1";
            heroPlaceholder.style.transitionDuration = instant ? "0ms" : "500ms";
            heroPlaceholder.style.transform = `translateX(${delta}px)`;
            heroPlaceholder.classList.remove("is-hero-active");
            heroPlaceholder.classList.add("is-hero-muted");
          }
        };

        const animateHeroStep = (direction) => {
          if (isAnimating) return;
          stopHeroAutoplay();
          isAnimating = true;
          const heroSlots = getHeroSlots();
          const oldActive = activeCard;
          const cardSlots = heroCards.map((_, index) => (index - oldActive + heroCards.length) % heroCards.length);
          heroCards.forEach((card, index) => {
            const currentSlot = cardSlots[index];
            const exitsLeft = direction < 0 && currentSlot === 0;
            const exitsRight = direction > 0 && currentSlot === heroSlots.length - 1;
            const nextSlot = exitsLeft ? -1 : exitsRight ? heroSlots.length : currentSlot + direction;
            const target = nextSlot < 0
              ? { left: "-100%", offset: "-100%", scale: "1", rotate: "0deg" }
              : nextSlot >= heroSlots.length
                ? { left: "100%", offset: "0%", scale: "1", rotate: "0deg" }
                : heroSlots[nextSlot];
            card.style.zIndex = String(exitsLeft || exitsRight ? 0 : nextSlot === 1 ? 2 : 1);
            card.style.transitionDuration = "500ms";
            card.style.left = target.left;
            card.style.transform = `translateX(calc(${target.offset} + 0px)) scale(${target.scaleX || target.scale}, ${target.scaleY || target.scale}) rotate(${target.rotate})`;
            card.classList.toggle("is-hero-active", nextSlot === 1);
            card.classList.toggle("is-hero-muted", nextSlot !== 1);
          });
          window.setTimeout(() => {
            activeCard = (oldActive + (direction < 0 ? 1 : -1) + heroCards.length) % heroCards.length;
            renderHeroCoverflow(0, true);
            isAnimating = false;
            resetHeroAutoplay();
          }, 520);
        };

        const finishHeroDrag = () => {
          if (!isDragging) return;
          isDragging = false;
          heroCoverflow.classList.remove("is-dragging");
          if (Math.abs(pointerDeltaX) > 36) {
            animateHeroStep(pointerDeltaX < 0 ? -1 : 1);
            blockClick = true;
          } else {
            renderHeroCoverflow();
            resetHeroAutoplay();
          }
          pointerDeltaX = 0;
        };

        renderHeroCoverflow(0, true);
        resetHeroAutoplay();
        mobileHeroQuery.addEventListener("change", () => renderHeroCoverflow(0, true));
        heroCoverflow.addEventListener("pointerdown", (event) => {
          if (isAnimating) return;
          if (event.pointerType === "mouse" && event.button !== 0) return;
          if (event.target.closest?.(".hero-coverflow-caption")) return;
          stopHeroAutoplay();
          isDragging = true;
          pointerStartX = event.clientX;
          pointerDeltaX = 0;
          heroCoverflow.classList.add("is-dragging");
          heroCoverflow.setPointerCapture?.(event.pointerId);
        });
        heroCoverflow.addEventListener("pointermove", (event) => {
          if (!isDragging) return;
          pointerDeltaX = (event.clientX - pointerStartX) * 1.15;
          if (Math.abs(pointerDeltaX) > 6) event.preventDefault();
          renderHeroCoverflow(pointerDeltaX, true);
        });
        heroCoverflow.addEventListener("pointerup", finishHeroDrag);
        heroCoverflow.addEventListener("pointercancel", finishHeroDrag);
        // Only hovering the currently featured card pauses autoplay. The gaps,
        // placeholder and arrow controls remain transparent to the timer.
        heroCards.forEach((card) => {
          card.addEventListener("pointerenter", () => {
            if (!card.classList.contains("is-hero-active")) return;
            heroHoveredCard = card;
            heroInteractionPaused = true;
            stopHeroAutoplay(false);
          });
          card.addEventListener("pointerleave", () => {
            if (heroHoveredCard !== card) return;
            heroHoveredCard = null;
            heroInteractionPaused = false;
            if (!isDragging) resetHeroAutoplay(true);
          });
        });
        heroCoverflow.addEventListener("focusin", () => {
          heroInteractionPaused = true;
          stopHeroAutoplay();
        });
        heroCoverflow.addEventListener("focusout", (event) => {
          if (event.relatedTarget && heroCoverflow.contains(event.relatedTarget)) return;
          heroInteractionPaused = false;
          resetHeroAutoplay();
        });
        [previousHeroControl, nextHeroControl].forEach((control) => {
          if (!control) return;
          control.addEventListener("pointerdown", (event) => {
            event.stopPropagation();
            stopHeroAutoplay();
          });
        });
        previousHeroControl?.addEventListener("click", (event) => {
          event.preventDefault();
          animateHeroStep(1);
        });
        nextHeroControl?.addEventListener("click", (event) => {
          event.preventDefault();
          animateHeroStep(-1);
        });
        heroCards.forEach((card) => card.addEventListener("click", (event) => {
          if (blockClick) {
            event.preventDefault();
            blockClick = false;
            return;
          }
          // The image area remains a drag surface; use the caption text or
          // arrow as the explicit navigation target.
          if (event.detail > 0 && !event.target.closest?.(".hero-coverflow-caption")) {
            event.preventDefault();
          }
        }));
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) stopHeroAutoplay(false);
          else resetHeroAutoplay(true);
        });
      }
