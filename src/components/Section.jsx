// tone="surface" lifts the section onto a lighter band so neighbouring sections read apart. The band is painted
// on its own layer under the content (index.css .band-bg), where the cursor's dot trail can go into it.
const TONES = { base: 'band-bg', surface: 'band-bg band-grain bg-surface' };

export default function Section({ id, tone = 'base', className = '', children, ...rest }) {
  return (
    <section id={id} className={`band relative scroll-mt-header py-20 md:py-28 ${className}`} {...rest}>
      <div aria-hidden="true" className={TONES[tone]} />
      <div className="mx-auto max-w-6xl pl-5 pr-[var(--gutter)]">{children}</div>
    </section>
  );
}
