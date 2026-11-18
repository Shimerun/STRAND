import { forwardRef } from 'react';
import { site } from '../data/site.js';

export default forwardRef(function CloseButton({ onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={site.ui.cta.close}
      onClick={onClick}
      className="-mr-3 flex h-12 w-12 items-center justify-center rounded"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
});
