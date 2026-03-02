export const initAccordion = () => {
  document.querySelectorAll(".acc-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".acc-item");
      const body = item.querySelector(".acc-body");
      const inner = item.querySelector(".acc-body-inner");
      const isOpen = item.classList.contains("open");

      document.querySelectorAll(".acc-item.open").forEach((openItem) => {
        if (openItem === item) {
          return;
        }
        openItem.classList.remove("open");
        openItem.querySelector(".acc-body").style.maxHeight = "0";
      });

      item.classList.toggle("open", !isOpen);
      body.style.maxHeight = isOpen ? "0" : `${inner.offsetHeight}px`;
    });
  });
};
