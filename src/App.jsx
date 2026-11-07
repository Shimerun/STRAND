import { useEffect } from 'react';
import Lenis from 'lenis';
import { site } from './data/site.js';
import { prefersReducedMotion, scrollToId, setLenis } from './lib/scroll.js';
import { EVENTS } from './lib/track.js';
import Button from './components/Button.jsx';
import Img from './components/Img.jsx';
import Logo from './components/Logo.jsx';
import Reveal from './components/Reveal.jsx';
import Section from './components/Section.jsx';

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

// TODO: Stage 0 shell — replaced by the real sections in Stage 1.
export default function App() {
  useLenis();

  return (
    <main>
      <Section id="top">
        <Logo />
        <Reveal as="h1" className="mt-10 text-3xl md:text-5xl">
          {site.tagline}
        </Reveal>
        <Img src={site.images.hero} alt="" width={1600} height={1067} priority className="mt-10 w-full rounded object-cover" />
        <Button className="mt-8" track={{ name: EVENTS.bookClick }} onClick={() => scrollToId('booking')}>
          {site.ui.cta.book}
        </Button>
      </Section>
    </main>
  );
}
