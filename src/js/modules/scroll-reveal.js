export const prepareHeroEntrances = ({ gsap }) => {
  gsap.set("nav", { opacity: 0 });
  gsap.set(".hero-kicker", { opacity: 0, x: -18 });
  gsap.set(".hero-project-preview", { opacity: 0, y: 18 });
  gsap.set(".hero-cross-line-x", { scaleX: 0 });
  gsap.set(".hero-cross-line-y", { scaleY: 0 });
  gsap.set(".hero-cross-dot", { opacity: 0, scale: 0.72 });
  gsap.set(".hero-tool", { opacity: 0, y: 14 });
};

export const initEntrances = ({ gsap }) => {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to("nav", {
    opacity: 1,
    duration: 0.6,
  }, 0.12)
    .to(".hero-kicker", {
      opacity: 1,
      x: 0,
      duration: 0.55,
      ease: "expo.out",
    }, 0.2)
    .to(".hero-cross-line-x", {
      scaleX: 1,
      duration: 0.85,
      ease: "power3.inOut",
    }, 0.18)
    .to(".hero-cross-line-y", {
      scaleY: 1,
      duration: 0.85,
      ease: "power3.inOut",
    }, 0.26)
    .to(".hero-cross-dot", {
      opacity: 1,
      scale: 1,
      duration: 0.38,
      ease: "power3.out",
    }, 0.64)
    .to(".hero-project-preview", {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "power3.out",
    }, 0.42)
    .to(".hero-tool", {
      opacity: 1,
      y: 0,
      duration: 0.44,
      stagger: 0.06,
      ease: "power3.out",
    }, 0.54);
};

export const initScrollReveal = ({ gsap, ScrollTrigger }) => {
  ScrollTrigger.batch(".sr", {
    onEnter: (batch) => {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.09,
      });
    },
    start: "top 89%",
  });

  gsap.from(".work-item", {
    scrollTrigger: { trigger: ".work-grid", start: "top 86%" },
    opacity: 0,
    y: 24,
    duration: 0.75,
    ease: "power3.out",
    stagger: 0.09,
  });

  let aboutFillTween = null;
  const setupAboutHeadlineFill = () => {
    const aboutHeadline = document.querySelector(".about-headline");
    if (!aboutHeadline) return;

    if (aboutFillTween) {
      if (aboutFillTween.scrollTrigger) {
        aboutFillTween.scrollTrigger.kill();
      }
      aboutFillTween.kill();
      aboutFillTween = null;
    }

    aboutHeadline.querySelectorAll(".about-fill-word").forEach((word) => {
      word.replaceWith(document.createTextNode(word.textContent || ""));
    });
    aboutHeadline.normalize();

    const textNodes = [];
    const walker = document.createTreeWalker(aboutHeadline, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.nodeValue && node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((token) => {
        if (!token) return;
        if (/^\s+$/.test(token)) {
          fragment.appendChild(document.createTextNode(token));
          return;
        }
        const word = document.createElement("span");
        word.className = "about-fill-word";
        word.textContent = token;
        fragment.appendChild(word);
      });
      node.parentNode.replaceChild(fragment, node);
    });

    const words = aboutHeadline.querySelectorAll(".about-fill-word");
    if (words.length === 0) return;

    gsap.set(words, { color: "rgba(255, 255, 255, 0.32)" });
    aboutFillTween = gsap.to(words, {
      color: "rgba(255, 255, 255, 1)",
      ease: "none",
      stagger: 0.22,
      scrollTrigger: {
        trigger: aboutHeadline,
        start: "top 82%",
        end: "bottom 42%",
        scrub: true,
      },
    });
  };

  setupAboutHeadlineFill();
  document.addEventListener("site:language-change", setupAboutHeadlineFill);

  const contactPath = document.querySelector(".contact-scribble-path");
  const contactTitle = document.querySelector(".contact-title-center");
  const contactEmail = document.querySelector(".contact-email-center");
  if (contactPath && contactTitle && contactEmail) {
    try {
      const totalLength = contactPath.getTotalLength();
      gsap.set(contactPath, {
        opacity: 0,
        strokeDasharray: totalLength,
        strokeDashoffset: totalLength,
      });
      gsap.set([contactTitle, contactEmail], { opacity: 0, y: 24 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#contact",
          start: "top 78%",
        },
      });

      tl.to(contactPath, {
        strokeDashoffset: 0,
        opacity: 0.9,
        duration: 2.4,
        ease: "power2.inOut",
      })
        .to(
          contactTitle,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          0.35
        )
        .to(
          contactEmail,
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
          },
          0.75
        );
    } catch {}
  }
};
