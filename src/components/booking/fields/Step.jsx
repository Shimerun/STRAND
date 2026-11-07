// One numbered block of the booking form; a hairline separates it from the previous one.
export default function Step({ index, title, children }) {
  return (
    <div className="space-y-6 border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h3 className="flex items-baseline gap-3 text-sm">
        <span className="tabular-nums text-concrete">{String(index).padStart(2, '0')}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}
