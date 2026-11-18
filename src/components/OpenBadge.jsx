import { useEffect, useState } from 'react';
import { site } from '../data/site.js';
import { isOpenNow } from '../lib/time.js';

const REFRESH_MS = 60_000;

export default function OpenBadge() {
  const [open, setOpen] = useState(() => isOpenNow(site.hours));
  const { status } = site.ui;

  useEffect(() => {
    const id = setInterval(() => setOpen(isOpenNow(site.hours)), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 rounded border border-line bg-bg/60 px-3 py-1.5 text-xs font-medium uppercase tracking-heading">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-accent' : 'bg-concrete'}`} />
      {open ? status.open : status.closed}
    </span>
  );
}
