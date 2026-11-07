import { useEffect } from 'react';

const DEG = Math.PI / 180;
const STEP = 5 * DEG;
const BIG_STEP = 90 * DEG;
const SCALE_STEP = 0.25;
const MIN_SCALE = 0.5;
const MAX_OPEN_LIMIT = 90;

const round = (n, digits = 4) => Number(n.toFixed(digits));
const toDeg = (rad) => Math.round(rad / DEG);

function formatConfig(c) {
  const pivot = c.PIVOT ? `[${c.PIVOT.map((n) => round(n, 5)).join(', ')}]` : 'null';
  return [
    'export const CONFIG = {',
    `  ORIENTATION: [${c.ORIENTATION.map((n) => round(n)).join(', ')}], // deg: ${c.ORIENTATION.map(toDeg).join(', ')}`,
    `  SCALE: ${c.SCALE},`,
    `  PIVOT: ${pivot},`,
    `  MAX_OPEN: ${c.MAX_OPEN},`,
    `  SIGN_A: ${c.SIGN_A}, SIGN_B: ${c.SIGN_B},`,
    '};',
  ].join('\n');
}

// Keys use event.code so they work on any keyboard layout (e.g. Ukrainian).
export default function ScissorsDebug({ config, onChange, hold, onHold, info }) {
  const text = formatConfig(config);

  useEffect(() => {
    console.info(`[scissors debug]\n${text}`);
  }, [text]);

  useEffect(() => {
    const rotate = (axis, dir, big) =>
      onChange((c) => {
        const orientation = [...c.ORIENTATION];
        orientation[axis] = round(orientation[axis] + dir * (big ? BIG_STEP : STEP), 6);
        return { ...c, ORIENTATION: orientation };
      });
    const keys = {
      ArrowUp: (e) => (e.altKey ? rotate(2, 1, e.shiftKey) : rotate(0, -1, e.shiftKey)),
      ArrowDown: (e) => (e.altKey ? rotate(2, -1, e.shiftKey) : rotate(0, 1, e.shiftKey)),
      ArrowLeft: (e) => rotate(1, -1, e.shiftKey),
      ArrowRight: (e) => rotate(1, 1, e.shiftKey),
      BracketLeft: () => onChange((c) => ({ ...c, SCALE: Math.max(MIN_SCALE, round(c.SCALE - SCALE_STEP)) })),
      BracketRight: () => onChange((c) => ({ ...c, SCALE: round(c.SCALE + SCALE_STEP) })),
      Comma: () => onChange((c) => ({ ...c, MAX_OPEN: Math.max(0, c.MAX_OPEN - 1) })),
      Period: () => onChange((c) => ({ ...c, MAX_OPEN: Math.min(MAX_OPEN_LIMIT, c.MAX_OPEN + 1) })),
      Digit0: () => onHold((h) => (h === 'open' ? 'closed' : 'open')),
    };
    const onKeyDown = (event) => {
      const action = keys[event.code];
      if (!action) return;
      event.preventDefault();
      action(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onChange, onHold]);

  const copy = () => {
    navigator.clipboard?.writeText(text).catch((error) => console.error('[scissors debug] copy failed', error));
  };

  return (
    <div className="fixed bottom-4 left-4 z-[90] max-w-[calc(100vw-2rem)] rounded border border-line bg-bg/90 p-4 font-mono text-[11px] leading-relaxed">
      <pre className="whitespace-pre-wrap">{text}</pre>
      <p className="mt-2 text-concrete">
        held: {hold} · clip max: {info?.clipMaxDeg != null ? info.clipMaxDeg.toFixed(1) : '—'}° per half
      </p>
      <p className="text-concrete">
        ↑↓ X · ←→ Y · Alt+↑↓ Z (5°, Shift 90°) · [ ] SCALE · , . MAX_OPEN · 0 open/closed
      </p>
      <p className="text-concrete">SIGN_A / SIGN_B: ignored, the model&apos;s Snip clip drives the halves</p>
      <button type="button" onClick={copy} className="mt-2 underline">
        copy
      </button>
    </div>
  );
}
