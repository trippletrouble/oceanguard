import { type ReactNode, useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";

interface SectionProps {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export default function Section({
  id,
  title,
  children,
  className = "",
}: SectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.12 });

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 1, 0.5, 1],
      },
    },
  };

  return (
    <motion.section
      id={id}
      ref={containerRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className="w-full max-w-5xl mx-auto px-4 md:px-0 scroll-mt-28"
    >
      <div
        className={`w-full bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 md:px-10 md:py-12 border border-white/60 ${className}`}
      >
        <div className="w-full flex flex-col items-center justify-center mb-4">
          <div className="overflow-hidden relative py-2 px-4 block">
            <motion.h2
              variants={{
                hidden: { translateY: "140%" },
                visible: {
                  translateY: 0,
                  transition: {
                    duration: 1.1,
                    ease: [0.25, 1, 0.5, 1],
                  },
                },
              }}
              className="font-righteous text-2xl md:text-4xl uppercase tracking-[0.25em] text-[#003a95] whitespace-normal block"
            >
              {title}
            </motion.h2>
          </div>
        </div>

        <div className="w-full text-slate-700 font-cal font-normal tracking-wide text-lg md:text-xl leading-relaxed">
          {children}
        </div>
      </div>
    </motion.section>
  );
}

