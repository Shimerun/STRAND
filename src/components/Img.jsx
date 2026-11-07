import { useState } from 'react';

// Missing or broken files render `fallback`, or a dark placeholder of the same size, never a broken icon.
export default function Img({ src, alt = '', width, height, priority = false, fallback = null, className = '', ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    if (fallback) return fallback;
    return (
      <div
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`bg-surface bg-gradient-to-br from-surface to-bg ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
      {...rest}
    />
  );
}
