import { PlusCircle } from "lucide-react";

export default function SectionHeader() {
  return (
    <section className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <h2 className="font-righteous text-6xl text-black md:text-8xl">
        Reports
      </h2>

      <button
        type="button"
        onClick={() => (window.location.href = "/add-fish")}
        className="cursor-pointer flex items-center gap-4 rounded-[1.25rem] border border-white/50 bg-white/20 px-10 py-4 font-cal text-3xl text-black backdrop-blur-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
      >
        <PlusCircle size={36} />
        Add Fish
      </button>
    </section>
  );
}

