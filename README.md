# Portfolio Base Architecture

Static Vanilla setup based on your current visual.

## Structure

```text
.
|- index.html
|- src/
|  |- styles/
|  |  |- tokens.css
|  |  |- base.css
|  |  |- layout.css
|  |  |- components.css
|  |  |- sections.css
|  |- js/
|     |- main.js
|     |- modules/
|        |- lenis.js
|        |- clock.js
|        |- cursor.js
|        |- scramble.js
|        |- scroll-reveal.js
|        |- accordion.js
|        |- behance-preview.js
|- server/
|  |- server.js
|  |- behance-parser.js
|- package.json
```

## Where to edit

- HTML content and section order: `index.html`
- Design tokens (colors, spacing): `src/styles/tokens.css`
- Global base rules: `src/styles/base.css`
- Nav/hero/layout rules: `src/styles/layout.css`
- Reusable UI pieces (cursor, accordion): `src/styles/components.css`
- Section-specific styles (work/about/contact/footer): `src/styles/sections.css`
- App bootstrap: `src/js/main.js`
- Specific interactions: `src/js/modules/*.js`
- Behance API parser: `server/behance-parser.js`
- Dev server + API routes: `server/server.js`

## Run

```bash
npm install
npx playwright install chromium
npm run dev
```

Server runs on `http://localhost:5173`.

## Behance Parse Flow

- Endpoint: `POST /api/behance/parse`
- Body: `{ "url": "https://www.behance.net/gallery/240437685/Lumo-Online-Cinema-(Mobile-App)" }`
- Returns normalized payload:
  - `meta` (title, description, author, publishedAt, cover, tags)
  - `preview` (cover + image list)
  - `case.blocks` (parsed case blocks in order)

### Frontend test mode

Open:

```text
http://localhost:5173/?behance=https://www.behance.net/gallery/240437685/Lumo-Online-Cinema-(Mobile-App)
```

When `?behance=` is present, only the first card in `work-grid` is hydrated from parsed data.
Click that card to render the parsed Behance case blocks inside the page (below `#work`).

## Notes

- Stack is still CDN-based: `GSAP`, `ScrollTrigger`, `Lenis`.
- Behance parsing runs server-side with `Playwright`.
- Behavior and visual are kept aligned with your original single-file version, but now modular.
