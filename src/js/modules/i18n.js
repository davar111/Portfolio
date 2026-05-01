const STORAGE_KEY = "portfolio_lang";
const DEFAULT_LANG = "ru";
const SUPPORTED_LANGS = new Set(["ru", "en"]);

const DICTIONARY = {
  ru: {
    "meta.title": "David Ryazanov - Веб-разработчик",
    "nav.work": "Работы",
    "nav.about": "Обо мне",
    "nav.contact": "Контакты",
    "nav.inquiries": "Связаться",
    "mobile.inquiries": "Связаться",
    "menu.open": "Меню",
    "menu.close": "Закрыть",
    "hero.kicker": "Дизайнер и creative developer, который соединяет эстетику, motion и удобство в digital-опыте",
    "hero.titleName": "David Ryazanov",
    "hero.titleOffer": "Figma / AE / Webflow / Codex",
    "hero.ctaWork": "Смотреть работы",
    "hero.ctaContact": "Связаться",
    "hero.roleHtml": "Figma / AE / Webflow / Codex",
    "about.label": "Обо мне",
    "about.headlineHtml": "Дизайн, motion и<br>структура для digital-продуктов",
    "about.acc.web.title": "WEB DESIGN & BUILD",
    "about.acc.web.body":
      "От визуальной концепции до рабочего сайта - с помощью Webflow, AI-assisted кода и адаптивной структуры.",
    "about.acc.motion.title": "ANIMATION & INTERACTIVITY",
    "about.acc.motion.body":
      "GSAP, WebGL и scroll-анимации для сайтов, которые ощущаются живее и вовлекают сильнее.",
    "about.acc.layout.title": "LAYOUT & STRUCTURE",
    "about.acc.layout.body":
      "Сетки, типографика и визуальная иерархия, чтобы интерфейс был понятным, цельным и удобным.",
    "work.label": "Избранные работы",
    "work.count": "04 Проекта",
    "work.placeholder": "Изображение",
    "work.projectName": "Название проекта",
    "work.tag.artDirection": "Арт-дирекшн",
    "work.tag.webDesign": "Веб-дизайн",
    "work.tag.development": "Разработка",
    "work.tag.branding": "Брендинг",
    "work.tag.identity": "Айдентика",
    "work.tag.motion": "Моушн",
    "contact.title": "Давайте работать вместе",
    "clock.region": "ДАЛЬНИЙ ВОСТОК",
  },
  en: {
    "meta.title": "David Ryazanov - Web Developer",
    "nav.work": "Work",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.inquiries": "Let's talk",
    "mobile.inquiries": "Let's talk",
    "menu.open": "Menu",
    "menu.close": "Close",
    "hero.kicker": "Creative developer blending aesthetics, motion, and usability into digital experiences",
    "hero.titleName": "David Ryazanov",
    "hero.titleOffer": "Figma / AE / Webflow / Codex",
    "hero.ctaWork": "View work",
    "hero.ctaContact": "Contact",
    "hero.roleHtml": "Figma / AE / Webflow / Codex",
    "about.label": "About",
    "about.headlineHtml": "Design, motion, and<br>structure for digital products",
    "about.acc.web.title": "WEB DESIGN & BUILD",
    "about.acc.web.body":
      "From concept to a working website using Webflow, AI-assisted code, and responsive structure.",
    "about.acc.motion.title": "ANIMATION & INTERACTIVITY",
    "about.acc.motion.body":
      "GSAP, WebGL, and scroll-based interactions for websites that feel more dynamic and engaging.",
    "about.acc.layout.title": "LAYOUT & STRUCTURE",
    "about.acc.layout.body":
      "Grids, typography, and visual hierarchy to keep interfaces clear, consistent, and easy to navigate.",
    "work.label": "Selected Work",
    "work.count": "04 Projects",
    "work.placeholder": "Image",
    "work.projectName": "Project Name",
    "work.tag.artDirection": "Art Direction",
    "work.tag.webDesign": "Web Design",
    "work.tag.development": "Development",
    "work.tag.branding": "Branding",
    "work.tag.identity": "Identity",
    "work.tag.motion": "Motion",
    "contact.title": "Let's work together",
    "clock.region": "FAR EAST",
  },
};

let currentLang = null;
const listeners = new Set();

const isSupportedLang = (lang) => SUPPORTED_LANGS.has(lang);

const readStoredLang = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isSupportedLang(stored) ? stored : null;
  } catch {
    return null;
  }
};

const persistLang = (lang) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
};

const updateSwitcherState = (lang) => {
  document.querySelectorAll(".nav-lang-btn").forEach((button) => {
    const isActive = button.dataset.lang === lang;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
};

const applyText = (lang) => {
  const dict = DICTIONARY[lang] || DICTIONARY[DEFAULT_LANG];

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const value = dict[key];
    if (typeof value !== "string") return;

    element.textContent = value;
    if ("orig" in element.dataset) {
      element.dataset.orig = value;
    }
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.dataset.i18nHtml;
    const value = dict[key];
    if (typeof value !== "string") return;
    element.innerHTML = value;
  });

  if (typeof dict["meta.title"] === "string") {
    document.title = dict["meta.title"];
  }
};

const notify = (lang) => {
  listeners.forEach((callback) => {
    try {
      callback(lang);
    } catch {}
  });

  document.dispatchEvent(new CustomEvent("site:language-change", { detail: { lang } }));
};

const setLanguage = (nextLang) => {
  if (!isSupportedLang(nextLang) || nextLang === currentLang) return;

  currentLang = nextLang;
  document.documentElement.lang = currentLang;
  document.documentElement.dataset.lang = currentLang;
  persistLang(currentLang);
  applyText(currentLang);
  updateSwitcherState(currentLang);
  notify(currentLang);
};

const onLanguageChange = (callback) => {
  if (typeof callback !== "function") return () => {};
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const t = (key, lang = currentLang || DEFAULT_LANG) => {
  const dict = DICTIONARY[lang] || DICTIONARY[DEFAULT_LANG];
  return dict[key] || key;
};

const bindLanguageButtons = () => {
  document.querySelectorAll(".nav-lang-btn").forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.lang);
    });
  });
};

export const initI18n = () => {
  bindLanguageButtons();
  setLanguage(readStoredLang() || DEFAULT_LANG);

  return {
    getLanguage: () => currentLang || DEFAULT_LANG,
    onLanguageChange,
    setLanguage,
    t,
  };
};
