import { chromium } from "playwright";

const BEHANCE_HOSTS = new Set(["behance.net", "www.behance.net"]);
let browserPromise = null;

const getBrowser = async () => {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
};

const isValidBehanceUrl = (input) => {
  try {
    const parsed = new URL(input);
    return BEHANCE_HOSTS.has(parsed.hostname) && /\/gallery\/\d+/.test(parsed.pathname);
  } catch {
    return false;
  }
};

const getProjectIdFromUrl = (input) => {
  const match = input.match(/\/gallery\/(\d+)/);
  return match ? match[1] : null;
};

export const validateBehanceUrl = (url) => isValidBehanceUrl(url);

export const parseBehanceCase = async (url, options = {}) => {
  if (!isValidBehanceUrl(url)) {
    throw new Error("Invalid Behance project URL.");
  }

  const projectId = getProjectIdFromUrl(url);
  if (!projectId) {
    throw new Error("Could not extract Behance project ID from URL.");
  }
  const metaOnly = Boolean(options?.metaOnly);

  const browser = await getBrowser();
  let context = null;

  try {
    context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "media" || type === "font") {
        return route.abort();
      }
      return route.continue();
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await Promise.allSettled([
      page.waitForSelector("#__NEXT_DATA__", { timeout: 6000 }),
      page.waitForLoadState("networkidle", { timeout: 6000 }),
    ]);
    await page.waitForTimeout(300);

    if (metaOnly) {
      const metaExtracted = await page.evaluate(({ targetProjectId }) => {
        const parseJson = (text) => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        };

        const projectIdFromPath =
          String(targetProjectId || "") ||
          String(window.location.pathname.match(/\/gallery\/(\d+)/)?.[1] || "");

        const nextDataText = document.getElementById("__NEXT_DATA__")?.textContent || "";
        const nextData = nextDataText ? parseJson(nextDataText) : null;

        const findProjectById = (input, id) => {
          if (!input || typeof input !== "object" || !id) return null;
          const seen = new WeakSet();
          const walk = (value) => {
            if (!value || typeof value !== "object") return null;
            if (seen.has(value)) return null;
            seen.add(value);

            const currentId = String(value.id ?? value.project_id ?? value.projectId ?? "");
            if (currentId === String(id)) return value;

            for (const nested of Object.values(value)) {
              const found = walk(nested);
              if (found) return found;
            }
            return null;
          };
          return walk(input);
        };

        const stateProject = findProjectById(nextData, projectIdFromPath);

        const tagsRaw = Array.isArray(stateProject?.tags) ? stateProject.tags : [];
        const tagsFromArray = tagsRaw
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object") {
              const candidate = item.name || item.title || item.label || item.tag || item.slug || "";
              return String(candidate).trim();
            }
            return "";
          })
          .filter(Boolean);

        const keywordContent = document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
        const tagsFromKeywords = keywordContent
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length >= 2 && value.length <= 40);

        const tags = [
          ...new Set(
            [...tagsFromArray, ...tagsFromKeywords].filter((value) => {
              if (!value) return false;
              if (/^https?:\/\//i.test(value)) return false;
              return /[A-Za-z0-9]/.test(value);
            })
          ),
        ].slice(0, 12);

        const title =
          stateProject?.name ||
          stateProject?.title ||
          document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ||
          document.title ||
          null;

        const description =
          document.querySelector('meta[property="og:description"]')?.getAttribute("content")?.trim() || null;

        const cover = document.querySelector('meta[property="og:image"]')?.getAttribute("content") || null;

        const publishedAt =
          stateProject?.published_on ||
          document.querySelector('meta[property="article:published_time"]')?.getAttribute("content")?.trim() ||
          null;

        return {
          url: window.location.href,
          meta: {
            title,
            description,
            author: null,
            publishedAt,
            cover,
            tags,
          },
        };
      }, { targetProjectId: projectId });

      const html = await page.content();
      const decodedHtml = String(html || "").replace(/\\u002F/gi, "/").replace(/\\\//g, "/");
      const projectIdEscaped = String(projectId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cardCoverPattern = new RegExp(
        `https?:\\/\\/[^\\s"'<>]+\\/projects\\/(\\d+)\\/[a-z0-9]*${projectIdEscaped}\\.[^\\s"'<>]+`,
        "gi"
      );

      const toAbsoluteNode = (raw) => {
        const input = String(raw || "").trim();
        if (!input) return null;
        try {
          return new URL(input, url).href;
        } catch {
          return null;
        }
      };

      const coverMatches = [];
      let coverMatch = cardCoverPattern.exec(decodedHtml);
      while (coverMatch) {
        const size = Number(coverMatch[1] || 0);
        const src = toAbsoluteNode(coverMatch[0]);
        if (src) coverMatches.push({ src, size });
        coverMatch = cardCoverPattern.exec(decodedHtml);
      }

      coverMatches.sort((a, b) => {
        const aPriority = a.size === 404 ? 1 : 0;
        const bPriority = b.size === 404 ? 1 : 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.size - a.size;
      });
      const cardCover = coverMatches[0]?.src || null;

      const cover = metaExtracted?.meta?.cover
        ? toAbsoluteNode(metaExtracted.meta.cover)
        : null;

      return {
        source: "behance",
        projectId,
        url: metaExtracted?.url || url,
        meta: {
          title: metaExtracted?.meta?.title || null,
          description: metaExtracted?.meta?.description || null,
          author: metaExtracted?.meta?.author || null,
          publishedAt: metaExtracted?.meta?.publishedAt || null,
          cover,
          tags: Array.isArray(metaExtracted?.meta?.tags) ? metaExtracted.meta.tags : [],
        },
        preview: {
          cardCover: cardCover || cover || null,
          cover: cover || cardCover || null,
          images: [],
        },
        case: {
          blocks: [],
          blockCount: 0,
        },
      };
    }

    let extracted = await page.evaluate(({ targetProjectId }) => {
      const toAbsolute = (raw) => {
        if (!raw || typeof raw !== "string") return null;
        const trimmed = raw.trim();
        if (!trimmed) return null;
        try {
          return new URL(trimmed, window.location.href).href;
        } catch {
          return null;
        }
      };

      const maybeUrlLike = (value) => {
        const source = String(value || "").trim();
        if (!source) return false;
        if (/^https?:\/\//i.test(source)) return true;
        if (/^\/\//.test(source)) return true;
        if (/^\//.test(source)) return true;
        return false;
      };

      const normalizeAssetKey = (rawUrl) => {
        const source = String(rawUrl || "").trim();
        if (!source) return "";

        const normalizePath = (path) =>
          String(path || "")
            .toLowerCase()
            .replace(
              /\/project_modules(?:_[^/]+)?\/(?:\d+|max_\d+|fs|source|hd|disp|orig)\//i,
              "/project_modules/"
            )
            .replace(/\/+/g, "/");

        try {
          const parsed = new URL(source, window.location.href);
          const host = parsed.host.toLowerCase();
          const path = normalizePath(parsed.pathname);
          return `${host}${path}`;
        } catch {
          return normalizePath(source.split("?")[0].split("#")[0]);
        }
      };

      const getAssetBasename = (rawUrl) => {
        const source = String(rawUrl || "").trim();
        if (!source) return "";
        try {
          const parsed = new URL(source, window.location.href);
          const chunks = parsed.pathname.split("/").filter(Boolean);
          return String(chunks[chunks.length - 1] || "").toLowerCase();
        } catch {
          const clean = source.split("?")[0].split("#")[0];
          const chunks = clean.split("/").filter(Boolean);
          return String(chunks[chunks.length - 1] || "").toLowerCase();
        }
      };

      const parseJson = (text) => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      };

      const deepFind = (input, predicate) => {
        const seen = new WeakSet();
        const walk = (value) => {
          if (!value || typeof value !== "object") return null;
          if (seen.has(value)) return null;
          seen.add(value);

          if (predicate(value)) return value;
          for (const nested of Object.values(value)) {
            const found = walk(nested);
            if (found) return found;
          }
          return null;
        };
        return walk(input);
      };

      const deepCollect = (input, test) => {
        const out = [];
        const seen = new WeakSet();
        const walk = (value) => {
          if (!value) return;
          if (typeof value === "string") {
            if (test(value)) out.push(value);
            return;
          }
          if (typeof value !== "object") return;
          if (seen.has(value)) return;
          seen.add(value);
          Object.values(value).forEach(walk);
        };
        walk(input);
        return out;
      };

      const deepCollectObjects = (input, predicate) => {
        const out = [];
        const seen = new WeakSet();
        const walk = (value) => {
          if (!value || typeof value !== "object") return;
          if (seen.has(value)) return;
          seen.add(value);
          if (predicate(value)) out.push(value);
          Object.values(value).forEach(walk);
        };
        walk(input);
        return out;
      };

      const isNoiseUrl = (value) => {
        const url = String(value || "").toLowerCase();
        return /profile_images|avatars|logo|icon|favicon|sprite|badge|googleapis\.com\/css|fonts\.|tool|tools|software|creative[_-]?field|photoshop|illustrator|figma|after[_-]?effects|premiere|xd|sketch|recommended|related/i.test(
          url
        );
      };

      const isProjectMediaUrl = (value) => {
        const url = String(value || "").toLowerCase();
        if (isNoiseUrl(url)) return false;
        if (/\.svg(\?|$)/i.test(url)) return false;
        if (/\/projects\//i.test(url)) return false;
        if (!/project_modules/i.test(url)) return false;
        return /\.(png|jpe?g|webp|gif|mp4|webm)(\?|$)/i.test(url);
      };

      const isAllowedEmbedUrl = (value) => {
        const url = String(value || "").toLowerCase();
        if (!/^https?:\/\//i.test(url)) return false;
        return /youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com/i.test(url);
      };

      const getResolutionScore = (value) => {
        const url = String(value || "");
        const max = url.match(/max_(\d+)/i);
        const width = url.match(/[?&]w=(\d+)/i);
        const hq = /(?:_2x|_4x|hd|large)/i.test(url) ? 250 : 0;
        return Number(max?.[1] || 0) + Number(width?.[1] || 0) + hq;
      };

      const pickBestMediaUrl = (urls) => {
        if (!Array.isArray(urls) || urls.length === 0) return null;
        const ranked = urls
          .map((raw) => String(raw || "").trim())
          .filter(Boolean)
          .map((raw) => {
            const url = toAbsolute(raw);
            if (!url) return null;
            let score = 0;
            if (isProjectMediaUrl(url)) score += 1000;
            if (/\.(mp4|webm|png|jpe?g|webp|gif)(\?|$)/i.test(url)) score += 150;
            if (isAllowedEmbedUrl(url)) score += 120;
            score += getResolutionScore(url);
            return { url, score };
          })
          .filter(Boolean)
          .sort((a, b) => b.score - a.score);
        return ranked[0]?.url || null;
      };

      const nextDataText = document.getElementById("__NEXT_DATA__")?.textContent || "";
      const nextData = nextDataText ? parseJson(nextDataText) : null;

      const projectCandidates = nextData
        ? deepCollectObjects(nextData, (value) => {
            if (!value || typeof value !== "object") return false;
            const id = String(value.id ?? value.project_id ?? value.projectId ?? "");
            return id === String(targetProjectId);
          })
        : [];

      const extractModules = (node) => {
        if (!node || typeof node !== "object") return [];
        if (Array.isArray(node.modules)) return node.modules;
        if (Array.isArray(node.project_modules)) return node.project_modules;
        const nested = deepFind(node, (value) => {
          return Array.isArray(value?.modules) || Array.isArray(value?.project_modules);
        });
        if (!nested) return [];
        if (Array.isArray(nested.modules)) return nested.modules;
        if (Array.isArray(nested.project_modules)) return nested.project_modules;
        return [];
      };

      const stateProject =
        projectCandidates
          .map((candidate) => ({ candidate, modules: extractModules(candidate) }))
          .sort((a, b) => b.modules.length - a.modules.length)[0]?.candidate || null;

      const rawModules = extractModules(stateProject);

      const blocks = [];
      rawModules.forEach((module, index) => {
        const moduleType = String(module?.type || module?.module_type || module?.kind || "")
          .toLowerCase()
          .trim();
        const moduleIdentity = String(module?.name || module?.key || module?.slug || "")
          .toLowerCase()
          .trim();
        if (
          /tool|software|creative[_-]?field|profile|author|owner|credit|related|recommended/.test(
            `${moduleType} ${moduleIdentity}`
          )
        ) {
          return;
        }

        const mediaUrls = deepCollect(module, (value) => {
          if (!maybeUrlLike(value)) return false;
          if (isNoiseUrl(value)) return false;
          return true;
        });

        const textCandidates = deepCollect(module, (value) => {
          if (value.length < 18) return false;
          if (/^https?:\/\//i.test(value)) return false;
          return /[A-Za-z0-9]/.test(value);
        });

        const mainUrl = pickBestMediaUrl([...new Set(mediaUrls)]);

        if (mainUrl) {
          const isVideo = /\.(mp4|webm)(\?|$)/i.test(mainUrl);
          const isEmbed = isAllowedEmbedUrl(mainUrl) && !isProjectMediaUrl(mainUrl);
          blocks.push({
            type: isVideo ? "video" : isEmbed ? "embed" : "image",
            src: mainUrl,
            caption: textCandidates[0] || null,
            order: index,
          });
          return;
        }

        if (textCandidates[0]) {
          blocks.push({
            type: "text",
            text: textCandidates[0],
            order: index,
          });
        }
      });

      const dedupeByKey = (items, keyFn) => {
        const used = new Set();
        return items.filter((item) => {
          const key = keyFn(item);
          if (used.has(key)) return false;
          used.add(key);
          return true;
        });
      };

      const cleanBlocks = dedupeByKey(blocks, (item) => {
        if (item.src) {
          const basename = getAssetBasename(item.src);
          return `${item.type}:${basename || normalizeAssetKey(item.src)}`;
        }
        return `${item.type}:${item.text || item.order}`;
      });

      const fallbackBlocksFromHtml = () => {
        const html = document.documentElement?.innerHTML || "";
        if (!html) return [];

        const pattern = /(https?:\/\/[^\s"'<>]+|\/\/[^\s"'<>]+|\/[^\s"'<>]+project_modules[^\s"'<>]+)/gi;
        const rawMatches = html.match(pattern) || [];

        const urls = [...new Set(rawMatches)]
          .map((raw) => raw.replace(/\\u002F/gi, "/"))
          .map((raw) => toAbsolute(raw))
          .filter(Boolean)
          .filter((value) => isProjectMediaUrl(value))
          .filter((value) => String(value).includes(String(targetProjectId)))
          .filter((value) => /\.(png|jpe?g|webp|gif|mp4|webm)(\?|$)/i.test(String(value)));

        const dedupedUrls = dedupeByKey(urls, (value) => {
          const basename = getAssetBasename(value);
          return basename || normalizeAssetKey(value);
        });

        return dedupedUrls.slice(0, 80).map((src, index) => ({
          type: /\.(mp4|webm)(\?|$)/i.test(src) ? "video" : "image",
          src,
          caption: null,
          order: index,
        }));
      };

      const extractCardCoverFromHtml = () => {
        const html = document.documentElement?.innerHTML || "";
        if (!html) return null;

        const decodedHtml = html.replace(/\\u002F/gi, "/").replace(/\\\//g, "/");
        const projectIdEscaped = String(targetProjectId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(
          `https?:\\/\\/[^\\s"'<>]+\\/projects\\/(\\d+)\\/[a-z0-9]*${projectIdEscaped}\\.[^\\s"'<>]+`,
          "gi"
        );

        const matches = [];
        let match = pattern.exec(decodedHtml);
        while (match) {
          const size = Number(match[1] || 0);
          const src = toAbsolute(match[0]);
          if (src) {
            matches.push({ src, size });
          }
          match = pattern.exec(decodedHtml);
        }

        if (matches.length === 0) return null;
        matches.sort((a, b) => {
          const aPriority = a.size === 404 ? 1 : 0;
          const bPriority = b.size === 404 ? 1 : 0;
          if (aPriority !== bPriority) return bPriority - aPriority;
          return b.size - a.size;
        });
        return matches[0].src;
      };

      const jsonLdEntries = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]')
      )
        .map((node) => parseJson(node.textContent || ""))
        .filter(Boolean)
        .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));

      const jsonLdNode =
        jsonLdEntries.find((entry) => {
          const type = entry?.["@type"];
          if (Array.isArray(type)) {
            return type.some((item) => /creativework|article|webpage/i.test(String(item)));
          }
          return /creativework|article|webpage/i.test(String(type || ""));
        }) || null;

      const metaTitle =
        stateProject?.name ||
        stateProject?.title ||
        document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ||
        document.title ||
        null;
      const metaDescription =
        document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content")
          ?.trim() || null;
      const metaCover =
        document.querySelector('meta[property="og:image"]')?.getAttribute("content") || null;
      const metaPublished =
        stateProject?.published_on ||
        document
          .querySelector('meta[property="article:published_time"]')
          ?.getAttribute("content")
          ?.trim() ||
        jsonLdNode?.datePublished ||
        null;

      const tagsRaw = Array.isArray(stateProject?.tags)
        ? stateProject.tags
        : [];

      const tagsFromArray = tagsRaw
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (item && typeof item === "object") {
            const candidate =
              item.name || item.title || item.label || item.tag || item.slug || "";
            return String(candidate).trim();
          }
          return "";
        })
        .filter(Boolean);

      const keywordContent =
        document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
      const tagsFromKeywords = keywordContent
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length >= 2 && value.length <= 40);

      const tags = [
        ...new Set(
          [...tagsFromArray, ...tagsFromKeywords].filter((value) => {
            if (!value) return false;
            if (/^https?:\/\//i.test(value)) return false;
            return /[A-Za-z0-9]/.test(value);
          })
        ),
      ].slice(0, 12);

      const finalBlocks = cleanBlocks.length > 0 ? cleanBlocks : fallbackBlocksFromHtml();
      const cardCover = extractCardCoverFromHtml();

      const previewImages = finalBlocks
        .filter((block) => block.type === "image")
        .map((block) => block.src)
        .filter(Boolean)
        .slice(0, 8);

      return {
        url: window.location.href,
        meta: {
          title: metaTitle,
          description: metaDescription,
          author: jsonLdNode?.author?.name || null,
          publishedAt: metaPublished,
          cover: toAbsolute(metaCover),
          tags,
        },
        blocks: finalBlocks,
        previewImages,
        cardCover,
      };
    }, { targetProjectId: projectId });

    const toAbsoluteNode = (raw) => {
      const input = String(raw || "").trim();
      if (!input) return null;
      try {
        return new URL(input, url).href;
      } catch {
        return null;
      }
    };

    const getBasename = (rawUrl) => {
      const input = String(rawUrl || "").trim();
      if (!input) return "";
      try {
        const parsed = new URL(input, url);
        const chunks = parsed.pathname.split("/").filter(Boolean);
        return String(chunks[chunks.length - 1] || "").toLowerCase();
      } catch {
        const clean = input.split("?")[0].split("#")[0];
        const chunks = clean.split("/").filter(Boolean);
        return String(chunks[chunks.length - 1] || "").toLowerCase();
      }
    };

    const hasUsefulData =
      Boolean(extracted?.meta?.title) ||
      Boolean(extracted?.meta?.cover) ||
      (Array.isArray(extracted?.blocks) && extracted.blocks.length > 0);

    if (!hasUsefulData) {
      const html = await page.content();
      const decodedHtml = String(html || "").replace(/\\u002F/gi, "/").replace(/\\\//g, "/");

      const pickMeta = (property, attr = "property") => {
        const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(
          `<meta[^>]+${attr}=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
          "i"
        );
        const match = decodedHtml.match(regex);
        return match ? match[1].trim() : null;
      };

      const titleMatch = decodedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      const fallbackTitle = pickMeta("og:title") || (titleMatch ? titleMatch[1].trim() : null);
      const fallbackDescription = pickMeta("og:description") || pickMeta("description", "name");
      const fallbackCover = pickMeta("og:image");

      const keywordContent = pickMeta("keywords", "name") || "";
      const fallbackTags = keywordContent
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length >= 2 && value.length <= 40)
        .slice(0, 12);

      const projectModulesPattern = /https?:\/\/[^\s"'<>]+project_modules[^\s"'<>]+/gi;
      const moduleMatches = decodedHtml.match(projectModulesPattern) || [];
      const moduleUrls = [...new Set(moduleMatches)]
        .map((value) => toAbsoluteNode(value))
        .filter(Boolean)
        .filter((value) => String(value).includes(String(projectId)))
        .filter((value) => /\.(png|jpe?g|webp|gif|mp4|webm)(\?|$)/i.test(String(value)));

      const dedupedModuleUrls = [];
      const usedBases = new Set();
      moduleUrls.forEach((value) => {
        const base = getBasename(value);
        if (!base || usedBases.has(base)) return;
        usedBases.add(base);
        dedupedModuleUrls.push(value);
      });

      const fallbackBlocks = dedupedModuleUrls.slice(0, 80).map((src, index) => ({
        type: /\.(mp4|webm)(\?|$)/i.test(src) ? "video" : "image",
        src,
        caption: null,
        order: index,
      }));

      const projectIdEscaped = String(projectId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cardCoverPattern = new RegExp(
        `https?:\\/\\/[^\\s"'<>]+\\/projects\\/(\\d+)\\/[a-z0-9]*${projectIdEscaped}\\.[^\\s"'<>]+`,
        "gi"
      );
      const coverMatches = [];
      let coverMatch = cardCoverPattern.exec(decodedHtml);
      while (coverMatch) {
        const size = Number(coverMatch[1] || 0);
        const src = toAbsoluteNode(coverMatch[0]);
        if (src) coverMatches.push({ src, size });
        coverMatch = cardCoverPattern.exec(decodedHtml);
      }
      coverMatches.sort((a, b) => {
        const aPriority = a.size === 404 ? 1 : 0;
        const bPriority = b.size === 404 ? 1 : 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.size - a.size;
      });
      const fallbackCardCover = coverMatches[0]?.src || null;

      const fallbackPreviewImages = fallbackBlocks
        .filter((block) => block.type === "image")
        .map((block) => block.src)
        .slice(0, 8);

      extracted = {
        url: extracted?.url || url,
        meta: {
          title: extracted?.meta?.title || fallbackTitle || null,
          description: extracted?.meta?.description || fallbackDescription || null,
          author: extracted?.meta?.author || null,
          publishedAt: extracted?.meta?.publishedAt || null,
          cover: extracted?.meta?.cover || fallbackCover || null,
          tags:
            Array.isArray(extracted?.meta?.tags) && extracted.meta.tags.length > 0
              ? extracted.meta.tags
              : fallbackTags,
        },
        blocks:
          Array.isArray(extracted?.blocks) && extracted.blocks.length > 0
            ? extracted.blocks
            : fallbackBlocks,
        previewImages:
          Array.isArray(extracted?.previewImages) && extracted.previewImages.length > 0
            ? extracted.previewImages
            : fallbackPreviewImages,
        cardCover: extracted?.cardCover || fallbackCardCover,
      };
    }

    return {
      source: "behance",
      projectId,
      url: extracted.url || url,
      meta: extracted.meta,
      preview: {
        cardCover: extracted.cardCover || null,
        cover: extracted.meta.cover || extracted.previewImages[0] || null,
        images: extracted.previewImages,
      },
      case: {
        blocks: extracted.blocks || [],
        blockCount: (extracted.blocks || []).length,
      },
    };
  } finally {
    if (context) {
      await context.close();
    }
  }
};
