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

ScrollTrigger.refresh();

initBehancePreview().catch(() => {});
