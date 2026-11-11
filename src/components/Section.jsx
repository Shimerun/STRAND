// tone="surface" lifts the section onto a lighter band so neighbouring sections read apart.
const TONES = { base: 'band', surface: 'band band-grain bg-surface' };

export default function Section({ id, tone = 'base', className = '', children, ...rest }) {
  return (
    <section id={id} className={`scroll-mt-header py-20 md:py-28 ${TONES[tone]} ${className}`} {...rest}>
      <div className="mx-auto max-w-6xl pl-5 pr-[var(--gutter)]">{children}</div>
    </section>
  );
}
