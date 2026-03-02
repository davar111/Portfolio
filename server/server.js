import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { parseBehanceCase, validateBehanceUrl } from "./behance-parser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const app = express();
const port = Number(process.env.PORT || 5173);
const BEHANCE_CACHE_TTL_MS = Number(process.env.BEHANCE_CACHE_TTL_MS || 30 * 60 * 1000);
const behanceCache = new Map();
const inFlightParses = new Map();

app.use(express.json({ limit: "1mb" }));

app.post("/api/behance/parse", async (req, res) => {
  const url = String(req.body?.url || "").trim();
  const mode = String(req.body?.mode || "full").toLowerCase() === "meta" ? "meta" : "full";
  const metaOnly = mode === "meta";
  const cacheKey = `${mode}:${url}`;
  if (!validateBehanceUrl(url)) {
    return res.status(400).json({
      ok: false,
      error: "Provide a valid Behance gallery URL.",
    });
  }

  try {
    const now = Date.now();
    const cached = behanceCache.get(cacheKey);
    if (cached && now - cached.ts < BEHANCE_CACHE_TTL_MS) {
      return res.json({ ok: true, data: cached.data, cached: true });
    }

    let parsePromise = inFlightParses.get(cacheKey);
    if (!parsePromise) {
      parsePromise = parseBehanceCase(url, { metaOnly });
      inFlightParses.set(cacheKey, parsePromise);
    }

    const result = await parsePromise;
    behanceCache.set(cacheKey, { ts: Date.now(), data: result });
    inFlightParses.delete(cacheKey);
    return res.json({ ok: true, data: result });
  } catch (error) {
    inFlightParses.delete(cacheKey);
    return res.status(502).json({
      ok: false,
      error: "Failed to parse Behance project.",
      details: error instanceof Error ? error.message : "Unknown parser error.",
    });
  }
});

app.use(express.static(ROOT_DIR));

app.get("*", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.listen(port, () => {
  process.stdout.write(`Portfolio dev server running on http://localhost:${port}\n`);
});
