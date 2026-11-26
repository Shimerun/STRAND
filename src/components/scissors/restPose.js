// The shears' resting pose over the hero, per kind of screen. Pure math, like pose.js; must not import three.js.
import { DESKTOP_MIN_PX } from './pose.js';

const DEG = Math.PI / 180;

// Hero pose: x / y as fractions of the viewport (world units at z = 0), scale relative to CONFIG.SCALE.
// tilt 145°: tips down to the left, rings up to the right.
// landscape: a phone on its side, where the hero has text on the left and the actions low on the right; the
// shears rest above the actions.
export const HERO = {
  desktop: { x: 0.22, y: 0, scale: 1, tilt: 145 * DEG, yaw: 18 * DEG },
  mobile: { x: 0, y: -0.04, scale: 0.62, tilt: 145 * DEG, yaw: 18 * DEG },
  landscape: { x: 0.26, y: 0.02, scale: 0.5, tilt: 145 * DEG, yaw: 18 * DEG },
};
// A phone in portrait whose headline leaves little room above the address (at 320x568 it wraps to four lines): the
// shears lie along that free band (heroBand, measured in useScissorsSignals) rather than stand across the letters,
// as large as fits there but never larger than usual. Where they fit standing (390x844) nothing changes.
// ring: how far the rings stand out from the long axis, as a share of the length.
const LYING = { tilt: 100 * DEG, ring: 0.18, margin: 8, side: 24 };
const extent = (tilt) => Math.abs(Math.cos(tilt)) + LYING.ring * Math.abs(Math.sin(tilt));
/** null, or { scale, tilt, y (px) } replacing the mobile hero pose's; size: the shears' length in px at hero.scale. */
export function fitHeroPose(hero, screen, size, band) {
  if (hero !== HERO.mobile || !band) return null;
  const room = band.bottom - band.top - 2 * LYING.margin;
  if (room <= 0 || size * extent(hero.tilt) <= room) return null;
  const k = Math.min(1, room / (size * extent(LYING.tilt)), (screen.width - 2 * LYING.side) / (size * Math.abs(Math.sin(LYING.tilt))));
  return { scale: hero.scale * k, tilt: LYING.tilt, y: (band.top + band.bottom) / 2 };
}
const SHORT_MAX_PX = 500;
/** The `short` screen in tailwind.config.js: a phone on its side. */
export const isShortLandscape = ({ width, height }) => width > height && height <= SHORT_MAX_PX && width < DESKTOP_MIN_PX;
export const heroPoseFor = (screen) => (screen.width >= DESKTOP_MIN_PX ? HERO.desktop : isShortLandscape(screen) ? HERO.landscape : HERO.mobile);
