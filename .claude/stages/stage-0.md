# Stage 0 — Setup and data

Already in the folder (kit): `src/data/site.js`, `.claude/settings.json`, `public/fonts/*.woff2`, `integrations/google-sheets/Code.gs`. Do not recreate or print them.

1. **Scaffold by hand** (no `npm create vite`): `package.json` (`"type":"module"`, scripts dev/build/preview), `vite.config.js` (react plugin), `index.html` (`lang="uk"`, theme-color `#0A0A0A`), `src/main.jsx`, `src/App.jsx`, `src/index.css`, `postcss.config.js`. Install `react@18 react-dom@18 framer-motion lenis` and dev `vite @vitejs/plugin-react tailwindcss@3 postcss autoprefixer`. Do NOT install three / fiber / drei yet. `npm ls react` must show 18.
2. **Tokens** from CLAUDE.md in `tailwind.config.js` (colors, radius 6px, `fontFamily.sans = ['"Montserrat Variable"', 'system-ui', 'sans-serif']`). Headings: uppercase, wide tracking.
3. **Fonts** in `src/index.css`: three `@font-face` blocks, family `Montserrat Variable`, `font-style: normal; font-display: swap; font-weight: 100 900`, `src: url(/fonts/<file>) format('woff2-variations')`:
   - `montserrat-cyrillic-wght-normal.woff2` — `unicode-range: U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116`
   - `montserrat-cyrillic-ext-wght-normal.woff2` — `unicode-range: U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F` (carries the ₴ sign)
   - `montserrat-latin-wght-normal.woff2` — `unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD`
   In `index.html` preload only the cyrillic and latin files: `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/…">`.
4. **Model**: `ls *.glb` in the root (do not open it). None → stop and tell me. Several → use the largest and tell me which. `mkdir -p public/models && mv <file> public/models/scissors.glb`; write the original filename into the "Model original filename" line of CLAUDE.md.
5. **Git and env**: `git init` if there is no repo. `.gitignore`: `node_modules`, `dist`, `.env`, `.DS_Store`. `.env.example` with `VITE_BOOKING_ENDPOINT=` (Apps Script web-app URL) and `VITE_SITE_URL=` (e.g. `https://strand.example`).
6. **Folders** from CLAUDE.md. Sanity check of the data: `node -e "import('./src/data/site.js').then(m=>console.log(Object.keys(m.site).length))"`.
7. **Lib helpers** (small, pure, each under 80 lines):
   - `time.js`: `TZ` = the first of `site.timezone` / `"Europe/Kiev"` that `new Intl.DateTimeFormat('en-GB',{timeZone})` accepts (try/catch RangeError, old iOS does not know `Europe/Kyiv`); if neither works use browser local time. `kyivNow(date=new Date())` → `{dateISO:'YYYY-MM-DD', weekday:'mon'…'sun', minutes}` via `formatToParts`. Also `toMinutes('10:00')`, `fromMinutes(600)`, `addDaysISO(iso,n)`, `weekdayOf(iso)`, `isOpenNow(hours, now=kyivNow())` (uses `hours[weekday]` = `{open,close}` or `null`).
   - `format.js`: `pluralUk(n,[one,few,many])`, `formatDuration(min)` ("15 хв", "1 год", "2 год", "1 год 30 хв"), `formatPrice(n,{from})` ("900 ₴" / "від 900 ₴", non-breaking space), `formatHours(day, closedLabel)` ("10:00–21:00").
   - `track.js`: `track(name, params={})` pushes `{event:name,...params}` to `window.dataLayer` if it exists, `console.debug` in DEV, otherwise no-op. Event names: `book_click`, `call_click`, `route_click`, `booking_submit`, `booking_success`, `booking_error`.
   - `scroll.js`: `setLenis(l)`, `getLenis()`, `scrollToId(id)` (element missing → do nothing; offset -72px for the header; Lenis `scrollTo` if present, else native, instant under reduced motion).
8. **Primitives**: `Img` (placeholder on missing file or error; props `priority` → `loading="eager" fetchpriority="high"`, otherwise `loading="lazy"`; `width`/`height` always), `Logo` (text wordmark "STRAND" + "BARBERSHOP" until `site.images.logo` loads), `Reveal` (text reveal from CLAUDE.md), `Button` (primary and ghost, hover from CLAUDE.md, optional `track={{name, ...params}}` that calls `track` on click), `Section` (container `max-w-6xl`, `pl-5`, `padding-right: var(--gutter)`, vertical spacing, anchor `id`, `scroll-margin-top` for the header). Add `--gutter` in `index.css` (40px, 96px from 1024px).
9. **Lenis** in `App` via `scroll.js`, duration 1.1, off under `prefers-reduced-motion`.
10. `npm run build`, update Progress in CLAUDE.md, commit, report.

Missing content to mention: photos, `logo.svg`, Instagram link.
