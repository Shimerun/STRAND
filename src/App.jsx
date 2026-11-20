import { lazy, Suspense, useEffect, useState } from 'react';
import Lenis from 'lenis';
import { useLivePrices } from './lib/livePrices.js';
import { MAIN_ID, hasMouse, prefersReducedMotion, scrollToId, setLenis } from './lib/scroll.js';
import About from './components/About.jsx';
import Booking from './components/booking/Booking.jsx';
import Contacts from './components/Contacts.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/hero/Hero.jsx';
import Intro from './components/Intro.jsx';
import MobileBar from './components/MobileBar.jsx';
import ScissorsLayer from './components/scissors/ScissorsLayer.jsx';
import ScrollWeight from './components/ScrollWeight.jsx';
import Reviews from './components/reviews/Reviews.jsx';
import Services from './components/services/Services.jsx';
import Team from './components/team/Team.jsx';
import Works from './components/works/Works.jsx';

// The custom cursor (and its CSS) loads only on devices with a mouse.
const Cursor = lazy(() => import('./components/cursor/Cursor.jsx'));

const IDLE_TIMEOUT_MS = 2000;
const IDLE_FALLBACK_MS = 200;

// Mount heavy, non-critical UI only after the first paint.
function useAfterFirstPaint() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), IDLE_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, []);

  return ready;
}

function useLenis() {
  useEffect(() => {
    // Touch screens scroll natively and Lenis would only listen to every scroll event there; anchors then use
    // the browser's smooth scroll (scrollToId) and dialogs lock the root element (lockScroll).
    if (prefersReducedMotion() || !hasMouse()) return undefined;
    const lenis = new Lenis({ duration: 1.1 });
    // Frames only while Lenis animates (after a wheel turn or a scrollTo): a loop that never stops makes the
    // browser run a whole rendering pass 60 times a second on a page standing still.
    let frame = 0;
    const loop = (time) => {
      lenis.raf(time);
      frame = lenis.animate.isRunning ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (frame) return;
      lenis.raf(performance.now()); // restarts Lenis's clock, so its first step does not span the pause
      frame = requestAnimationFrame(loop);
    };
    lenis.on('virtual-scroll', ({ event }) => event.type === 'wheel' && wake());
    setLenis(lenis, wake);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
}

// A link to /#section opens at that section. The page is partly laid out by script (the hero pin pulls the next
// section up), so the browser's own jump on load lands in the wrong place; this runs once the layout is in.
function useHashOnLoad() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return undefined;
    const frame = requestAnimationFrame(() => scrollToId(id, { immediate: true }));
    return () => cancelAnimationFrame(frame);
  }, []);
}

export default function App() {
  useLenis();
  useHashOnLoad();
  useLivePrices(); // re-renders the page when prices from the Google Sheet arrive
  const showScissors = useAfterFirstPaint();
  const [showCursor] = useState(hasMouse);
  const [scrollWeight] = useState(() => !prefersReducedMotion());

  return (
    <>
      {scrollWeight && <ScrollWeight />}
      <Intro />
      <Header />
      <main id={MAIN_ID} tabIndex={-1}>
        {/* The section inside the hero is what shows through its cut. */}
        <Hero>
          <About />
        </Hero>
        <Services />
        <Team />
        <Works />
        <Reviews />
        <Booking />
        <Contacts />
      </main>
      <Footer />
      <MobileBar />
      {showScissors && (
        <ErrorBoundary>
          <ScissorsLayer />
        </ErrorBoundary>
      )}
      {showCursor && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Cursor />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}
