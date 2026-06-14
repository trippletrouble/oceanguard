import { useQuery } from "@tanstack/react-query";
import { fetchAllSpecies } from "../services/api";

export default function LandingPage() {
  const { data: rawSpecies, isLoading } = useQuery({
    queryKey: ["all-species"],
    queryFn: fetchAllSpecies,
    staleTime: 60 * 60 * 1000,
  });

  if (!isLoading) {
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

  return <></>;
}
