import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRigMotion } from '../src/components/scissors/rigMotion.js';
import { bladeOpen, heroCutPhases } from '../src/lib/heroCut.js';

const SIZES = [[1440, 900], [390, 844], [320, 480]];

test('the hero opens the blades, snips once and slides away without jumps', () => {
  const pin = 900;
  const N = 20_000;
  let prev = heroCutPhases(0, pin);
  let prevOpen = bladeOpen(prev);
  let shuts = 0;
  for (let i = 1; i <= N; i++) {
    const phases = heroCutPhases((i / N) * pin, pin);
    const open = bladeOpen(phases);
    // One sample is 1/20000 of the pin: a continuous opening moves by a hair.
    assert.ok(Math.abs(open - prevOpen) < 0.01, `opening jumped at ${i}: ${prevOpen} -> ${open}`);
    for (const key of ['aim', 'snip', 'slide']) assert.ok(phases[key] >= prev[key], `${key} never goes back`);
    if (prevOpen > 0 && open === 0) shuts++;
    prev = phases;
    prevOpen = open;
  }
  assert.equal(shuts, 1, 'the blades shut exactly once');
  assert.deepEqual(prev, { aim: 1, snip: 1, slide: 1 });
  assert.deepEqual(heroCutPhases(500, 0), { aim: 0, snip: 0, slide: 0 }, 'no pin, no cut');
});

test('an untouched hero eases to rest and stops drawing, then wakes without a jump', () => {
  const step = createRigMotion();
  const signals = {
    heroHeight: 900, cutPin: 900, endTop: 9000, pageHeight: 12000, viewHeight: 900, pageWidth: 1440, gutter: 96,
    pointer: { x: 0, y: 0 }, pageHidden: false, heroVisible: true,
  };
  const input = (scrollY) => ({ dt: 1 / 60, scrollY, dock: 0, signals, screen: { width: 1440, height: 900 }, unit: 100, length: 4, maxOpen: 30 });
  let frame;
  let frames = 0;
  do {
    frame = step(input(0));
    frames++;
    assert.ok(Number.isFinite(frame.x) && Number.isFinite(frame.y) && Number.isFinite(frame.open));
  } while (frame.active && frames < 60 * 30);
  assert.ok(frames > 60 * 8 && frames < 60 * 10, `stopped after ${(frames / 60).toFixed(1)} s`);
  assert.equal(frame.open, 0, 'at rest the blades are shut');
  const woke = step(input(1)); // one px of scroll
  assert.equal(woke.active, true);
  assert.ok(Math.hypot(woke.x - frame.x, woke.y - frame.y) < 1, 'no jump on waking');
});

test('from the snip to the track the pair stays on the right edge, in view', () => {
  const step = createRigMotion();
  const signals = {
    heroHeight: 900, cutPin: 900, endTop: 9000, pageHeight: 12000, viewHeight: 900, pageWidth: 1440, gutter: 96,
    pointer: { x: 0, y: 0 }, pageHidden: false, heroVisible: false,
  };
  for (const [width, gutter] of [[1440, 96], [390, 40]]) {
    for (let dock = 0; dock <= 1; dock += 0.01) {
      const frame = step({ dt: 1 / 60, scrollY: 900, dock, signals: { ...signals, pageWidth: width, gutter }, screen: { width, height: 900 }, unit: 100, length: 4, maxOpen: 30 });
      assert.ok(frame.x > width - 2 * gutter, `${width}px, dock ${dock.toFixed(2)}: x ${Math.round(frame.x)} left the right edge`);
      assert.ok(frame.opacity > 0.95, `${width}px, dock ${dock.toFixed(2)}: opacity ${frame.opacity}`);
    }
  }
});
