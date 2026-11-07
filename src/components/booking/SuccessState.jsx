import { useEffect, useRef } from 'react';
import { site } from '../../data/site.js';

// Takes focus because the form (and the focused submit button) disappears.
export default function SuccessState() {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div ref={ref} tabIndex={-1} className="flex items-start gap-4 outline-none">
      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent text-accent">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      </span>
      <p className="pt-2 text-lg font-bold">{site.ui.form.success}</p>
    </div>
  );
}
