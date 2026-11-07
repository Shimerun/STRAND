import { useEffect } from 'react';
import Lenis from 'lenis';
import { prefersReducedMotion, setLenis } from './lib/scroll.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Intro from './components/Intro.jsx';

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

  return (
    <>
      <Intro />
      <Header />
      <main>
        <Hero />
      </main>
    </>
  );
}
