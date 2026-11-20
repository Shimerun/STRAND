import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRigMotion } from '../src/components/scissors/rigMotion.js';
import { cutGeometry, cutState } from '../src/lib/heroCut.js';

const SIZES = [[1440, 900], [390, 844], [320, 480]];

test('the hero cut moves on without jumps: pivot, cut end and blade pressure', () => {
  for (const [width, height] of SIZES) {
    const N = 20_000;
    let prev = cutState(0, width, height);
    let maxPivotStep = 0;
    let maxPressStep = 0;
    for (let i = 1; i <= N; i++) {
      const s = cutState(i / N, width, height);
      maxPivotStep = Math.max(maxPivotStep, Math.hypot(s.pivot.x - prev.pivot.x, s.pivot.y - prev.pivot.y));
      maxPressStep = Math.max(maxPressStep, Math.abs(s.press - prev.press));
      assert.ok(s.cut >= prev.cut - 1e-9, 'the cut never shrinks');
      assert.ok(s.closings >= prev.closings, 'closings only count up');
      prev = s;
    }
    // One sample is 1/20000 of the cut: a continuous pivot moves well under a pixel.
    assert.ok(maxPivotStep < 1, `${width}x${height}: pivot jumped ${maxPivotStep.toFixed(2)} px`);
    assert.ok(maxPressStep < 0.05, `${width}x${height}: pressure jumped by ${maxPressStep.toFixed(2)}`);
    assert.equal(prev.closings, cutGeometry(width, height).snips);
    assert.ok(Math.abs(prev.share - 1) < 1e-9);
  }
});

test('an untouched hero eases to rest and stops drawing, then wakes without a jump', () => {
  const step = createRigMotion();
  const signals = {
    heroHeight: 900, cutPin: 2700, endTop: 9000, pageHeight: 12000, viewHeight: 900, pageWidth: 1440, gutter: 96,
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

test('on its way from the cut to the track the pair is hidden while it crosses the page', () => {
  const step = createRigMotion();
  const signals = {
    heroHeight: 900, cutPin: 2700, endTop: 9000, pageHeight: 12000, viewHeight: 900, pageWidth: 1440, gutter: 96,
    pointer: { x: 0, y: 0 }, pageHidden: false, heroVisible: false,
  };
  for (const width of [1440, 390]) {
    for (let dock = 0; dock <= 1; dock += 0.01) {
      const frame = step({ dt: 1 / 60, scrollY: 2700, dock, signals: { ...signals, pageWidth: width }, screen: { width, height: 900 }, unit: 100, length: 4, maxOpen: 30 });
      if (frame.x > width * 0.2 && frame.x < width * 0.8) assert.ok(frame.opacity < 0.05, `${width}px, dock ${dock.toFixed(2)}: opacity ${frame.opacity} at x ${Math.round(frame.x)}`);
    }
  }
});
