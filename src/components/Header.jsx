import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion';
import { site } from '../data/site.js';
import { MAIN_ID, TOP_ID, scrollToId } from '../lib/scroll.js';
import BookButton from './BookButton.jsx';
import Logo from './Logo.jsx';
import MobileMenu from './MobileMenu.jsx';
import ScrollProgress from './ScrollProgress.jsx';
import SpinningPole from './SpinningPole.jsx';

const SCROLLED_AT_PX = 80;
const MENU_ID = 'mobile-menu';

// From the shared scroll value (read once per frame for the whole page), not a scroll listener of its own.
function useScrolled(threshold) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(() => window.scrollY > threshold);

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > threshold));

  return scrolled;
}

const goTo = (id) => (event) => {
  event.preventDefault();
  scrollToId(id);
};

export default function Header() {
  const scrolled = useScrolled(SCROLLED_AT_PX);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef(null);
  const { nav, cta } = site.ui;

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  return (
    <>
      {/* First in the tab order; shown only while focused. */}
      <a
        href={`#${MAIN_ID}`}
        className="fixed left-4 top-3 z-[110] -translate-y-24 rounded bg-text px-4 py-3 text-sm font-bold text-bg transition-transform duration-150 focus:translate-y-0 motion-reduce:transition-none"
      >
        {cta.skip}
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-header border-b transition-colors duration-300 ${
          scrolled ? 'border-line bg-bg' : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-5">
          <a href={`#${TOP_ID}`} onClick={goTo(TOP_ID)} className="flex items-center gap-3 rounded">
            <SpinningPole />
            <Logo />
          </a>

          <nav aria-label={cta.menu} className="hidden lg:block">
            <ul className="flex items-center gap-4 xl:gap-7">
              {nav.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={goTo(id)}
                    className="whitespace-nowrap text-xs font-medium uppercase tracking-heading text-concrete transition-colors duration-150 hover:text-text"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden lg:block">
            <BookButton track={{ where: 'header' }} className="whitespace-nowrap" />
          </div>

          <button
            ref={toggleRef}
            type="button"
            aria-label={cta.menu}
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            onClick={() => setMenuOpen(true)}
            className="-mr-3 flex h-12 w-12 items-center justify-center rounded lg:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 8h18M3 16h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        <ScrollProgress visible={scrolled} />
      </header>

      <AnimatePresence>{menuOpen && <MobileMenu id={MENU_ID} onClose={closeMenu} />}</AnimatePresence>
    </>
  );
}
