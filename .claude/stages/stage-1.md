# Stage 1 — Intro, header, hero

All strings come from `site.ui`, all data from `site`. Use `Button track=…` for the CTAs.

- **Intro**: black screen, `Logo` fades in, then slides up and reveals the site. Max 1.2s. Once per session (`sessionStorage`). Skipped under `prefers-reduced-motion`. z-index 100.
- **Header**: fixed, z-index 50, transparent over the hero, becomes `#0A0A0A` with a thin bottom line after 80px scroll. Desktop: logo, `ui.nav` anchor links, "Записатись" button (`track book_click` where `header`). Mobile: logo plus a full-screen menu with big links (scroll is locked while open: `getLenis()?.stop()` and `start()` on close).
- **Hero**: full-screen `site.images.hero` (`Img priority`) with a dark gradient overlay and parallax (oversize the image about 120% so the 0→20% shift never shows a gap). Headline `site.tagline`, subline `ui.hero.subline + " · " + site.addressShort`, two buttons: "Записатись" (`scrollToId('booking')`, `track book_click` where `hero`) and "Подзвонити" (`tel:` from `site.phone`, `track call_click`). Small badge `ui.status.open|closed` from `isOpenNow(site.hours)`, refreshed every minute.
- Leave visual room for the scissors (Stage 1b): on desktop the right half of the hero, on mobile the area under the headline.

Missing content to mention: `hero.jpg` (1600px wide, ≤ ~200 KB), `logo.svg`.
