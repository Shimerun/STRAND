# Stage 5 — SEO, accessibility, performance

## `vite/siteMeta.js` (a small Vite plugin, no new dependency)
Imports `site` from `../src/data/site.js`, reads `VITE_SITE_URL` with `loadEnv`. Register it in `vite.config.js`.
- `transformIndexHtml`: `<title>` and meta description from `site.seo`; canonical and Open Graph (`og:title`, `og:description`, `og:type=website`, `og:locale=uk_UA`, `og:image` = `VITE_SITE_URL + site.images.og`); theme color `#0A0A0A`; favicon placeholder; preload of `site.images.hero` (`as="image" fetchpriority="high"`).
- JSON-LD `BarberShop`: name, address (`streetAddress` = `addressShort`, `addressLocality` = `city`, `postalCode`, `addressCountry` `UA`), `geo`, `telephone`, `image`, `priceRange` "₴₴", `openingHoursSpecification` built from the `hours` objects (group identical days; skip `null` days), `sameAs` from the socials that are set.
- `generateBundle`: emit `robots.txt` and `sitemap.xml` when `VITE_SITE_URL` is set; if it is not, skip both and mention it.
- No phone, address or hours typed anywhere else: they come from `site.js`.

## Images
`loading="lazy"` except the hero, `width`/`height` set, Ukrainian `alt`.

## Accessibility
Visible focus ring (accent), labels on all inputs, `aria-live` for form status, focus traps in the drawer, lightbox and menu, contrast AA.

## Analytics check
Confirm `track` is called for: `book_click` (header, hero, services, drawer, sticky bar), `call_click`, `route_click`, `booking_submit`, `booking_success`, `booking_error`.

## Finish
`npm run build`; read the output only (chunk sizes, the 3D chunk). Do not open images. Do not try to run Lighthouse. Tell me, in Ukrainian, to run Lighthouse myself: `npm run preview`, Chrome DevTools → Lighthouse → Mobile, and send you the four scores plus LCP. Update Progress, commit.

Missing content to mention: `og.jpg` (1200×630), `VITE_SITE_URL`, favicon.
