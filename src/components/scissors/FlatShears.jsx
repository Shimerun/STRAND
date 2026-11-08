import { useCallback, useLayoutEffect, useRef } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import Shears2D, { SVG } from './Shears2D.jsx';

/**
 * The flat shears driven by motion values, for small cutting scenes: pivot at (x, y) px in the positioned
 * parent, tips pointing `angle` degrees (0 = up, 90 = right), blades open by `open` (0 shut … 1 wide),
 * shown while `visibility` is 'visible'. blade: pivot-to-tip length in px.
 */
export default function FlatShears({ x, y, angle, open, visibility, blade = 24, maxOpen = 24 }) {
  const svgRef = useRef(null);
  const halfARef = useRef(null);
  const halfBRef = useRef(null);

  const setOpen = useCallback(
    (value) => {
      halfARef.current?.setAttribute('transform', `rotate(${-maxOpen * value} ${SVG.pivot})`);
      halfBRef.current?.setAttribute('transform', `rotate(${maxOpen * value} ${SVG.pivot})`);
    },
    [maxOpen],
  );

  // Before the first paint: pivot on the wrapper origin, scaled to size; never shown full size.
  useLayoutEffect(() => {
    svgRef.current.style.transform = `translate3d(${-SVG.cx}px, ${-SVG.cy}px, 0) scale(${blade / SVG.blade})`;
    setOpen(open.get());
  }, [blade, open, setOpen]);
  useMotionValueEvent(open, 'change', setOpen);

  return (
    <motion.div aria-hidden="true" style={{ x, y, rotate: angle, visibility }} className="pointer-events-none absolute left-0 top-0 z-10">
      <Shears2D svgRef={svgRef} halfARef={halfARef} halfBRef={halfBRef} />
    </motion.div>
  );
}
