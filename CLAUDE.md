# Strand Barbershop — website

Mobile-first one-page site for Strand Barbershop (Zhytomyr, Ukraine). Dark concrete-loft style.
Site UI language: Ukrainian (`<html lang="uk">`). Talk to the user in Ukrainian.

## Progress (edit ONLY this block at the end of each stage, then commit)
Done: 0, 1, 1b-1, 1b-2, 1b-3 · Next: 2
Order: 0 → 1 → 1b-1 → 1b-2 → 1b-3 → 2 → 3 → 4 → 4b → 5
Specs live in `.claude/stages/stage-<id>.md` (e.g. `stage-1b-1.md`). On "next" read ONLY the next stage file, never the others.
Model original filename: strand-scissors.glb

## Stack (pinned, do not upgrade or swap)
- Node ≥ 20.19. Vite + `@vitejs/plugin-react`, **React 18** (`react@18 react-dom@18`), **Tailwind CSS 3** (`tailwindcss@3 postcss autoprefixer`, `tailwind.config.js`; NOT v4), `framer-motion`, `lenis`.
- Stage 1b only: `three`, `@react-three/fiber@8`, `@react-three/drei@9` (fiber 9 / drei 10 need React 19). Lazy-loaded.
- Never run `npm create vite` here (it prompts and can wipe the folder, including the .glb). Write the config files by hand.
- No other dependencies without asking. Montserrat is self-hosted from `public/fonts/`.
- Came with the kit, never recreate or print: `src/data/site.js`, `.claude/settings.json`, `.claude/stages/*`, `public/fonts/*`, `integrations/google-sheets/Code.gs`.

## Structure
- `src/data/site.js` — ALL content: texts, `ui` strings, services, team, works, contacts, `hours`, `booking`, `images`, `seo`. Change content only here. A new UI string goes into `ui` first.
- `src/components/` — one file per section, under 150 lines. A complex section gets its own folder (`booking/`, `team/`, `works/`, `scissors/`), every file under 150 lines.
- `src/lib/booking.js` — `submitBooking(data)` and `fetchBusy()`; the ONLY place that knows where bookings go.
- `src/lib/slots.js` — pure slot logic (`blocksFor`, `freeTimes`). `src/lib/bookingContext.jsx` — selected barber/service shared by Services, Team and Booking.
- `src/lib/pricing.js` — `priceFor`, `minPrice`, `servicesFor`. Prices are per barber (`services[].prices[slug]`); never hardcode prices.
- `src/lib/time.js` — Kyiv-time helpers (`kyivNow`, `toMinutes`, `addDaysISO`, `isOpenNow`). `src/lib/format.js` — `pluralUk`, `formatDuration`, `formatPrice`, `formatHours`.
- `src/lib/scroll.js` — Lenis instance and `scrollToId(id)`. `src/lib/track.js` — `track(name, params)` analytics stub. `src/lib/motion.js` — shared variants and easings.
- `integrations/google-sheets/Code.gs` — Apps Script the user pastes into Google Sheets. Edit only if asked.
- `vite/siteMeta.js` — Stage 5: injects meta, JSON-LD, preloads, robots.txt, sitemap.xml from `site.js`.
- `public/images/` — `hero.jpg`, `about.jpg`, `facade.jpg`, `interior-1..4.jpg`, `og.jpg`, `team/<slug>.jpg`, `works/work-NN.jpg`, `logo.svg` (paths come from `site.images`).
- A missing photo, logo or Instagram link must never break the UI: `<Img>` falls back to a dark placeholder, hide the Instagram icon when the value is `null`.

## Bookings (decided)
Requests go to a Google Sheet through an Apps Script web app; its URL is `VITE_BOOKING_ENDPOINT`. The sheet is the single source of truth: a booked slot disappears from the form for that barber, status `скасовано` frees it. Name and phone are mandatory on the client AND on the server. POST uses `Content-Type: text/plain` (no CORS preflight). A production build without the endpoint shows the error state with the phone number, never a fake success; demo success only when `import.meta.env.DEV`.

## Design tokens (tailwind.config)
bg `#0A0A0A` · surface `#141414` · line `#262626` · concrete `#8A8A8A` · text `#F2F2F2` · accent `#6B7F5E` (plant green, sparingly: CTA hover, focus ring).
Font Montserrat 400/500/700/800 (family `Montserrat Variable`). Headings uppercase, wide tracking. Radius 6px.

## Layers and gutter
- z-index scale: CutReveal line 39 · scissors canvas 40 · mobile sticky bar 45 · header and mobile menu 50 · drawer, lightbox 60 · intro 100.
- Right gutter for the scissors track: CSS var `--gutter` = 40px (<1024px) / 96px (≥1024px) in `index.css`. `Section` applies `padding-right: var(--gutter)` so text and controls never sit under the shears. Full-bleed media (hero, map) may go under them.

## Motion (use these exact values)
- Text reveal: blur 12px→0, opacity 0→1, y 24→0, 0.8s, ease `[0.4,0,0.2,1]`, once, viewport amount 0.3.
- Photo reveal: `clip-path: inset(0 30%)` → `inset(0)`, scroll-linked.
- Hero photo parallax: y 0→20%.
- Hover (buttons, cards): y -2px, 0.3s, ease `[0.26,1.04,0.54,1]`.
- Intro: logo fades in, then slides up, max 1.2s, shown once per session (`sessionStorage`).
- Smooth scroll: Lenis, duration 1.1.
- Signature: 3D metallic barber scissors in `src/components/scissors/`, specs in stages 1b-1, 1b-2, 1b-3, 4b. Model is MY OWN file at `public/models/scissors.glb`. Inspect it only with `npx @gltf-transform/cli inspect`, never open it. Orientation, scale, pivot and max opening live in the `CONFIG` object in `Shears.jsx`, never by editing the file. Procedural `RoomEnvironment` lighting, no HDR downloads, decoders local (never a CDN). Never open model or image files.
- `prefers-reduced-motion`: no intro, parallax, Lenis or blur; plain fades only.

## Token-saving rules (follow strictly)
1. Replies: max 3 short lines after a task, plus one line "Missing content: …". No recap of steps, no restating the request, no code in chat unless asked. Exceptions: the model summary (≤8 lines) in 1b-1 and the "how to run it" note at checkpoints.
2. Do not read files you do not need. Use Grep or line ranges. Never read `node_modules`, `dist`, lockfiles, images, other stage files.
3. Never re-read a file you just edited. Never print whole files.
4. Small change → Edit. Never rewrite a whole file for a small change.
5. Content lives only in `site.js`. Never duplicate strings in components.
6. Work one stage at a time. Finish it, report, then wait for the user.
7. Run `npm run build` once at the end of a stage, not after every edit. Do not keep dev-server output open.
8. No README, docs, tests or comment blocks unless asked (files named in this CLAUDE.md or a stage file are asked for; one-line `TODO` comments are fine).
9. Do not add dependencies, refactor, or "improve" things outside the current task.
10. If blocked, ask ONE short question; otherwise decide and note the decision in one line.
11. When the context gets long, tell the user to run `/compact`; between stages suggest `/clear` (everything needed is in this file and the stage files).
12. After the build passes: update the Progress block, then `git add -A && git commit -m "Stage <id>: <title>"`. Never push.
