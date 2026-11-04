document.addEventListener("DOMContentLoaded", () => {
  const pad = (n) => String(n).padStart(2, "0");
  const hasSwiper = typeof Swiper !== "undefined";

  /* ---------- Hero slider ---------- */
  if (hasSwiper) {
    const heroCurrent = document.querySelector(".hero-current");
    const heroTotal = document.querySelector(".hero-total");

    new Swiper(".hero-swiper", {
      effect: "fade",
      fadeEffect: { crossFade: true },
      speed: 1000,
      loop: true,
      autoHeight: true,
      autoplay: { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: ".hero-pagination", clickable: true },
      navigation: { nextEl: ".hero-next", prevEl: ".hero-prev" },
      keyboard: { enabled: true },
      on: {
        init() {
          if (heroTotal) heroTotal.textContent = pad(document.querySelectorAll(".hero-slide").length);
        },
        slideChange(swiper) {
          if (heroCurrent) heroCurrent.textContent = pad(swiper.realIndex + 1);
        },
      },
    });

    /* ---------- Programs slider ---------- */
    new Swiper(".programs-swiper", {
      slidesPerView: 1,
      spaceBetween: 20,
      speed: 700,
      grabCursor: true,
      autoplay: { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: ".programs-pagination", clickable: true },
      navigation: { nextEl: ".prog-next", prevEl: ".prog-prev" },
      breakpoints: {
        576: { slidesPerView: 2, spaceBetween: 24 },
        992: { slidesPerView: 3, spaceBetween: 24 },
        1200: { slidesPerView: 4, spaceBetween: 24 },
      },
    });
  }

  /* ---------- Sticky header shadow + back to top ---------- */
  const header = document.getElementById("siteHeader");
  const backToTop = document.getElementById("backToTop");

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    backToTop.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Mobile navigation ---------- */
  const nav = document.getElementById("mainNav");
  const toggle = document.getElementById("navToggle");
  const close = document.getElementById("navClose");
  const overlay = document.getElementById("navOverlay");
  const mobileQuery = window.matchMedia("(max-width: 1199.98px)");

  const setNav = (open) => {
    nav.classList.toggle("open", open);
    overlay.classList.toggle("show", open);
    toggle.setAttribute("aria-expanded", open);
    document.body.classList.toggle("nav-locked", open);
  };

  toggle.addEventListener("click", () => setNav(true));
  close.addEventListener("click", () => setNav(false));
  overlay.addEventListener("click", () => setNav(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setNav(false));

  // dropdowns become accordions on mobile
  document.querySelectorAll(".has-dropdown > a").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (!mobileQuery.matches) return;
      e.preventDefault();
      link.parentElement.classList.toggle("open");
    });
  });

  // close the drawer after choosing a link
  nav.querySelectorAll(".dropdown a, .nav-item:not(.has-dropdown) > a, .nav-cta-mobile").forEach((link) => {
    link.addEventListener("click", () => mobileQuery.matches && setNav(false));
  });

  /* ---------- Active nav link on scroll ---------- */
  // only links that point at a real section (skip plain "#" placeholders)
  const navLinks = [...document.querySelectorAll(".nav-list > .nav-item > a[href^='#']")]
    .filter((link) => link.getAttribute("href").length > 1);
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) =>
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => spy.observe(section));
  }

  /* ---------- Count-up numbers ----------
     Final value is already in the HTML; JS only animates up to it.
     Change the number in data-count to update a stat. */
  const formatCount = (value, el) => {
    const short = el.dataset.short === "true";
    let text;
    const trim = (n) => n.toFixed(1).replace(/\.0$/, ""); // 5.0 -> 5, 2.4 stays
    if (short && value >= 1e6) {
      text = trim(value / 1e6) + "M";
    } else if (short && value >= 1e3) {
      text = trim(value / 1e3) + "K";
    } else {
      text = Math.round(value).toLocaleString("en-US");
    }
    return text + (el.dataset.suffix || "");
  };

  const runCounter = (el) => {
    const target = Number(el.dataset.count) || 0;
    const duration = 2000;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCount(target * eased, el);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatCount(target, el);
    };
    requestAnimationFrame(tick);
  };

  const counters = [...document.querySelectorAll(".counter")];
  const startCounter = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = "true";
    runCounter(el);
    const item = el.closest(".impact-item");
    if (item) item.classList.add("is-visible"); // draws the ring
  };

  if ("IntersectionObserver" in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          startCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  // fallback: anything already on screen at load starts straight away
  counters.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) startCounter(el);
  });

  /* ---------- Background video (trusted band) ----------
     Autoplays muted + looped. Users who prefer reduced motion just see the poster image. */
  document.querySelectorAll(".trusted-video").forEach((video) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }
    video.muted = true; // required for autoplay in all browsers
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  });

  /* ---------- Chip filter + search (programmes and centres pages) ----------
     Chips show one group at a time. The search box narrows the table rows. */
  document.querySelectorAll("[data-filter-scope]").forEach((scope) => {
    const chips = [...scope.querySelectorAll(".filter-chip")];
    const groups = [...scope.querySelectorAll("[data-filter-item]")];
    const input = scope.querySelector("[data-search-input]");
    const empty = scope.querySelector("[data-search-empty]");
    let current = "all";

    const apply = () => {
      const term = input ? input.value.trim().toLowerCase() : "";
      let anyVisible = false;
      groups.forEach((group) => {
        let show = current === "all" || group.dataset.filterItem === current;
        const rows = [...group.querySelectorAll("[data-search-row]")];
        if (rows.length) {
          let matches = 0;
          rows.forEach((row) => {
            const hit = row.textContent.toLowerCase().includes(term);
            row.hidden = !hit;
            if (hit) matches += 1;
          });
          if (!matches) show = false;
        }
        group.hidden = !show;
        if (show) anyVisible = true;
      });
      if (empty) empty.hidden = anyVisible;
    };

    chips.forEach((chip) => {
      chip.setAttribute("aria-pressed", chip.classList.contains("is-active"));
      chip.addEventListener("click", () => {
        current = chip.dataset.filter;
        chips.forEach((c) => {
          c.classList.toggle("is-active", c === chip);
          c.setAttribute("aria-pressed", c === chip);
        });
        apply();
      });
    });
    if (input) input.addEventListener("input", apply);
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});
