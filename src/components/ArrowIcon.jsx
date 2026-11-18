// The round-capped stroke icon shell, shared with CheckIcon.
export function StrokeIcon({ d, size, strokeWidth, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export default function ArrowIcon({ size = 16, className = '' }) {
  return <StrokeIcon d="M5 12h14M13 6l6 6-6 6" size={size} strokeWidth="2" className={className} />;
}
