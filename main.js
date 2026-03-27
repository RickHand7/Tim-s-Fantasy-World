/**
 * Tim's Fantasy World — main.js
 * ─────────────────────────────
 * 1. Parallax engine   — rAF-based, respects prefers-reduced-motion
 * 2. Scroll reveal     — IntersectionObserver + staggered delays
 * 3. Header state      — transparent → frosted on scroll
 * 4. Mobile sticky CTA — show/hide on scroll direction
 */

/* ─────────────────────────────────────────
   GUARD: prefers-reduced-motion
───────────────────────────────────────── */
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

/* ─────────────────────────────────────────
   1. PARALLAX ENGINE
   
   Each element with [data-parallax-speed] floats
   at a fraction of scroll speed. Positive speed
   = element moves up slower than page (classic 
   depth effect). Images given extra height in CSS
   so translateY never reveals empty edges.
───────────────────────────────────────── */
function initParallax() {
  if (prefersReducedMotion) return;

  const layers = Array.from(
    document.querySelectorAll('[data-parallax-speed]')
  ).map(el => ({
    el,
    speed: parseFloat(el.dataset.parallaxSpeed) || 0.1,
    // cache parent rect once; update on resize
    parentRect: el.parentElement.getBoundingClientRect(),
  }));

  if (!layers.length) return;

  let rafId = null;
  let scrollY = window.scrollY;
  let needsUpdate = true;

  function update() {
    rafId = null;

    layers.forEach(({ el, speed, parentRect }) => {
      const viewH = window.innerHeight;
      // Distance from viewport centre to element centre
      const elCentreY =
        parentRect.top + parentRect.height / 2 - scrollY;
      const distFromCentre = viewH / 2 - elCentreY;
      const offset = distFromCentre * speed;

      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
  }

  function onScroll() {
    scrollY = window.scrollY;
    if (!rafId) {
      rafId = requestAnimationFrame(update);
    }
  }

  function onResize() {
    // Recalculate parent rects after resize
    layers.forEach(layer => {
      layer.parentRect = layer.el.parentElement.getBoundingClientRect();
    });
    onScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  // Initial paint
  update();
}

/* ─────────────────────────────────────────
   2. SCROLL REVEAL
   
   Elements with .reveal fade up into place.
   data-delay (ms) staggers siblings.
───────────────────────────────────────── */
function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  if (prefersReducedMotion) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  // Apply stagger delays from data-delay attributes
  elements.forEach(el => {
    const delay = el.dataset.delay;
    if (delay) {
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    }
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────
   3. HEADER STATE
   
   Starts transparent (over dark hero).
   Gets .scrolled class (frosted glass) once
   user scrolls past ~80px.
───────────────────────────────────────── */
function initHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const THRESHOLD = 80;
  let rafId = null;

  function update() {
    rafId = null;
    header.classList.toggle('scrolled', window.scrollY > THRESHOLD);
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    },
    { passive: true }
  );

  update(); // run on load
}

/* ─────────────────────────────────────────
   4. MOBILE STICKY CTA
   
   Only visible on mobile (<= 900px).
   Hides when scrolling up or near top,
   shows when scrolling down.
───────────────────────────────────────── */
function initMobileCta() {
  const cta = document.getElementById('mobileCta');
  if (!cta) return;

  const mq = window.matchMedia('(max-width: 900px)');
  const NEAR_TOP = 260;
  const THRESHOLD = 8; // px before we register direction change
  let lastY = window.scrollY;
  let rafId = null;

  function setVisible(visible) {
    cta.classList.toggle('hidden', !visible);
  }

  function update() {
    rafId = null;
    if (!mq.matches) {
      setVisible(false);
      return;
    }

    const y = window.scrollY;
    const delta = y - lastY;

    if (y < NEAR_TOP) {
      setVisible(false);
    } else if (Math.abs(delta) >= THRESHOLD) {
      setVisible(delta > 0); // show when scrolling down
      lastY = y;
    }
  }

  function onScroll() {
    if (!rafId) rafId = requestAnimationFrame(update);
  }

  setVisible(false); // hidden by default
  window.addEventListener('scroll', onScroll, { passive: true });

  mq.addEventListener('change', () => {
    lastY = window.scrollY;
    update();
  });
}

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initHeader();
  initMobileCta();
  initParallax();
});