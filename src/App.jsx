import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { prefersReducedMotion, setLenis } from './lib/scroll.js';
import About from './components/About.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Intro from './components/Intro.jsx';
import ScissorsLayer from './components/scissors/ScissorsLayer.jsx';
import Services from './components/Services.jsx';
import Team from './components/team/Team.jsx';

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
        <About />
        <Services />
        <Team />
      </main>
      {showScissors && (
        <ErrorBoundary>
          <ScissorsLayer />
        </ErrorBoundary>
      )}
    </>
  );
}
