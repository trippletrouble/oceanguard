import { useQuery } from "@tanstack/react-query";
import { fetchAllSpecies } from "../services/api";
import Header from "@/components/Header";
import LandingInfoBox from "@/components/LandingInfoBox";
import { Fishes } from "@/components/Fishes";

export default function LandingPage() {
  const { data: rawSpecies, isLoading } = useQuery({
    queryKey: ["all-species"],
    queryFn: fetchAllSpecies,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-ocean text-white font-cal select-none">
        <div className="relative w-18 h-18 flex items-center justify-center mb-8">
          <div className="wave-ripple"></div>
          <div className="wave-ripple wave-ripple-delayed"></div>
        </div>
        <h2 className="text-xl tracking-wider">Loading...</h2>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="w-full flex flex-col gap-12 overflow-x-hidden">
        <section className="w-full flex flex-col gap-4 justify-center items-center text-center max-w-xl mx-auto pt-48">
          <h1 className="title uppercase font-righteous tracking-tighter animate-float-heading">
            Ocean
            <br />
            Guard
          </h1>

          <p className="max-w-md mx-auto text-center text-xl md:text-2xl mt-6 mb-8 leading-relaxed text-balance animate-float-text">
            Critical ocean data exists—but without integration, high-risk
            fishing activity goes undetected.
          </p>

          <button
            onClick={() => (window.location.href = "/map")}
            className="animate-float-btn cursor-pointer font-medium text-lg md:text-xl rounded-full w-full max-w-sm py-4 shadow-xl bg-linear-to-r from-[#FF6C6C] to-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            View Live Risk Map
          </button>
        </section>

        <LandingInfoBox />

        <div className="w-full">
          <Fishes speciesData={rawSpecies || []} />
        </div>
      </main>
    </>
  );
}
