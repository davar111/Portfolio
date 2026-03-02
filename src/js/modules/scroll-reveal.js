export const initEntrances = ({ gsap }) => {
  gsap.from("nav", {
    opacity: 0,
    duration: 0.6,
    ease: "power2.out",
    delay: 0.1,
  });

  gsap.from(".hero-foot", {
    opacity: 0,
    y: 12,
    duration: 0.8,
    ease: "power3.out",
    delay: 0.35,
  });
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

  const aboutHeadline = document.querySelector(".about-headline");
  if (aboutHeadline) {
    if (!aboutHeadline.dataset.fillReady) {
      const textNodes = [];
      const walker = document.createTreeWalker(
        aboutHeadline,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) =>
            node.nodeValue && node.nodeValue.trim()
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT,
        }
      );

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

      aboutHeadline.dataset.fillReady = "1";
    }

    const words = aboutHeadline.querySelectorAll(".about-fill-word");
    gsap.set(words, { color: "rgba(255, 255, 255, 0.32)" });
    gsap.to(words, {
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
  }

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
