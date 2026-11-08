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
import Marquee from './components/Marquee.jsx';
import MobileBar from './components/MobileBar.jsx';
import ScissorsLayer from './components/scissors/ScissorsLayer.jsx';
import ScrollScale from './components/ScrollScale.jsx';
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
    let frame = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    });
    setLenis(lenis);
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

  return (
    <>
      <Intro />
      <Header />
      <main>
        <Hero />
        <About />
        <Team />
        <Services />
        <Marquee />
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
