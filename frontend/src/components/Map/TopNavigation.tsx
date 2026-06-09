import { ChevronLeft, ChevronRight } from "lucide-react";

interface TopNavigationProps {
  activeTitle: string;
  activeSubtitle: string;
  handlePrev: () => void;
  handleNext: () => void;
}

export default function TopNavigation({
  activeTitle,
  activeSubtitle,
  handlePrev,
  handleNext,
}: TopNavigationProps) {
  return (
    <div className="pointer-events-auto absolute! bottom-8 md:bottom-auto top-auto md:top-6 left-1/2 -translate-x-1/2 px-4 md:px-6 py-3 rounded-full flex items-center gap-3 md:gap-5 glass-nav max-w-130 w-[90%] md:w-full justify-between font-cal shadow-md bg-white/80 backdrop-blur-md">
      <button
        onClick={handlePrev}
        className="group text-slate-200 hover:bg-slate-300 rounded-full text-lg p-3 select-none transition-transform active:scale-95 cursor-pointer"
      >
        <ChevronLeft
          className="w-5 h-5 group-hover:text-slate-600"
          strokeWidth={5}
        />
      </button>
      <div className="text-center flex-1">
        <div className="tracking-widest text-xl font-medium text-white">
          {activeTitle}
        </div>
        <div className="text-xs text-slate-200 mt-0.5 font-medium">
          {activeSubtitle}
        </div>
      </div>
      <button
        onClick={handleNext}
        className="group text-slate-200 hover:bg-slate-300 rounded-full text-lg p-3 select-none transition-transform active:scale-95 cursor-pointer"
      >
        <ChevronRight
          className="w-5 h-5 group-hover:text-slate-600"
          strokeWidth={5}
        />
      </button>
    </div>
  );
}
