export const initCursor = ({ gsap, isTouch }) => {
  const cur = document.getElementById("cur");
  const ring = document.getElementById("cur-ring");
  if (!cur || !ring || isTouch) {
    return;
  }

  window.addEventListener("mousemove", (event) => {
    gsap.to(cur, { x: event.clientX, y: event.clientY, duration: 0.08 });
    gsap.to(ring, {
      x: event.clientX,
      y: event.clientY,
      duration: 0.38,
      ease: "power2.out",
    });
  });

  document.querySelectorAll("a, button").forEach((element) => {
    element.addEventListener("mouseenter", () => {
      gsap.to(ring, { scale: 2.4, opacity: 0.3, duration: 0.3 });
    });
    element.addEventListener("mouseleave", () => {
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 });
    });
  });
};
