import { site } from '../../data/site.js';
import { EVENTS, track } from '../../lib/track.js';

export default function ErrorState() {
  return (
    <p className="text-sm text-danger">
      {site.ui.form.errorText}{' '}
      <a
        href={`tel:${site.phone}`}
        onClick={() => track(EVENTS.callClick, { where: 'booking_error' })}
        className="whitespace-nowrap font-bold text-text underline underline-offset-4"
      >
        {site.phoneDisplay}
      </a>
    </p>
  );
}
