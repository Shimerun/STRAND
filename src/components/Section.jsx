export default function Section({ id, className = '', children, ...rest }) {
  return (
    <section id={id} className={`scroll-mt-header py-20 md:py-28 ${className}`} {...rest}>
      <div className="mx-auto max-w-6xl pl-5 pr-[var(--gutter)]">{children}</div>
    </section>
  );
}
