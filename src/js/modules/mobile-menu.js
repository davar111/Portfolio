export const initMobileMenu = () => {
  const button = document.querySelector(".nav-mobile-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!button || !menu) return;

  const setOpen = (next) => {
    document.body.classList.toggle("menu-open", next);
    button.setAttribute("aria-expanded", String(next));
    button.textContent = next ? "Close" : "Menu";
    menu.setAttribute("aria-hidden", String(!next));
  };

  setOpen(false);

  button.addEventListener("click", () => {
    const isOpen = document.body.classList.contains("menu-open");
    setOpen(!isOpen);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setOpen(false);
  });
};
