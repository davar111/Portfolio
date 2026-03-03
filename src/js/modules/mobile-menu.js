export const initMobileMenu = (options = {}) => {
  const button = document.querySelector(".nav-mobile-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!button || !menu) return;

  const t = typeof options.t === "function" ? options.t : null;
  const getLabel = (isOpen) => {
    if (!t) return isOpen ? "Close" : "Menu";
    return t(isOpen ? "menu.close" : "menu.open");
  };

  const setOpen = (next) => {
    document.body.classList.toggle("menu-open", next);
    button.setAttribute("aria-expanded", String(next));
    button.textContent = getLabel(next);
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

  if (typeof options.onLanguageChange === "function") {
    options.onLanguageChange(() => {
      const isOpen = document.body.classList.contains("menu-open");
      button.textContent = getLabel(isOpen);
    });
  }
};
