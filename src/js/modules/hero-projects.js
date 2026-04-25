export const initHeroProjects = ({ gsap, prefersReduced } = {}) => {
  const preview = document.querySelector(".hero-project-preview");
  const images = Array.from(document.querySelectorAll(".hero-project-image"));
  if (!preview || images.length < 2 || preview.dataset.projectCycle === "ready") return;

  preview.dataset.projectCycle = "ready";

  let activeIndex = images.findIndex((image) => image.classList.contains("is-active"));
  if (activeIndex < 0) activeIndex = 0;
  preview.setAttribute("href", images[activeIndex].dataset.href || "#work");

  const showNext = () => {
    const previous = images[activeIndex];
    activeIndex = (activeIndex + 1) % images.length;
    const next = images[activeIndex];
    preview.setAttribute("href", next.dataset.href || "#work");

    if (gsap && !prefersReduced) {
      gsap.killTweensOf([previous, next]);
      gsap.set(next, { zIndex: 2, scale: 1.04, opacity: 0 });
      gsap.set(previous, { zIndex: 1 });
      gsap.to(next, {
        opacity: 1,
        scale: 1,
        duration: 0.85,
        ease: "power3.out",
        onStart: () => next.classList.add("is-active"),
      });
      gsap.to(previous, {
        opacity: 0,
        scale: 1.02,
        duration: 0.75,
        ease: "power2.out",
        onComplete: () => previous.classList.remove("is-active"),
      });
      return;
    }

    previous.classList.remove("is-active");
    next.classList.add("is-active");
  };

  window.setInterval(showNext, 7200);
};
