import { useLayoutEffect } from 'react';
import { readPlanes, writePlanes } from './portalPlanes.js';

/**
 * Measures the hero for its cut (frame size and pin into the width / height / pin motion values) and lays the underlay
 * under it (pulled up by the section's height, its resting place in data-rest-top), with the planes of the flight
 * read into scene.current. A layout effect: the underlay is pulled up before the first paint (after it: a layout
 * shift of 1.0). flight: the motion value placing the planes (useHeroCut).
 */
export function useHeroMeasure({ sectionRef, frameRef, underlayRef, enabled, width, height, pin, flight, scene }) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const frame = frameRef.current;
    const underlay = underlayRef.current;
    const wrapper = underlay?.parentElement;
    let measured = '';
    let raf = 0;
    // Every read comes before the first write, so a measure costs one layout at most, and a size seen already
    // writes nothing (the observer's first call, fonts that change no height).
    const measure = () => {
      raf = 0;
      const sectionHeight = section.offsetHeight;
      const frameWidth = frame.offsetWidth;
      const frameHeight = frame.offsetHeight;
      const pinPx = Math.max(sectionHeight - frameHeight, 0);
      const restTop = section.offsetTop + pinPx;
      const key = `${frameWidth} ${frameHeight} ${sectionHeight} ${restTop}`;
      if (key === measured) return;
      measured = key;
      // Offsets are layout only: the transforms already on the planes never skew them.
      const planes = enabled && underlay ? readPlanes(underlay, frameWidth, frameHeight) : null;
      width.set(frameWidth);
      height.set(frameHeight);
      pin.set(pinPx);
      if (!planes) return;
      // Up to the top of the hero, beneath it; where the content comes to rest once the pin is over.
      wrapper.style.marginTop = `-${sectionHeight}px`;
      underlay.dataset.restTop = String(restTop);
      scene.current = planes;
      writePlanes(scene.current, flight.get());
    };
    measure();
    // Later changes wait for the next frame: one measure for any number of notifications, and the margin it writes
    // (the page height) no longer changes in the middle of another observer's round, which Safari reported as a
    // ResizeObserver loop.
    const observer = new ResizeObserver(() => {
      raf ||= requestAnimationFrame(measure);
    });
    observer.observe(section);
    observer.observe(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      if (!underlay) return;
      wrapper.style.marginTop = '';
      delete underlay.dataset.restTop;
      writePlanes(scene.current, null);
      scene.current = null;
    };
  }, [sectionRef, frameRef, underlayRef, enabled, width, height, pin, flight, scene]);
}
