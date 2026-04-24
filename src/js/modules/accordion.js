export const initAccordion = () => {
  document.querySelectorAll(".acc-trigger").forEach((button, index) => {
    const item = button.closest(".acc-item");
    const body = item?.querySelector(".acc-body");
    if (!item || !body) return;

    const bodyId = body.id || `accordion-panel-${index + 1}`;
    body.id = bodyId;
    body.setAttribute("role", "region");
    body.setAttribute("aria-hidden", "true");
    button.setAttribute("aria-controls", bodyId);
    button.setAttribute("aria-expanded", "false");

    button.addEventListener("click", () => {
      const inner = item.querySelector(".acc-body-inner");
      const isOpen = item.classList.contains("open");
      if (!inner) return;

      document.querySelectorAll(".acc-item.open").forEach((openItem) => {
        if (openItem === item) {
          return;
        }
        openItem.classList.remove("open");
        const openButton = openItem.querySelector(".acc-trigger");
        const openBody = openItem.querySelector(".acc-body");
        openButton?.setAttribute("aria-expanded", "false");
        openBody?.setAttribute("aria-hidden", "true");
        if (openBody) openBody.style.maxHeight = "0";
      });

      item.classList.toggle("open", !isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
      body.setAttribute("aria-hidden", String(isOpen));
      body.style.maxHeight = isOpen ? "0" : `${inner.offsetHeight}px`;
    });
  });

  window.addEventListener("resize", () => {
    document.querySelectorAll(".acc-item.open").forEach((item) => {
      const body = item.querySelector(".acc-body");
      const inner = item.querySelector(".acc-body-inner");
      if (body && inner) body.style.maxHeight = `${inner.offsetHeight}px`;
    });
  });
};
