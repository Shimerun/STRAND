// tone="surface" lifts the section onto a lighter band so neighbouring sections read apart. The band is painted
// on its own layer under the content (index.css .band-bg), where the cursor's dot trail can go into it.
const TONES = { base: 'band-bg', surface: 'band-bg band-grain bg-surface' };

// gutter={false}: symmetric side padding, for a section the shears have already left (they fade out at the booking form).
export default function Section({ id, tone = 'base', gutter = true, className = '', children, ...rest }) {
  return (
    <section id={id} className={`band relative scroll-mt-header py-20 md:py-28 ${className}`} {...rest}>
      <div aria-hidden="true" className={TONES[tone]} />
      <div className={`mx-auto max-w-6xl pl-5 ${gutter ? 'pr-[var(--gutter)]' : 'pr-5'}`}>{children}</div>
    </section>
  );
}
