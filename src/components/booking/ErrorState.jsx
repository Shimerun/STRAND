import { site } from '../../data/site.js';
import PhoneLink from '../PhoneLink.jsx';

export default function ErrorState() {
  return (
    <p className="text-sm text-danger">
      {site.ui.form.errorText}{' '}
      <PhoneLink where="booking_error" className="whitespace-nowrap font-bold text-text underline underline-offset-4" />
    </p>
  );
}
