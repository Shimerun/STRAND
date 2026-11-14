// The soft light spot each section band paints (index.css .band --light): an ellipse 70% of the band wide and
// 300 px tall, centred 300 px below its top at --light-x, fading linearly to its edge. Keep in step with the CSS.
const SPOT = { width: 0.7, top: 300, height: 300 };
const centres = new WeakMap(); // band layer → --light-x as a share of its width

/** For band layer `host` at viewport rect `rect`: (page x, page y) → how lit that point is, 0 outside to 1 at the centre. */
export function lightIn(host, rect) {
  if (!centres.has(host)) centres.set(host, parseFloat(getComputedStyle(host).getPropertyValue('--light-x')) / 100 || 0.5);
  const cx = rect.left + window.scrollX + centres.get(host) * rect.width;
  const cy = rect.top + window.scrollY + SPOT.top;
  const rx = SPOT.width * rect.width;
  return (x, y) => Math.max(1 - Math.hypot((x - cx) / rx, (y - cy) / SPOT.height), 0);
}
