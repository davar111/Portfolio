export const initHeroAlignment = () => {
  const root = document.documentElement;
  const heroContent = document.querySelector(".hero-content");
  const workLink = document.querySelector(".nav-links a");
  const cta = document.querySelector(".nav-cta");

  if (!heroContent || !workLink || !cta) return () => {};

  let frame = 0;

  const update = () => {
    frame = 0;

    const workRect = workLink.getBoundingClientRect();
    const ctaRect = cta.getBoundingClientRect();
    const heroRect = heroContent.getBoundingClientRect();

    if (!workRect.width || !ctaRect.width) return;

    root.style.setProperty("--hero-project-left", `${workRect.left - heroRect.left}px`);
    root.style.setProperty("--hero-project-right", `${ctaRect.right - heroRect.left}px`);
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };

  requestUpdate();
  window.addEventListener("resize", requestUpdate, { passive: true });

  if (document.fonts) {
    document.fonts.ready.then(requestUpdate);
  }

  document.addEventListener("site:language-change", requestUpdate);

  return requestUpdate;
};
