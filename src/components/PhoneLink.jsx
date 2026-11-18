import { site } from '../data/site.js';
import { EVENTS, track } from '../lib/track.js';

export default function PhoneLink({ where, className }) {
  return (
    <a href={`tel:${site.phone}`} onClick={() => track(EVENTS.callClick, { where })} className={className}>
      {site.phoneDisplay}
    </a>
  );
}
