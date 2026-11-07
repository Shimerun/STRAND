# Stage 3 — Works and reviews

- **Works**: masonry-like grid from `site.works` (`{src, alt}`). Photos open in a lightbox (z-index 60) with keyboard (Esc, arrows) and swipe support, focus trap, Lenis stopped while open. Photo reveal on scroll. If `works` is empty, show 6 placeholders and a one-line `TODO` comment. Button `ui.cta.moreWorks` only if `site.social.instagram` is set.
- **Reviews**: card row from `site.reviews`, only reviews with `text`. Big rating `site.rating.value.toFixed(1)` and `site.rating.count + " " + pluralUk(count, ui.reviews.verified)`.

Missing content to mention: `works/work-NN.jpg` and the `works` array, Instagram link.
