export const initClock = (targetId, options = {}) => {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  const translate = typeof options.t === "function" ? options.t : null;
  const getLanguage = typeof options.getLanguage === "function" ? options.getLanguage : null;
  const getRegionLabel = () => (translate ? translate("clock.region") : "FAR EAST");

  const updateTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = String(now.getMinutes()).padStart(2, "0");
    const isRu = getLanguage ? getLanguage() === "ru" : false;
    const timePart = isRu
      ? `${String(hour).padStart(2, "0")}:${minute}`
      : `${String(hour % 12 || 12).padStart(2, "0")}:${minute} ${hour >= 12 ? "PM" : "AM"}`;

    target.textContent = `${timePart} \u00B7 ${getRegionLabel()}`;
  };

  updateTime();
  window.setInterval(updateTime, 1000);

  if (typeof options.onLanguageChange === "function") {
    options.onLanguageChange(() => {
      updateTime();
    });
  }
};
