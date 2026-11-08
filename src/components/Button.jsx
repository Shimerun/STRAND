import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';
import { hoverLift, tapPress } from '../lib/motion.js';
import { track } from '../lib/track.js';

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded px-6 py-3 text-sm font-bold uppercase tracking-heading transition-colors duration-300';

const VARIANTS = {
  primary: 'bg-text text-bg hover:bg-accent',
  ghost: 'border border-line text-text hover:border-accent',
  link: 'group !px-0 text-text hover:text-accent',
};

// Primary buttons lean towards a mouse that comes within `reach` px of their edge.
const MAGNET = { reach: 70, pull: 0.25, max: 10, spring: { stiffness: 220, damping: 18, mass: 0.4 } };
const hasMouse = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clampMax = (value) => Math.min(Math.max(value, -MAGNET.max), MAGNET.max);

function useMagnet(enabled) {
  const ref = useRef(null);
  const x = useSpring(0, MAGNET.spring);
  const y = useSpring(0, MAGNET.spring);

  useEffect(() => {
    if (!enabled) return undefined;
    const onMove = (event) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      // Measured from the resting centre, so the button's own shift does not feed back.
      const dx = event.clientX - (rect.left + rect.width / 2 - x.get());
      const dy = event.clientY - (rect.top + rect.height / 2 - y.get());
      const near = Math.abs(dx) < rect.width / 2 + MAGNET.reach && Math.abs(dy) < rect.height / 2 + MAGNET.reach;
      const over = Math.abs(dx) < rect.width / 2 && Math.abs(dy) < rect.height / 2;
      x.set(near ? clampMax(dx * MAGNET.pull) : 0);
      y.set(near ? clampMax(dy * MAGNET.pull) + (over ? hoverLift.y : 0) : 0);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled, x, y]);

  return { ref, style: enabled ? { x, y } : undefined };
}

export default function Button({
  variant = 'primary',
  href,
  type = 'button',
  track: trackEvent,
  onClick,
  className = '',
  children,
  ...rest
}) {
  const reduce = useReducedMotion();
  const [mouse] = useState(hasMouse);
  const magnetic = variant === 'primary' && mouse && !reduce;
  const magnet = useMagnet(magnetic);
  const Comp = href ? motion.a : motion.button;

  const handleClick = (event) => {
    if (trackEvent) {
      const { name, ...params } = trackEvent;
      track(name, params);
    }
    onClick?.(event);
  };

  return (
    <Comp
      ref={magnet.ref}
      href={href}
      type={href ? undefined : type}
      style={magnet.style}
      // Magnetic buttons get their hover lift from the magnet; the others lift on hover.
      whileHover={reduce || magnetic ? undefined : hoverLift}
      whileTap={reduce ? undefined : tapPress}
      onClick={handleClick}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  );
}
