const STATIC_PROJECTS = {
  ru: [
    {
      title: "Lumo - онлайн-кинотеатр (мобильное приложение)",
      image: "./assets/images/lumo-card-cover.jpg",
      tags: ["UX/UI", "Мобильное приложение", "Продукт"],
      year: "2026",
      url: "https://www.behance.net/gallery/240437685/Lumo-Online-Cinema-(Mobile-App)",
    },
    {
      title: "AquaVelis - корпоративный сайт",
      image: "./assets/images/aquavelis-card-cover.png",
      tags: ["Веб-дизайн", "Корпоративный", "Разработка"],
      year: "2026",
      url: "https://www.behance.net/gallery/235920449/AquaVelis-Corporate-website",
    },
    {
      title: "DJI Matrice 30 - лендинг",
      image: "./assets/images/dji-matrice-30-cover.png",
      tags: ["Лендинг", "Веб-дизайн", "Моушн"],
      year: "2026",
      url: "https://www.behance.net/gallery/228574921/Dji-Matrice-30-Landing-page",
    },
    {
      title: "VoloCity - концепт продуктовой страницы",
      image: "./assets/images/volocity-cover.webp",
      tags: ["Продуктовая страница", "Концепт", "UI/UX"],
      year: "2026",
      url: "https://www.behance.net/gallery/231137669/VoloCity-Product-Page-Concept",
    },
  ],
  en: [
    {
      title: "Lumo - Online Cinema (Mobile App)",
      image: "./assets/images/lumo-card-cover.jpg",
      tags: ["UX/UI", "Mobile App", "Product"],
      year: "2026",
      url: "https://www.behance.net/gallery/240437685/Lumo-Online-Cinema-(Mobile-App)",
    },
    {
      title: "AquaVelis - Corporate Website",
      image: "./assets/images/aquavelis-card-cover.png",
      tags: ["Web Design", "Corporate", "Development"],
      year: "2026",
      url: "https://www.behance.net/gallery/235920449/AquaVelis-Corporate-website",
    },
    {
      title: "DJI Matrice 30 - Landing Page",
      image: "./assets/images/dji-matrice-30-cover.png",
      tags: ["Landing Page", "Web Design", "Motion"],
      year: "2026",
      url: "https://www.behance.net/gallery/228574921/Dji-Matrice-30-Landing-page",
    },
    {
      title: "VoloCity - Product Page Concept",
      image: "./assets/images/volocity-cover.webp",
      tags: ["Product Page", "Concept", "UI/UX"],
      year: "2026",
      url: "https://www.behance.net/gallery/231137669/VoloCity-Product-Page-Concept",
    },
  ],
};

const applyProjectToCard = (card, project, cardIndex) => {
  if (!card || !project) return;

  card.href = project.url || "#";
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const bg = card.querySelector(".work-item-bg");
  if (bg && project.image) {
    bg.style.background = `center / cover no-repeat url("${project.image}")`;
  }

  const placeholder = card.querySelector(".work-item-placeholder");
  if (placeholder) placeholder.style.display = "none";

  const num = card.querySelector(".work-item-num");
  if (num) {
    const indexValue = Number.isInteger(cardIndex) ? cardIndex + 1 : 1;
    num.textContent = String(indexValue).padStart(2, "0");
  }

  const year = card.querySelector(".work-item-year");
  if (year) year.textContent = project.year || "2026";

  const name = card.querySelector(".work-item-name");
  if (name) name.textContent = project.title || "Project";

  const tags = card.querySelector(".work-item-tags");
  if (tags) {
    tags.innerHTML = "";
    (project.tags || []).slice(0, 3).forEach((tag) => {
      const span = document.createElement("span");
      span.className = "work-tag";
      span.textContent = tag;
      tags.appendChild(span);
    });
  }
};

const resolveProjectsByLang = (lang) => STATIC_PROJECTS[lang] || STATIC_PROJECTS.ru;

export const initBehancePreview = async (options = {}) => {
  const cards = Array.from(document.querySelectorAll(".work-grid .work-item"));
  if (cards.length === 0) return;

  const getLanguage = typeof options.getLanguage === "function" ? options.getLanguage : () => "ru";
  const render = (lang) => {
    resolveProjectsByLang(lang).forEach((project, index) => {
      const card = cards[index];
      if (!card) return;
      applyProjectToCard(card, project, index);
    });
  };

  render(getLanguage());

  if (typeof options.onLanguageChange === "function") {
    options.onLanguageChange((lang) => {
      render(lang);
    });
  }
};
