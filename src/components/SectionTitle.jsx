import Reveal from './Reveal.jsx';

// The number above the title is a CSS counter (index.css), so sections stay numbered in page order.
export default function SectionTitle({ className = '', children }) {
  return (
    <div className={className}>
      <Reveal
        aria-hidden="true"
        className="section-index mb-4 flex items-center gap-3 text-xs font-medium tracking-heading text-concrete"
      >
        <span className="h-px w-10 bg-concrete/50" />
      </Reveal>
      <Reveal as="h2" className="text-[1.75rem] leading-tight sm:text-4xl">
        {children}
      </Reveal>
    </div>
  );
}
