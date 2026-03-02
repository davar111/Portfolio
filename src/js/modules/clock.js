export const initClock = (targetId) => {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  const updateTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = String(now.getMinutes()).padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;

    target.textContent = `${String(hour12).padStart(2, "0")}:${minute} ${ampm} \u00B7 FAR EAST`;
  };

  updateTime();
  window.setInterval(updateTime, 1000);
};
