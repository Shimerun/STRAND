import { useState } from 'react';
import { site } from '../data/site.js';
import { assetUrl } from '../lib/assetUrl.js';

// Text wordmark until the logo file actually loads; a missing file keeps the wordmark.
export default function Logo({ className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const src = assetUrl(site.images.logo);

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
        <span className="relative flex flex-col uppercase leading-none">
          <span className="sr-only">{`${site.name} ${site.ui.brand.sub}`}</span>
          {/* The negative margin drops the tracking after the last letter, so the sub line spans exactly under the name. */}
          <span aria-hidden="true" className="mr-[-0.32em] text-xl font-extrabold tracking-wordmark">
            {site.name}
          </span>
          <span aria-hidden="true" className="mt-1.5 flex justify-between text-[0.625rem] font-medium text-concrete">
            {[...site.ui.brand.sub].map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}
