# Stage 4b — CutReveal and the final cut

Now every section exists, so wire the last signature details. `src/components/scissors/CutReveal.jsx`. Transform and opacity only.

- **Section cut**: when a `section[id]` enters the view (IntersectionObserver, threshold 0.2, once per section), a horizontal line appears at the scissors' tip height (`rig.tipY`) and draws from the scissors toward the left edge in 0.9s, ease `[0.4,0,0.2,1]`. Build it with `scaleX` 0→1 from the right (`transform-origin: right`) on an element with a dashed look (`repeating-linear-gradient`, 6px on / 8px off, color `line`); at 80% of the duration a 1px solid `text` line fades in over it ("it got cut"), then both fade out over 1.2s so the page does not fill up with lines. z-index 39. Pointer events none.
- Optional, only if cheap: 3 thin hair strands detach at the tip, drift down and fade out in 0.8s.
- **Final cut**: when `[data-scissors-end]` (the booking section) crosses 60% of the viewport, call `rig.burst()` (3 fast snips) with the line across the section top, then the scissors fade out as defined in 1b-2.
- Works the same with the 2D fallback. Under `prefers-reduced-motion` do nothing.
- Check: the shears never overlap the booking form, the sticky bar or the drawer (z-index scale in CLAUDE.md).

`npm run build` once, update Progress, commit, report.
