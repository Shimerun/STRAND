import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { prefersReducedMotion, setLenis } from './lib/scroll.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Intro from './components/Intro.jsx';
import ScissorsLayer from './components/scissors/ScissorsLayer.jsx';

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
  const showScissors = useAfterFirstPaint();

  return (
    <>
      <Intro />
      <Header />
      <main>
        <Hero />
        {/* TODO: remove in Stage 2 — dev-only scroll room for checking the scissors track. */}
        {import.meta.env.DEV && <div aria-hidden="true" className="h-[400vh]" />}
      </main>
      {showScissors && (
        <ErrorBoundary>
          <ScissorsLayer />
        </ErrorBoundary>
      )}
    </>
  );
}
