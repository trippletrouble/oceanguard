import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Section({ id, title, children, className = '' }: SectionProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = 800;
      setIsScrolled(window.scrollY >= threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section 
      id={id} 
      className={`scroll-mt-24 px-6 md:px-48 ${className}`}
    >
      <div className="glass-card-compact rounded-4xl p-6 md:p-8">
        <h2 className={`${isScrolled ? "text-white/90" : "text-black"} text-2xl md:text-4xl mb-6`}>
          {title}
        </h2>
        <div className={`${isScrolled ? "text-white/90" : "text-black"} text-base md:text-2xl leading-relaxed`}>
          {children}
        </div>
      </div>
    </section>
  );
}