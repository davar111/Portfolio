import { initLenis } from "./modules/lenis.js";
import { initClock } from "./modules/clock.js";
import { initCursor } from "./modules/cursor.js";
import { initScramble } from "./modules/scramble.js";
import { initPreloader } from "./modules/preloader.js";
import { initHeroProjects } from "./modules/hero-projects.js";
import { initHeroAlignment } from "./modules/hero-align.js";
import { initEntrances, initScrollReveal, prepareHeroEntrances } from "./modules/scroll-reveal.js";
import { initAccordion } from "./modules/accordion.js";
import { initBehancePreview } from "./modules/behance-preview.js";
import { initMobileMenu } from "./modules/mobile-menu.js";
import { initI18n } from "./modules/i18n.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

const isTouch = "ontouchstart" in window;
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canUseMotion = Boolean(gsap && ScrollTrigger);

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

if (!canUseMotion) {
  document.documentElement.classList.add("motion-disabled");
}

const lenis = canUseMotion
  ? initLenis({
      gsap,
      ScrollTrigger,
      Lenis: window.Lenis,
    })
  : null;

const nav = document.getElementById("nav");
if (lenis) {
  lenis.on("scroll", ({ scroll }) => {
    nav.classList.toggle("scrolled", scroll > 40);
  });
} else {
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  });
}

const i18n = initI18n();

initClock("nav-time", {
  t: i18n.t,
  getLanguage: i18n.getLanguage,
  onLanguageChange: i18n.onLanguageChange,
});
initHeroAlignment();
initHeroProjects({ gsap, prefersReduced });
if (canUseMotion) {
  initCursor({ gsap, isTouch });
  initScramble({ isTouch, prefersReduced });
  prepareHeroEntrances({ gsap });
  initPreloader({
    gsap,
    onComplete: () => {
      initEntrances({ gsap });
      initScrollReveal({ gsap, ScrollTrigger });
      ScrollTrigger.refresh();
    },
  });
  i18n.onLanguageChange(() => {
    ScrollTrigger.refresh();
  });
} else {
  initPreloader({ prefersReduced: true });
}
initAccordion();
initMobileMenu({
  t: i18n.t,
  onLanguageChange: i18n.onLanguageChange,
});

// animated grain overlay across the full page
(() => {
  if (prefersReduced) return;

  const canvas = document.createElement("canvas");
  canvas.id = "noise-canvas";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  const SCALE = 1.2;
  const FPS = 24;
  const FRAME_MS = 1000 / FPS;
  const ALPHA = 30;
  let width = 0;
  let height = 0;
  let imageData = null;
  let pixels = null;
  let lastFrame = 0;

  const resize = () => {
    width = Math.max(1, Math.ceil(window.innerWidth / SCALE));
    height = Math.max(1, Math.ceil(window.innerHeight / SCALE));
    canvas.width = width;
    canvas.height = height;
    imageData = ctx.createImageData(width, height);
    pixels = imageData.data;
  };

  const drawFrame = () => {
    if (!pixels) return;
    for (let i = 0; i < pixels.length; i += 4) {
      const value = (Math.random() * 256) | 0;
      pixels[i + 0] = value;
      pixels[i + 1] = value;
      pixels[i + 2] = value;
      pixels[i + 3] = ALPHA;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const tick = (now) => {
    window.requestAnimationFrame(tick);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    drawFrame();
  };

  resize();
  drawFrame();
  window.addEventListener("resize", resize);

  window.requestAnimationFrame(tick);
})();

if (canUseMotion) {
  ScrollTrigger.refresh();
}

initBehancePreview({
  getLanguage: i18n.getLanguage,
  onLanguageChange: i18n.onLanguageChange,
}).catch(() => {});
