import { initLenis } from "./modules/lenis.js";
import { initClock } from "./modules/clock.js";
import { initCursor } from "./modules/cursor.js";
import { initScramble } from "./modules/scramble.js";
import { initHeroWebGL } from "./modules/hero-webgl.js";
import { initEntrances, initScrollReveal } from "./modules/scroll-reveal.js";
import { initAccordion } from "./modules/accordion.js";
import { initBehancePreview } from "./modules/behance-preview.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

if (!gsap || !ScrollTrigger) {
  throw new Error("GSAP and ScrollTrigger are required.");
}

gsap.registerPlugin(ScrollTrigger);

const isTouch = "ontouchstart" in window;
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const lenis = initLenis({
  gsap,
  ScrollTrigger,
  Lenis: window.Lenis,
});

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

initClock("nav-time");
initCursor({ gsap, isTouch });
initScramble({ isTouch, prefersReduced });
initHeroWebGL({ THREE: window.THREE, isTouch });
initEntrances({ gsap });
initScrollReveal({ gsap, ScrollTrigger });
initAccordion();

// twinkling dots in hero
(() => {
  const canvas = document.getElementById("dots-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let dots = [];

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function createDot() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      maxAlpha: Math.random() * 0.5 + 0.15,
      born: performance.now(),
      life: Math.random() * 4000 + 2000,
    };
  }

  for (let i = 0; i < 60; i += 1) {
    const d = createDot();
    d.born -= Math.random() * d.life;
    dots.push(d);
  }

  function draw(now) {
    window.requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    dots.forEach((d, i) => {
      const age = now - d.born;
      const progress = age / d.life;

      if (progress > 1) {
        dots[i] = createDot();
        dots[i].born = now;
        return;
      }

      const alpha =
        progress < 0.3
          ? (progress / 0.3) * d.maxAlpha
          : progress > 0.7
            ? ((1 - progress) / 0.3) * d.maxAlpha
            : d.maxAlpha;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });
  }

  window.requestAnimationFrame(draw);
})();

ScrollTrigger.refresh();

initBehancePreview().catch(() => {});
