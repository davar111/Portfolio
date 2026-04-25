export const initHeroAlignment = () => {
  const root = document.documentElement;
  const workLink = document.querySelector(".nav-links a");
  const cta = document.querySelector(".nav-cta");

  if (!workLink || !cta) return () => {};

  let frame = 0;

  const update = () => {
    frame = 0;

    const workRect = workLink.getBoundingClientRect();
    const ctaRect = cta.getBoundingClientRect();

    if (!workRect.width || !ctaRect.width) return;

    root.style.setProperty("--hero-project-left", `${workRect.left}px`);
    root.style.setProperty("--hero-project-right", `${ctaRect.right}px`);
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
