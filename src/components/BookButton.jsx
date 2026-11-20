import { site } from '../data/site.js';
import { bookingEnabled } from '../lib/booking.js';
import { BOOKING_ID, scrollToId } from '../lib/scroll.js';
import { EVENTS } from '../lib/track.js';
import Button from './Button.jsx';

const toForm = () => scrollToId(BOOKING_ID);

/**
 * The page's main action. While online booking works it leads to the form (`onClick`, the form by default); a
 * build without the booking web app has no form, so the same button places the call instead. `track`: analytics
 * params ({ where, ... }); `children` follow the label (an arrow).
 */
export default function BookButton({ label = site.ui.cta.book, onClick = toForm, track = {}, children, ...props }) {
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
