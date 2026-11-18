// Insets and drift use percentages; WebGL consumes the same insets as fractions.
export const OPEN_FROM = {
  sides: [0, 30, 0, 30],
  left: [0, 55, 0, 0],
  right: [0, 0, 0, 55],
  bottom: [45, 0, 0, 0],
};
export const UNIT_OPEN_FROM = Object.fromEntries(Object.entries(OPEN_FROM).map(([side, values]) => [side, values.map((n) => n / 100)]));
export const RADIUS = 6;
export const ZOOM = { from: 1.25, rest: 1.1 };
export const DRIFT = 4;
