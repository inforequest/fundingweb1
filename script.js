document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile menu ---------- */
  const setMenu = (open) => {
    mobileMenu?.classList.toggle("open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu?.classList.contains("open")) {
      setMenu(false);
      menuButton?.focus();
    }
  });

  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Header shadow + mobile sticky CTA ---------- */
  const hero = document.querySelector(".hero");
  const applySection = document.getElementById("apply");
  const mobileCta = document.querySelector(".mobile-cta");
  let applyInView = false;

  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
    if (mobileCta && hero) {
      const pastHero = hero.getBoundingClientRect().bottom < 0;
      mobileCta.classList.toggle("is-visible", pastHero && !applyInView);
    }
  };

  if (applySection && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      applyInView = entry.isIntersecting;
      onScroll();
    }, { threshold: 0.05 }).observe(applySection);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link (scroll spy) ---------- */
  const navLinks = [...document.querySelectorAll(".desktop-nav a")];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((section) => spy.observe(section));
  }

  /* ---------- Repayment flex illustration ---------- */
  const range = document.getElementById("salesRange");
  const salesOut = document.getElementById("salesOutput");
  const repayOut = document.getElementById("repayOutput");
  const keepOut = document.getElementById("keepOutput");
  const repayBar = document.getElementById("repayBar");
  const EXAMPLE_RATE = 0.1;
  const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

  const updateDemo = () => {
    if (!range) return;
    const sales = Number(range.value);
    const repay = Math.round(sales * EXAMPLE_RATE);
    const min = Number(range.min);
    const max = Number(range.max);
    const pct = ((sales - min) / (max - min)) * 100;

    salesOut.textContent = gbp.format(sales);
    repayOut.textContent = gbp.format(repay);
    keepOut.textContent = gbp.format(sales - repay);
    range.style.setProperty("--fill", `${pct}%`);
    repayBar.style.width = `${Math.max(4, (repay / (max * EXAMPLE_RATE)) * 100)}%`;
  };

  range?.addEventListener("input", updateDemo);
  updateDemo();

  /* ---------- Application form ---------- */
  const form = document.getElementById("applicationForm");
  const status = form?.querySelector(".form-status");
  const submitButton = form?.querySelector('button[type="submit"]');

  const messages = {
    name: "Please enter your name.",
    business: "Please enter your business name.",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid UK phone number.",
    amount: "Please choose a funding range."
  };

  const validateField = (field) => {
    const wrapper = field.closest(".field");
    const error = wrapper?.querySelector(".field-error");
    if (field.name === "phone") field.value = field.value.replace(/[^\d+\s]/g, "");
    const valid = field.checkValidity();
    wrapper?.classList.toggle("has-error", !valid);
    field.setAttribute("aria-invalid", String(!valid));
    if (error) error.textContent = valid ? "" : (messages[field.name] || field.validationMessage);
    return valid;
  };

  form?.querySelectorAll("[required]").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".field")?.classList.contains("has-error")) validateField(field);
    });
  });

  const showStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle("is-error", isError);
    status.hidden = false;
    status.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  };

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fields = [...form.querySelectorAll("[required]")];
    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // honeypot filled – likely a bot
    delete data.website;

    const endpoint = form.dataset.endpoint;
    submitButton.disabled = true;
    submitButton.firstChild.textContent = "Sending… ";

    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...data, source: window.location.href, submittedAt: new Date().toISOString() })
        });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      }

      form.querySelectorAll("input, textarea, select, button").forEach((el) => { el.disabled = true; });
      submitButton.firstChild.textContent = "Request sent ";
      showStatus(`Thanks ${data.name.split(" ")[0]} — we’ve received your enquiry and a member of the team will be in touch shortly.`);
    } catch (error) {
      console.error(error);
      submitButton.disabled = false;
      submitButton.firstChild.textContent = "Request a call ";
      showStatus("Sorry, something went wrong sending your enquiry. Please try again in a moment.", true);
    }
  });

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  const revealItems = document.querySelectorAll(".benefit-card, .step, .stat, .flex-demo");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item, i) => {
      item.classList.add("reveal");
      item.style.transitionDelay = `${(i % 3) * 80}ms`;
      observer.observe(item);
    });
  }
});
