import { site } from '../data/site.js';
import { EVENTS, track } from '../lib/track.js';
import InstagramIcon from './InstagramIcon.jsx';
import Logo from './Logo.jsx';
import Stencil from './Stencil.jsx';

export default function Footer() {
  const { instagram } = site.social;

  return (
    // Extra bottom room on mobile so the sticky bar never covers the footer.
    <footer className="border-t border-line pb-28 pt-12 lg:pb-12">
      <Stencil />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 pl-5 pr-[var(--gutter)] md:flex-row md:items-end md:justify-between">
        <div>
          <Logo />
          <address className="mt-5 space-y-1 text-sm not-italic text-concrete">
            <p>{site.address}</p>
            <a
              href={`tel:${site.phone}`}
              onClick={() => track(EVENTS.callClick, { where: 'footer' })}
              className="inline-block text-text transition-colors duration-300 hover:text-concrete"
            >
              {site.phoneDisplay}
            </a>
          </address>
        </div>

        <div className="flex items-center gap-4">
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="-ml-3 flex h-11 w-11 items-center justify-center rounded text-concrete transition-colors duration-300 hover:text-text"
            >
              <InstagramIcon />
            </a>
          )}
          <p className="text-xs text-concrete">
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
