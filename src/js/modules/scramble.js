const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";
const activeTweens = new WeakMap();

const buildOutput = (original, queue, frame) => {
  let output = "";
  for (let i = 0; i < queue.length; i += 1) {
    const item = queue[i];
    const char = original[i];
    const isPunctuation = char === " " || char === "." || char === "," || char === ">" || char === "-";
    if (isPunctuation) {
      output += char;
      continue;
    }

    if (frame >= item.end) {
      output += char;
    } else if (frame >= item.start) {
      output += CHARS[Math.floor(Math.random() * CHARS.length)];
    } else {
      output += char;
    }
  }
  return output;
};

const scramble = (element, gsap) => {
  const original = element.dataset.orig || element.textContent.trim();
  if (!original) return;
  element.dataset.orig = original;

  const previousTween = activeTweens.get(element);
  if (previousTween) {
    previousTween.kill();
  }

  const queue = original.split("").map((char) => ({
    char,
    start: Math.floor(Math.random() * 4),
    end: Math.floor(Math.random() * 10) + 8,
  }));

  const maxFrame = queue.reduce((acc, item) => Math.max(acc, item.end), 0);
  const state = { frame: 0 };

  const tween = gsap.to(state, {
    frame: maxFrame + 1,
    duration: 0.62,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = buildOutput(original, queue, Math.floor(state.frame));
    },
    onComplete: () => {
      element.textContent = original;
      activeTweens.delete(element);
    },
  });

  activeTweens.set(element, tween);
};

const bindScramble = (triggerElement, targetElement, gsap) => {
  if (!triggerElement || !targetElement) return;
  const text = targetElement.textContent.trim();
  if (text.length === 0 || text.length >= 40) return;

  const run = () => scramble(targetElement, gsap);
  triggerElement.addEventListener("mouseenter", run);
  triggerElement.addEventListener("mouseover", run);
  triggerElement.addEventListener("focus", run);
};

export const initScramble = () => {
  const gsap = window.gsap;
  if (!gsap) {
    return;
  }

  document.querySelectorAll("#nav .nav-name, #nav .nav-link").forEach((element) => {
    bindScramble(element, element, gsap);
  });
};
