import Reveal from './Reveal.jsx';

export default function SectionTitle({ className = '', children }) {
  return (
    <Reveal as="h2" className={`text-[1.75rem] leading-tight sm:text-4xl ${className}`}>
      {children}
    </Reveal>
  );
}
