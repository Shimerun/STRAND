# Stage 1b-2 — Scroll travel and snipping (CHECKPOINT at the end)

Extend `useScissorsRig.js` and `Scissors3D.jsx`. All angles are per half (see 1b-1).

## Travel
- After the hero the scissors shrink and "dock" onto a travel track in the right gutter. Desktop ≈ 260px tall, mobile ≈ 130px tall and ≈ 30% off the right edge. The track's x is the middle of the gutter (read `--gutter` with `getComputedStyle` on mount and on resize), so the shears never cover text.
- Rotate from the hero pose until the tips point DOWN, rings at the top. Interpolate with `useScroll` + `useSpring` (stiffness 120, damping 24) between the hero pose and the track. Subscribe the spring to `invalidate()` (`frameloop="demand"`).
- Along the track the scissors move down with scroll progress and drift on a gentle S-curve (±40px desktop, ±14px mobile), rotation following the direction of travel.
- Convert CSS px to world units with the R3F viewport (`useThree().viewport`) so size and track look identical on every screen.

## Where the track ends and where the shears hide
- The track ends at the element with the attribute `data-scissors-end` (Stage 4 puts it on the booking section). Its top, minus 30vh, is progress 1. If no such element exists yet, use the page bottom minus one viewport.
- Over the last 15% of the track the scissors fade out (opacity) and stay hidden while that element is on screen or above the viewport; scrolling back up brings them back. The booking form must never have shears over it. Export the screen-space position of the tip from the rig (`rig.tipY`, `rig.tipX`) for CutReveal in 4b, and a `rig.burst()` that plays 3 fast snips.

## Snipping is driven by scroll distance, not time
Per-half angle in degrees = `clamp(11 + 10 * Math.sin(scrollY / 50), 1, CONFIG.MAX_OPEN)`, mirrored for the other half. Faster scrolling means faster snipping. When scrolling stops, the blades ease back to a 3° rest angle over 0.4s.

## Rendering budget
Invalidate the canvas on scroll, on pointer move, and during the idle snip only while the hero is visible (IntersectionObserver). Pause everything when the tab is hidden (`visibilitychange`).

## CHECKPOINT
Stop. Tell me what to look at (scroll the page on desktop and in the phone emulator). `npm run build` once, update Progress as "1b-2 (awaiting my visual OK)", commit.
