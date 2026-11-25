import { site } from '../data/site.js';
import { bookingEnabled, externalBookingUrl } from '../lib/booking.js';
import { BOOKING_ID, scrollToId } from '../lib/scroll.js';
import { EVENTS } from '../lib/track.js';
import Button from './Button.jsx';

const toForm = () => scrollToId(BOOKING_ID);

/**
 * The page's main action. While online booking works it leads to the form (`onClick`, the form by default); a
 * build without the booking web app has no form, so the same button opens the shop's EasyWeek page in a new tab,
 * or places the call when there is none. `track`: analytics params ({ where, ... }); `children` follow the label.
 */
export default function BookButton({ label = site.ui.cta.book, onClick = toForm, track = {}, children, ...props }) {
  if (externalBookingUrl) {
    return (
      <Button href={externalBookingUrl} target="_blank" rel="noopener noreferrer" track={{ name: EVENTS.bookClick, ...track }} {...props}>
        {label}
        {children}
      </Button>
    );
  }
  if (!bookingEnabled) {
    return (
      <Button href={`tel:${site.phone}`} track={{ name: EVENTS.callClick, ...track }} {...props}>
        {site.ui.cta.bookByPhone}
        {children}
      </Button>
    );
  }
  return (
    <Button track={{ name: EVENTS.bookClick, ...track }} onClick={onClick} {...props}>
      {label}
      {children}
    </Button>
  );
}
