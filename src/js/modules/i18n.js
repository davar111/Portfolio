const STORAGE_KEY = "portfolio_lang";
const DEFAULT_LANG = "ru";
const SUPPORTED_LANGS = new Set(["ru", "en"]);

const DICTIONARY = {
  ru: {
    "meta.title": "David Ryazanov - Веб-разработчик",
    "nav.work": "Работы",
    "nav.about": "Обо мне",
    "nav.contact": "Контакты",
    "nav.inquiries": "Запросы",
    "mobile.inquiries": "Запросы",
    "menu.open": "Меню",
    "menu.close": "Закрыть",
    "hero.available": "Доступен для проектов",
    "hero.roleHtml": "Дизайнер и креативный разработчик &mdash; про качество и детали",
    "about.label": "Обо мне",
    "about.headlineHtml": "Дизайн, который помогает продукту",
    "about.acc.web.title": "Веб-разработка",
    "about.acc.web.body":
      "Сайты под ключ: от концепта до продакшена - чистая реализация и продуманные состояния",
    "about.acc.motion.title": "Анимация и интерактив",
    "about.acc.motion.body":
      "GSAP, WebGL, анимации на скролле - когда нужно добавить динамики и вовлечения",
    "about.acc.layout.title": "Компоновка сайта",
    "about.acc.layout.body":
      "Сетки, типографика, иерархия - чтобы все держалось на структуре",
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
    "nav.inquiries": "Inquiries",
    "mobile.inquiries": "Inquiries",
    "menu.open": "Menu",
    "menu.close": "Close",
    "hero.available": "Available for projects",
    "hero.roleHtml": "Designer &amp; Creative Developer focused on craft",
    "about.label": "About",
    "about.headlineHtml": "Design that supports the product",
    "about.acc.web.title": "Web development",
    "about.acc.web.body":
      "Websites end-to-end: from concept to production - clean implementation and well-thought-out states",
    "about.acc.motion.title": "Animation & interactivity",
    "about.acc.motion.body":
      "GSAP, WebGL, and scroll-based animation - when you need more motion and engagement",
    "about.acc.layout.title": "Layout & structure",
    "about.acc.layout.body":
      "Grids, typography, hierarchy - to keep everything consistent and structured",
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
