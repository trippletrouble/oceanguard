import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedTextProps {
  children: string;
}

export default function AnimatedText({ children }: AnimatedTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const [wordLayoutInfo, setWordLayoutInfo] = useState<
    { lineIdx: number; wordIdxInLine: number }[]
  >([]);
  const [measured, setMeasured] = useState(false);

  const words = children.trim().split(/\s+/);

  const DURATION = 0.8;
  const LINE_STAGGER = 0.2;
  const WORD_STAGGER = 0.025;

  useEffect(() => {
    if (!isInView || measured) return;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;

      const items = Array.from(el.children) as HTMLElement[];
      if (!items.length) return;

      const baseTop = el.getBoundingClientRect().top;
      let prevY = -1;
      let lineIdx = -1;
      let wordIdxInLine = 0;

      const layoutData = items.map((item) => {
        const y = Math.round(item.getBoundingClientRect().top - baseTop);

        if (y > prevY + 2) {
          prevY = y;
          lineIdx++;
          wordIdxInLine = 0;
        } else {
          wordIdxInLine++;
        }

        return { lineIdx, wordIdxInLine };
      });

      setWordLayoutInfo(layoutData);
      setMeasured(true);
    };

    document.fonts.ready.then(() => {
      requestAnimationFrame(() => requestAnimationFrame(measure));
    });
  }, [isInView, measured]);

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap gap-x-[0.25em] gap-y-0 m-0 p-0 leading-relaxed alignment-fix relative w-full"
    >
      {words.map((word, i) => {
        const layout = wordLayoutInfo[i] ?? { lineIdx: 0, wordIdxInLine: 0 };

        const delay =
          0.1 +
          layout.lineIdx * LINE_STAGGER +
          layout.wordIdxInLine * WORD_STAGGER;

        return (
          <span
            key={i}
            className="overflow-hidden inline-block relative m-0 p-0"
          >
            <span className="invisible inline-block select-none pointer-events-none">
              {word}
            </span>
            <motion.span
              className="absolute inset-0 inline-block whitespace-nowrap"
              initial={{ y: "105%", opacity: 0 }}
              animate={
                isInView && measured
                  ? { y: 0, opacity: 1 }
                  : { y: "105%", opacity: 0 }
              }
              transition={{
                duration: DURATION,
                ease: [0.215, 0.61, 0.355, 1],
                delay: isInView && measured ? delay : 0,
              }}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </div>
  );
}
