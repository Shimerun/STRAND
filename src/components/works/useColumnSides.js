import { useEffect, useState } from 'react';

/**
 * Which side each photo of the works grid opens from: the outer columns from their outer edge, a middle one
 * from the bottom. The column of each item is read from the layout, so it follows the breakpoints.
 */
export function useColumnSides(listRef) {
  const [columns, setColumns] = useState([]);

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
  return (index) => {
    const column = columns[index];
    if (count < 2 || column === undefined) return 'sides';
    if (column === 0) return 'left';
    return column === count - 1 ? 'right' : 'bottom';
  };
}
