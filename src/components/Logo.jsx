import { useState } from 'react';
import { site } from '../data/site.js';

// Text wordmark until the logo file actually loads; a missing file keeps the wordmark.
export default function Logo({ className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const src = site.images.logo;

  return (
    <span className={`inline-flex items-center ${className}`}>
      {src && (
        <img
          src={src}
          alt={site.name}
          onLoad={() => setLoaded(true)}
          className={loaded ? 'block h-9 w-auto' : 'hidden'}
        />
      )}
      {!loaded && (
        <span className="flex flex-col uppercase leading-none">
          <span className="text-xl font-extrabold tracking-wordmark">{site.name}</span>
          <span className="mt-1 text-[0.55rem] font-medium tracking-wordmark text-concrete">{site.ui.brand.sub}</span>
        </span>
      )}
    </span>
  );
}
