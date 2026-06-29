import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Section({ id, title, children, className = '' }: SectionProps) {
  return (
    <section 
      id={id} 
      className={`scroll-mt-24 px-2 md:px-4 ${className}`}
    >
      <div className="glass-card-compact rounded-4xl p-6 md:p-8">
        <h2 className="text-2xl md:text-4xl font-bold mb-2 text-white">
          {title}
        </h2>
        <div className="text-white/90 text-base md:text-xl leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}