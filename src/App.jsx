import { lazy, Suspense, useEffect, useState } from 'react';
import Lenis from 'lenis';
import { useLivePrices } from './lib/livePrices.js';
import { usePrefersReducedMotion } from './lib/useMediaQuery.js';
import { useKeepPlaceAcross, usePlaceOnLoad } from './lib/usePlace.js';
import { MAIN_ID, hasMouse, setLenis } from './lib/scroll.js';
import About from './components/About.jsx';
import Booking from './components/booking/Booking.jsx';
import Contacts from './components/Contacts.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/hero/Hero.jsx';
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

// Mount heavy, non-critical UI (the shears) once the page has loaded and the browser is idle: the headline and
// the booking button never wait for it, nor share the network or the main thread with it.
function useAfterLoad() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const whenIdle = () => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => setReady(true), { timeout: IDLE_TIMEOUT_MS });
      else timer = window.setTimeout(() => setReady(true), IDLE_FALLBACK_MS);
    };
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
    return () => {
      window.removeEventListener('load', whenIdle);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  return ready;
}

function useLenis(reduce) {
  useEffect(() => {
    // Touch screens scroll natively and Lenis would only listen to every scroll event there; anchors then use
    // the browser's smooth scroll (scrollToId) and dialogs lock the root element (lockScroll).
    if (reduce || !hasMouse()) return undefined;
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
  }, [reduce]);
}

export default function App() {
  const reduce = usePrefersReducedMotion();
  useLenis(reduce);
  useKeepPlaceAcross(reduce);
  usePlaceOnLoad();
  useLivePrices(); // re-renders the page when prices from the Google Sheet arrive
  const showScissors = useAfterLoad();
  const [showCursor] = useState(hasMouse);

  return (
    <>
      {!reduce && <ScrollWeight />}
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
