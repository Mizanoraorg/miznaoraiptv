/* Mizanora IPTV v6.2 — progressive UI upgrade layer (theme, menu, motion, FAQ).
 * Purely additive: every widget is optional and guarded, so the core player
 * and forms in site.js keep working unchanged. Respects prefers-reduced-motion. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- color theme (dark default, light toggle, persisted) ---------- */
  var themeBtn = $("themeToggle");
  function applyTheme(theme) {
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    if (themeBtn) themeBtn.textContent = theme === "light" ? "☀️" : "🌙";
  }
  try { applyTheme(localStorage.getItem("mz_theme") || "dark"); } catch { applyTheme("dark"); }
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem("mz_theme", next); } catch { /* private mode */ }
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = $("menuToggle");
  var nav = $("mainNav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "✕" : "☰";
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && nav.classList.contains("open")) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "☰";
      }
    });
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("open") && !nav.contains(event.target) && !menuBtn.contains(event.target)) {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.textContent = "☰";
      }
    });
  }

  /* ---------- scroll progress + header shadow + back-to-top ---------- */
  var bar = $("scrollProgress");
  var toTop = $("toTop");
  var header = document.querySelector("header");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      if (bar) bar.style.width = Math.min(100, Math.max(0, (window.scrollY / max) * 100)) + "%";
      if (header) header.classList.toggle("scrolled", window.scrollY > 12);
      if (toTop) toTop.hidden = window.scrollY < 520;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  /* ---------- scroll reveal (IntersectionObserver, staggered) ---------- */
  var revealables = document.querySelectorAll("[data-reveal]");
  if (reduced || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("revealed"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealables.forEach(function (el, index) {
      el.style.setProperty("--delay", (index % 6) * 60 + "ms");
      io.observe(el);
    });
  }

  /* ---------- animated counters in the CTA band ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = Number(el.getAttribute("data-count")) || 0;
    if (reduced) { el.textContent = String(target); return; }
    var start = performance.now();
    var duration = 1100;
    (function step(now) {
      var t = Math.min(1, (now - start) / duration);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
  if (counters.length) {
    if (!("IntersectionObserver" in window)) counters.forEach(animateCount);
    else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { animateCount(entry.target); cio.unobserve(entry.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- FAQ: keep one answer open at a time ---------- */
  var faqList = $("faqList");
  if (faqList) {
    faqList.addEventListener("toggle", function (event) {
      var item = event.target;
      if (item.tagName !== "DETAILS" || !item.open) return;
      faqList.querySelectorAll("details[open]").forEach(function (other) {
        if (other !== item) other.open = false;
      });
    }, true);
  }

  /* ---------- footer year ---------- */
  var year = $("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
