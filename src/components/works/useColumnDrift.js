import { useEffect, useState } from 'react';
import { useScroll, useTransform } from 'framer-motion';

// px a column is shifted at either end of the pass, times its factor: the middle column rises against the outer ones.
const DRIFT_PX = 48;
const FACTORS = [-0.35, 1, -0.35];

/**
 * Masonry columns that drift apart as the list scrolls past. The column of each item is read from the
 * layout (CSS columns), so it follows the breakpoints and the photos' heights. Also tells each photo which
 * side to open from: the outer columns from their outer edge, a middle one from the bottom.
 */
export function useColumnDrift(listRef) {
  const [columns, setColumns] = useState([]);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start end', 'end start'] });
  const shift = (factor) => [DRIFT_PX * factor, -DRIFT_PX * factor];
  const drift = [
    useTransform(scrollYProgress, [0, 1], shift(FACTORS[0])),
    useTransform(scrollYProgress, [0, 1], shift(FACTORS[1])),
    useTransform(scrollYProgress, [0, 1], shift(FACTORS[2])),
  ];

  useEffect(() => {
    const list = listRef.current;
    const measure = () => {
      const lefts = [...list.children].map((item) => Math.round(item.getBoundingClientRect().left));
      const edges = [...new Set(lefts)].sort((a, b) => a - b);
      const next = lefts.map((left) => edges.indexOf(left));
      setColumns((current) => (current.join() === next.join() ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef]);

  const count = columns.length ? Math.max(...columns) + 1 : 0;
  const openFrom = (column) => {
    if (count < 2 || column === undefined) return 'sides';
    if (column === 0) return 'left';
    return column === count - 1 ? 'right' : 'bottom';
  };

  // Per item: its drift motion value (undefined until measured) and the side its photo opens from.
  return (index) => ({ y: drift[columns[index]], from: openFrom(columns[index]) });
}
