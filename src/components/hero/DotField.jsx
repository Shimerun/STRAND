import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/scroll.js';

const TAU = Math.PI * 2;
const FRICTION = 0.85; // velocity kept per step
const STEP_MS = 1000 / 60; // physics steps at 60 Hz whatever the display's rate
const MAX_DPR = 2;
const MAX_DOTS = 3000; // past this many the gap widens
const SETTLED = 0.01; // px per step: below this for every dot nothing moves but the breathing
const IDLE_MS = 50; // then the field is redrawn at 20 fps: the breathing is slow
const BREATH = { swing: 0.35, speed: 0.0012 }; // brightness swing (share of the opacity) and its rate (rad/ms)
const FLASH = { chance: 0.02, decay: 0.94, grow: 1.6 }; // chance per step a random dot flashes, glow kept per step, size
const ALPHA_STEPS = 8; // dots are filled in this many brightness groups, one path each
const PAUSE_SCROLL = 1; // px scrolled: the hero is being cut (Hero.jsx), so the field stands still

// While the hero is cut it is drawn twice: the copy for the cut-off flap (HeroContent `copy`) carries a mirror
// canvas that gets the main field's frame when it stops, so both pieces show the same dots.
let source = null;
const mirrors = new Set();
function syncMirrors() {
  if (!source) return;
  mirrors.forEach((mirror) => {
    mirror.width = source.width;
    mirror.height = source.height;
    mirror.getContext('2d').drawImage(source, 0, 0);
  });
}

/**
 * A grid of small dots over the hero photo that shy away from the mouse and spring back home, breathing softly,
 * now and then one flashing in the accent color. Fills its parent (position: relative), which takes the pointer
 * events, so it works under the text and buttons too. Runs only while the hero is on screen and not being cut;
 * reduced motion: a still grid. Touch: no pushing, only the breathing.
 * mirror: show the main field's frame instead of running one (the hero's copy for the cut).
 */
export default function DotField({
  gap = 24,
  dotSize = 1.5,
  dotColor = '#F2F2F2', // tailwind text
  dotOpacity = 0.25,
  mouseRadius = 120,
  strength = 6,
  returnSpeed = 0.08,
  glowColor = '#6B7F5E', // tailwind accent
  mirror = false,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (mirror) {
      mirrors.add(canvas);
      syncMirrors();
      return () => mirrors.delete(canvas);
    }
    const host = canvas.parentElement;
    const context = canvas.getContext('2d');
    const still = prefersReducedMotion();
    const groups = Array.from({ length: ALPHA_STEPS }, () => []);
    let dots = [];
    let [width, height, scale] = [0, 0, 1];
    let mouse = null;
    let visible = true;
    let paused = window.scrollY > PAUSE_SCROLL;
    let [frame, last, carry, drawnAt] = [0, 0, 0, 0];
    source = canvas;

    const draw = (now) => {
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      groups.forEach((group) => group.splice(0));
      for (const dot of dots) {
        dot.brightness = dotOpacity * (1 + BREATH.swing * Math.sin(now * BREATH.speed + dot.phase));
        groups[Math.min(Math.floor((dot.brightness / (dotOpacity * (1 + BREATH.swing))) * ALPHA_STEPS), ALPHA_STEPS - 1)].push(dot);
      }
      context.fillStyle = dotColor;
      groups.forEach((group, i) => {
        context.globalAlpha = (dotOpacity * (1 + BREATH.swing) * (i + 0.5)) / ALPHA_STEPS;
        context.beginPath();
        for (const dot of group) {
          context.moveTo(dot.x + dotSize, dot.y);
          context.arc(dot.x, dot.y, dotSize, 0, TAU);
        }
        context.fill();
      });
      context.fillStyle = glowColor;
      for (const dot of dots) {
        if (!dot.glow) continue;
        context.globalAlpha = dot.glow;
        context.beginPath();
        context.arc(dot.x, dot.y, dotSize * (1 + FLASH.grow * dot.glow), 0, TAU);
        context.fill();
      }
      context.globalAlpha = 1;
      drawnAt = now;
    };

    const build = () => {
      [width, height] = [host.clientWidth, host.clientHeight];
      scale = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const step = Math.ceil(width / gap) * Math.ceil(height / gap) > MAX_DOTS ? Math.sqrt((width * height) / MAX_DOTS) : gap;
      const [cols, rows] = [Math.ceil(width / step), Math.ceil(height / step)];
      const [left, top] = [(width - (cols - 1) * step) / 2, (height - (rows - 1) * step) / 2]; // centred
      dots = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const [homeX, homeY] = [left + col * step, top + row * step];
          dots.push({ homeX, homeY, x: homeX, y: homeY, vx: 0, vy: 0, brightness: dotOpacity, glow: 0, phase: Math.random() * TAU });
        }
      }
      draw(performance.now());
      if (paused) syncMirrors();
    };

    // One physics step; true while any dot still moves.
    const physics = () => {
      let moving = false;
      for (const dot of dots) {
        if (mouse) {
          const [dx, dy] = [dot.x - mouse.x, dot.y - mouse.y];
          const dist = Math.hypot(dx, dy);
          if (dist < mouseRadius && dist > 0) {
            const force = (1 - dist / mouseRadius) * strength;
            dot.vx += (dx / dist) * force;
            dot.vy += (dy / dist) * force;
          }
        }
        dot.vx = (dot.vx + (dot.homeX - dot.x) * returnSpeed) * FRICTION;
        dot.vy = (dot.vy + (dot.homeY - dot.y) * returnSpeed) * FRICTION;
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (Math.abs(dot.vx) + Math.abs(dot.vy) > SETTLED) moving = true;
        if (dot.glow) dot.glow = dot.glow < 0.01 ? 0 : dot.glow * FLASH.decay;
      }
      if (dots.length && Math.random() < FLASH.chance) dots[Math.floor(Math.random() * dots.length)].glow = 1;
      return moving;
    };

    const running = () => !still && visible && !paused && !document.hidden;
    const tick = (now) => {
      frame = 0;
      if (!running()) {
        last = 0;
        return;
      }
      carry += last ? Math.min(now - last, STEP_MS * 3) : STEP_MS;
      last = now;
      let moving = false;
      for (; carry >= STEP_MS; carry -= STEP_MS) moving = physics() || moving;
      if (moving || now - drawnAt >= IDLE_MS) draw(now);
      frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame && running()) frame = requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      if (event.pointerType !== 'mouse') return; // touch scrolls the page: no pushing, only the breathing
      const rect = canvas.getBoundingClientRect();
      mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      wake();
    };
    const onLeave = () => {
      mouse = null;
    };
    const onScroll = () => {
      const was = paused;
      paused = window.scrollY > PAUSE_SCROLL;
      if (paused && !was) syncMirrors(); // the cut starts: the flap's copy shows the frame the field stopped on
      wake();
    };

    const resize = new ResizeObserver(build);
    resize.observe(host);
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    onScreen.observe(host);
    if (!still) {
      host.addEventListener('pointermove', onMove, { passive: true });
      host.addEventListener('pointerleave', onLeave);
      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('visibilitychange', wake);
    }
    wake();

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      onScreen.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', wake);
      if (source === canvas) source = null;
    };
  }, [mirror, gap, dotSize, dotColor, dotOpacity, mouseRadius, strength, returnSpeed, glowColor]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full" />;
}
