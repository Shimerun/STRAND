import { useCallback, useRef, useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';

const GLINT_S = 0.35;

/** Each time the blades close, a short glint at the cutting point. */
export default function CutDebris({ state }) {
  const [glints, setGlints] = useState([]);
  const closings = useRef(state.get()?.closings ?? 0);
  const nextId = useRef(0);
  const remove = useCallback((id) => setGlints((list) => list.filter((glint) => glint.id !== id)), []);

  useMotionValueEvent(state, 'change', (s) => {
    const done = s?.closings ?? 0;
    if (s && done > closings.current) {
      const id = ++nextId.current;
      setGlints((list) => [...list, { id, x: s.cutEnd.x, y: s.cutEnd.y }]);
    }
    closings.current = done;
  });

  return glints.map(({ id, x, y }) => (
    <div key={id} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <motion.span
        className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-[radial-gradient(circle,rgba(242,242,242,0.95),transparent_70%)]"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: GLINT_S, ease: 'easeOut' }}
        onAnimationComplete={() => remove(id)}
      />
    </div>
  ));
}
