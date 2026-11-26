import { useEffect, useState } from 'react';
import { site } from '../data/site.js';
import { isOpenNow, kyivNow, nextOpening } from '../lib/time.js';

const REFRESH_MS = 60_000;

// "Відчинено до 21:00" while open, "Зачинено · з 10:00" while closed.
// shortcut: the reopening names no weekday, fine while every day has hours; add the day once one has none.
function readStatus() {
  const { status } = site.ui;
  const now = kyivNow();
  if (isOpenNow(site.hours, now)) return { open: true, text: status.open.replace('{time}', site.hours[now.weekday].close) };
  const reopens = nextOpening(site.hours, now);
  return { open: false, text: reopens ? status.reopens.replace('{time}', reopens) : status.closed };
}

export default function OpenBadge() {
  const [{ open, text }, setStatus] = useState(readStatus);

  useEffect(() => {
    const id = setInterval(() => setStatus(readStatus()), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 rounded border border-line bg-bg/60 px-3 py-1.5 text-xs font-medium uppercase tracking-heading">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-accent' : 'bg-concrete'}`} />
      {text}
    </span>
  );
}
