import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRigMotion } from '../src/components/scissors/rigMotion.js';
import { CORRIDOR, cameraAt, focusProgress, framePose } from '../src/components/works/corridor.js';
import { PORTAL, cutGeometry, cutState, heroScale, planeScale, portalCamera, riseAt } from '../src/lib/heroCut.js';

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

test('the flight through the cut lands the next section at rest, rising at the pace of the scroll', () => {
  assert.equal(heroScale(portalCamera(0)), 1, 'the hero starts at its own size');
  assert.ok(heroScale(portalCamera(1)) > 4, 'and has swelled past the viewer by the end');
  const { photo, title, text } = PORTAL.planes;
  assert.ok(planeScale(0, photo.z) < planeScale(0, text.z), 'the photo comes from deeper than the text');
  assert.ok(!photo.show && title.show[1] <= text.show[0], 'the photo leads, then the title, then the text under it');
  assert.ok(text.show[1] < 1, 'all in full view before the camera stops');
  assert.ok(PORTAL.title >= title.show[0] && PORTAL.title < title.show[1], 'the title words rise as it comes into view');
  for (const { z } of [photo, title, text]) {
    const at = (split) => planeScale(portalCamera(split), z);
    assert.ok(Math.abs(at(1) - 1) < 1e-12, 'every plane lands at full size, all together');
    for (let i = 1; i <= 100; i++) assert.ok(at(i / 100) > at((i - 1) / 100), 'it only comes nearer');
    assert.ok((at(1) - at(0.999)) / 0.001 < 0.01, 'the camera stops with no jolt');
  }
  const room = 225;
  assert.equal(riseAt(room, room), room / 2);
  assert.equal(riseAt(room * 3, room), room / 2, 'still before the rise');
  assert.equal(riseAt(0, room), 0, 'in place when the pin lets go');
  assert.ok(Math.abs(riseAt(1e-3, room) / 1e-3 - 1) < 1e-3, 'rising 1 px per px of scroll at the end');
  assert.ok(Math.abs(riseAt(room - 1e-3, room) - room / 2) < 1e-3, 'setting off with no jump');
});

test('the corridor walks on at every scroll step, slower at each work, and puts each in focus', () => {
  const n = 6;
  const N = 6000;
  let prev = cameraAt(0, n);
  let slowest = Infinity;
  let fastest = 0;
  for (let i = 1; i <= N; i++) {
    const cam = cameraAt(i / N, n);
    const speed = (cam - prev) * N;
    slowest = Math.min(slowest, speed);
    fastest = Math.max(fastest, speed);
    prev = cam;
  }
  const mean = n - 1 + CORRIDOR.lead + CORRIDOR.tail;
  assert.ok(slowest > 0.3 * mean, `never stands still (slowest ${(slowest / mean).toFixed(2)} of the mean)`);
  assert.ok(fastest < 1.7 * mean, `never rushes (fastest ${(fastest / mean).toFixed(2)} of the mean)`);
  for (let i = 0; i < n; i++) {
    assert.ok(Math.abs(cameraAt(focusProgress(i, n), n) - i) < 1e-9, `work ${i} in focus at its stop`);
    const pose = framePose(i, i, 1440, CORRIDOR.desktop);
    assert.equal(pose.opacity, 1);
    assert.match(pose.transform, /translate3d\(0\.0px, 0, -?0\.0px\) rotateY\(-?0\.00deg\)/, 'square to the viewer, on the focal plane');
  }
  // A work never jumps: its pose moves in small steps as the camera walks.
  for (let s = 1; s <= 2000; s++) {
    const a = framePose(2, ((s - 1) / 2000) * n, 1440, CORRIDOR.desktop);
    const b = framePose(2, (s / 2000) * n, 1440, CORRIDOR.desktop);
    assert.ok(Math.abs(a.opacity - b.opacity) < 0.05);
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
