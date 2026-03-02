const STATIC_PROJECTS = [
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
];

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

export const initBehancePreview = async () => {
  const cards = Array.from(document.querySelectorAll(".work-grid .work-item"));
  if (cards.length === 0) return;

  STATIC_PROJECTS.forEach((project, index) => {
    const card = cards[index];
    if (!card) return;
    applyProjectToCard(card, project, index);
  });
};
