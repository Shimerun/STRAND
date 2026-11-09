import { lazy, Suspense, useEffect, useState } from 'react';
import Lenis from 'lenis';
import { useLivePrices } from './lib/livePrices.js';
import { prefersReducedMotion, setLenis } from './lib/scroll.js';
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
import ScrollScale from './components/ScrollScale.jsx';
import ScrollWeight from './components/ScrollWeight.jsx';
import Reviews from './components/reviews/Reviews.jsx';
import Services from './components/services/Services.jsx';
import Team from './components/team/Team.jsx';
import Works from './components/works/Works.jsx';

// The custom cursor (and its CSS) loads only on devices with a mouse.
const Cursor = lazy(() => import('./components/cursor/Cursor.jsx'));
const hasMouse = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
    if (prefersReducedMotion()) return undefined;
    const lenis = new Lenis({ duration: 1.1 });
    // Lenis needs frames only while it animates a scroll: after a wheel turn or a scrollTo. A loop that never
    // stops makes the browser run a whole rendering pass 60 times a second on a page standing still, and on
    // touch screens, where the scroll is native, Lenis has nothing to animate at all.
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

export default function App() {
  useLenis();
  useLivePrices(); // re-renders the page when prices from the Google Sheet arrive
  const showScissors = useAfterFirstPaint();
  const [showCursor] = useState(hasMouse);
  const [scrollWeight] = useState(() => !prefersReducedMotion());

  return (
    <>
      {scrollWeight && <ScrollWeight />}
      <Intro />
      <Header />
      <main>
        <Hero />
        <About />
        <Team />
        <Works />
        <Services />
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
      {showScissors && (
        <ErrorBoundary>
          <ScrollScale />
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
