import { motion, useReducedMotion } from 'framer-motion';
import { hoverLift, tapPress } from '../lib/motion.js';
import { track } from '../lib/track.js';

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded px-6 py-3 text-sm font-bold uppercase tracking-heading transition-colors duration-300';

const VARIANTS = {
  primary: 'bg-text text-bg hover:bg-accent',
  ghost: 'border border-line text-text hover:border-accent',
  link: 'group !px-0 text-text hover:text-accent',
};

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
      href={href}
      type={href ? undefined : type}
      whileHover={reduce ? undefined : hoverLift}
      whileTap={reduce ? undefined : tapPress}
      onClick={handleClick}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  );
}
