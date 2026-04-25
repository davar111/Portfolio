export const initPreloader = ({ gsap, prefersReduced, onComplete } = {}) => {
  const root = document.documentElement;
  const preloader = document.querySelector(".preloader");

  const finish = () => {
    root.classList.remove("is-loading");
    preloader?.remove();
    if (typeof onComplete === "function") {
      onComplete();
    }
  };

  if (!preloader || prefersReduced || !gsap) {
    finish();
    return null;
  }

  root.classList.add("is-loading");

  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: finish,
  });

  tl.set(".preloader-name", {
    "--preloader-fill": "0%",
  })
    .fromTo(
      ".preloader-name",
      {
        opacity: 0,
        y: 10,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: "power3.out",
      }
    )
    .to(
      ".preloader-name",
      {
        "--preloader-fill": "100%",
        duration: 1.45,
        ease: "power2.inOut",
      },
      0.12
    )
    .to(
      ".preloader-name",
      {
        y: -14,
        opacity: 0,
        duration: 0.55,
        ease: "power2.in",
      },
      "+=0.58"
    )
    .to(
      ".preloader-inner",
    {
        opacity: 0,
        y: -18,
        duration: 0.42,
        ease: "power2.in",
    },
      "-=0.24"
    )
    .to(preloader, {
      yPercent: -100,
      duration: 1.08,
      ease: "power4.inOut",
    }, "-=0.08");

  return tl;
};
