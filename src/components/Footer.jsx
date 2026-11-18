import { site } from '../data/site.js';
import Closing from './Closing.jsx';
import InstagramIcon from './InstagramIcon.jsx';
import Logo from './Logo.jsx';
import PhoneLink from './PhoneLink.jsx';
import Stencil from './Stencil.jsx';

export default function Footer() {
  const { instagram } = site.social;

  return (
    // Extra bottom room on mobile so the sticky bar never covers the footer.
    <footer className="border-t border-line pb-28 pt-12 lg:pb-12">
      <Stencil>
        <Closing />
      </Stencil>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 pl-5 pr-[var(--gutter)] md:flex-row md:items-end md:justify-between">
        <div>
          <Logo />
          <address className="mt-5 space-y-1 text-sm not-italic text-concrete">
            <p>{site.address}</p>
            <PhoneLink
              where="footer"
              // The before: box stretches the tap target to 44px without moving the text.
              className="relative inline-block text-text transition-colors duration-300 before:absolute before:inset-x-0 before:-inset-y-3 hover:text-concrete"
            />
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
