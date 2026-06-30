import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllSpecies,
  fetchMigrationZone,
  createReport,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import AddFishRegionsMap from "../components/Map/AddFishRegionsMap";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, CheckCircle2, X } from "lucide-react";
import { getClosestSea, SEAS } from "../types/map";

interface SpeciesProps {
  id: string;
  common_name: string;
  scientific_name: string;
  description: string;
  active?: boolean;
  region: string;
}

interface ZonePayload {
  speciesId: string;
  zoneData?: {
    zones?: MigrationZone[];
  };
}

interface MigrationZone {
  center?:
    | {
        lng?: number;
        lat?: number;
      }
    | [number, number];
  radius_km?: number;
}

interface ResolvedRegion {
  name: string;
  bbox: [number, number, number, number];
}

interface BannerState {
  speciesName: string;
  regionName: string;
  bbox: [number, number, number, number];
}

const getCleanedFishNames = (commonName: string) => {
  if (!commonName) return { displayName: "", imgSlug: "fallback-fish" };

  const rawName = commonName.trim();
  let displayName = rawName;

  if (rawName.toLowerCase() === "atlantic bluefin tuna") {
    displayName = "Bluefin Tuna";
  } else if (rawName.toLowerCase() === "european sardine") {
    displayName = "Sardine";
  }

  const imgSlug = displayName
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

  return { displayName, imgSlug };
};

export default function AddFishPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedRegionIndex, setSelectedRegionIndex] = useState<
    Record<string, number>
  >({});
  const [selectedSpeciesId, setSelectedSpeciesId] = useState("");
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [submittingSpeciesId, setSubmittingSpeciesId] = useState<string | null>(
    null,
  );

  const { data: rawSpecies, isLoading: isSpeciesLoading } = useQuery<
    SpeciesProps[]
  >({
    queryKey: ["all-species"],
    queryFn: fetchAllSpecies,
    staleTime: 60 * 60 * 1000,
  });

  // Query to fetch migration zones for active species
  const { data: rawZones, isLoading: isZonesLoading } = useQuery<ZonePayload[]>(
    {
      queryKey: ["migration-zones", currentMonth],
      queryFn: async () => {
        if (!rawSpecies) return [];
        const activeSpecies = rawSpecies.filter((sp) => sp.active !== false);
        return await Promise.all(
          activeSpecies.map(async (sp) => {
            const zoneData = await fetchMigrationZone(sp.id, currentMonth);
            return { speciesId: sp.id, zoneData };
          }),
        );
      },
      staleTime: 15 * 60 * 1000,
      enabled: !!rawSpecies && rawSpecies.length > 0,
    },
  );

  // Resolve regions & bboxes for each species
  const speciesRegionsMap = useMemo<Record<string, ResolvedRegion[]>>(() => {
    if (!rawSpecies) return {};

    const resultMap: Record<string, ResolvedRegion[]> = {};

    rawSpecies.forEach((sp) => {
      const resolvedList: ResolvedRegion[] = [];
      const matchedZonePayload = rawZones?.find(
        (z) => z.speciesId === sp.id,
      )?.zoneData;
      const zones = matchedZonePayload?.zones || [];

      if (zones.length > 0) {
        zones.forEach((zone) => {
          const lng = Array.isArray(zone.center)
            ? zone.center[0]
            : zone.center?.lng;
          const lat = Array.isArray(zone.center)
            ? zone.center[1]
            : zone.center?.lat;

          if (lng !== undefined && lat !== undefined) {
            const radiusKm = zone.radius_km || 100;
            const buffer = radiusKm / 111; // 1 degree latitude ~ 111km

            const min_lat = lat - buffer;
            const min_lng = lng - buffer;
            const max_lat = lat + buffer;
            const max_lng = lng + buffer;

            const seaName = getClosestSea(lng, lat);
            resolvedList.push({
              name: seaName,
              bbox: [
                Number(min_lat.toFixed(4)),
                Number(min_lng.toFixed(4)),
                Number(max_lat.toFixed(4)),
                Number(max_lng.toFixed(4)),
              ],
            });
          }
        });
      }

      // Fallback: If no zones returned or map failed, parse the species region string from db
      if (resolvedList.length === 0) {
        const rawRegions = sp.region.split("/").map((r) => r.trim());
        rawRegions.forEach((regName) => {
          // Attempt to find matching predefined sea center coordinates for bounding box calculation
          const matchedSea = SEAS.find((s) =>
            s.name.toLowerCase().includes(regName.toLowerCase()),
          );
          const defaultCenter = matchedSea ? matchedSea.center : [5.0, 48.0]; // fallback global overview center
          const buffer = 150 / 111; // assume default 150km radius

          const min_lat = defaultCenter[1] - buffer;
          const min_lng = defaultCenter[0] - buffer;
          const max_lat = defaultCenter[1] + buffer;
          const max_lng = defaultCenter[0] + buffer;

          resolvedList.push({
            name: matchedSea ? matchedSea.name : regName,
            bbox: [
              Number(min_lat.toFixed(4)),
              Number(min_lng.toFixed(4)),
              Number(max_lat.toFixed(4)),
              Number(max_lng.toFixed(4)),
            ],
          });
        });
      }

      resultMap[sp.id] = resolvedList;
    });

    return resultMap;
  }, [rawSpecies, rawZones]);

  const activeSpecies = useMemo(
    () => (rawSpecies ? rawSpecies.filter((sp) => sp.active !== false) : []),
    [rawSpecies],
  );

  const selectedFish =
    activeSpecies.find((fish) => fish.id === selectedSpeciesId) ||
    activeSpecies[0];
  const selectedFishRegionIndex = selectedFish
    ? selectedRegionIndex[selectedFish.id] || 0
    : 0;
  const selectedFishRegions = selectedFish
    ? speciesRegionsMap[selectedFish.id] || []
    : [];
  const selectedFishRegion = selectedFishRegions[selectedFishRegionIndex];
  const selectedFishNames = selectedFish
    ? getCleanedFishNames(selectedFish.common_name)
    : { displayName: "", imgSlug: "fallback-fish" };

  useEffect(() => {
    if (activeSpecies.length === 0) return;
    const selectedStillExists = activeSpecies.some(
      (fish) => fish.id === selectedSpeciesId,
    );
    if (!selectedStillExists) {
      setSelectedSpeciesId(activeSpecies[0].id);
    }
  }, [activeSpecies, selectedSpeciesId]);

  // Automatically dismiss the success banner after 4 seconds
  useEffect(() => {
    if (banner) {
      const timer = setTimeout(() => {
        setBanner(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [banner]);

  if (isSpeciesLoading || isZonesLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-ocean text-white font-cal select-none">
        <div className="relative w-18 h-18 flex items-center justify-center mb-8">
          <div className="wave-ripple"></div>
          <div className="wave-ripple wave-ripple-delayed"></div>
        </div>
        <h2 className="text-xl tracking-wider">Loading Bounding Box Data...</h2>
      </div>
    );
  }

  const handleRegionChange = (speciesId: string, index: number) => {
    setSelectedRegionIndex((prev) => ({
      ...prev,
      [speciesId]: index,
    }));
  };

  const handleMonitorSpecies = async (
    speciesId: string,
    displayName: string,
  ) => {
    if (!token) {
      alert("You must be logged in to monitor a species.");
      return;
    }

    const options = speciesRegionsMap[speciesId] || [];
    const selectedIdx = selectedRegionIndex[speciesId] || 0;
    const selectedRegion = options[selectedIdx];

    if (!selectedRegion) return;

    setSubmittingSpeciesId(speciesId);
    try {
      await createReport(token, {
        species_id: speciesId,
        month: currentMonth,
        bbox: selectedRegion.bbox,
      });

      setBanner({
        speciesName: displayName,
        regionName: selectedRegion.name,
        bbox: selectedRegion.bbox,
      });
    } catch (err) {
      console.error("Failed to activate monitoring:", err);
      alert("Failed to activate monitoring. Please try again.");
    } finally {
      setSubmittingSpeciesId(null);
    }
  };

  return (
    <div className="min-h-screen bg-ocean px-6 pb-20 pt-32 font-cal md:px-14 text-white flex flex-col relative">
      <Header />

      {banner && (
        <div className="fixed top-6 right-6 z-[100] w-[90%] max-w-sm animate-[slideInRight_0.4s_ease-out_forwards] pointer-events-auto">
          <div className="glass-nav rounded-2xl border border-emerald-500/40 p-4.5 shadow-2xl flex items-start gap-3 backdrop-blur-xl bg-slate-900/80">
            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0 animate-pulse">
              <CheckCircle2 size={22} />
            </div>
            <div className="grow">
              <h4 className="font-righteous text-emerald-400 text-[14px] uppercase tracking-wider mb-1">
                Monitoring Activated
              </h4>
              <p className="text-[13.5px] text-slate-200 leading-normal font-medium">
                <span className="text-white font-semibold">
                  {banner.speciesName}
                </span>{" "}
                is now monitored in the{" "}
                <span className="text-sky-300 font-semibold">
                  {banner.regionName}
                </span>
                .
              </p>
              <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 rounded-lg p-2 border border-white/5">
                BBox: [{banner.bbox.join(", ")}]
              </div>
            </div>
            <button
              onClick={() => setBanner(null)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-white shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto flex max-w-6xl w-full flex-col gap-10 z-10">
        <section className="w-full flex flex-col gap-4 items-center mx-auto">
          <div className="relative flex w-full items-center justify-center py-2 text-black">
            <div className="absolute left-0">
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center gap-2 p-4 text-sm font-medium hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft size={32} className="group-hover:text-slate-600" />
              </button>
            </div>

            <h1 className="font-righteous text-5xl uppercase tracking-tighter md:text-7xl">
              Add Species
            </h1>
          </div>
        </section>

        <section className="w-full">
          <AddFishRegionsMap
            species={activeSpecies}
            zonesData={rawZones}
            speciesRegionsMap={speciesRegionsMap}
            selectedSpeciesId={selectedFish?.id || ""}
            selectedRegionIndex={selectedFishRegionIndex}
          />
        </section>

        <section className="glass-card rounded-[2rem] border border-white/10 p-6 shadow-xl md:p-8">
          {selectedFish && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] md:items-center">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-full w-full max-w-xl items-center justify-center select-none pointer-events-none md:h-56">
                  <img
                    src={`/fishes/${selectedFishNames.imgSlug}.png`}
                    alt={selectedFish.common_name}
                    className="h-full w-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
                  />
                </div>
                <div className="mt-4 flex flex-col gap-1">
                  <h3 className="font-righteous text-4xl uppercase tracking-tight text-white md:text-5xl">
                    {selectedFishNames.displayName}
                  </h3>
                  <p className="text-sky-200/90 text-sm font-medium italic">
                    ({selectedFish.scientific_name})
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2 text-left">
                  <label className="text-[12px] uppercase tracking-wider text-slate-300 font-semibold pl-1">
                    Choose Fish
                  </label>
                  <div className="relative w-full">
                    <select
                      value={selectedFish.id}
                      onChange={(e) => setSelectedSpeciesId(e.target.value)}
                      className="w-full py-3.5 pl-5 pr-12 border border-white/20 rounded-2xl text-[15px] outline-none cursor-pointer bg-slate-900/80 hover:bg-slate-900/90 text-white font-medium appearance-none transition-all duration-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10"
                    >
                      {activeSpecies.map((fish) => {
                        const { displayName } = getCleanedFishNames(
                          fish.common_name,
                        );
                        return (
                          <option key={fish.id} value={fish.id}>
                            {displayName}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-left">
                  <label className="text-[12px] uppercase tracking-wider text-slate-300 font-semibold pl-1">
                    Choose Region
                  </label>
                  <div className="relative w-full">
                    <select
                      value={selectedFishRegionIndex}
                      onChange={(e) =>
                        handleRegionChange(
                          selectedFish.id,
                          Number(e.target.value),
                        )
                      }
                      className="w-full py-3.5 pl-5 pr-12 border border-white/20 rounded-2xl text-[15px] outline-none cursor-pointer bg-slate-900/80 hover:bg-slate-900/90 text-white font-medium appearance-none transition-all duration-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10"
                    >
                      {selectedFishRegions.map((option, idx) => (
                        <option key={`${option.name}-${idx}`} value={idx}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300"
                    />
                  </div>

                  {selectedFishRegion && (
                    <div className="text-[11px] font-mono text-slate-300 mt-1 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
                      BBox: [{selectedFishRegion.bbox.join(", ")}]
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={submittingSpeciesId !== null || !selectedFishRegion}
                  onClick={() =>
                    handleMonitorSpecies(
                      selectedFish.id,
                      selectedFishNames.displayName,
                    )
                  }
                  className={`font-righteous text-md uppercase tracking-wider rounded-[1.25rem] w-full py-3.5 border border-white/40 bg-white/10 transition-all duration-300 shadow-md ${
                    submittingSpeciesId === selectedFish.id
                      ? "opacity-60 cursor-not-allowed"
                      : submittingSpeciesId !== null || !selectedFishRegion
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-white hover:text-slate-900 active:scale-[0.98]"
                  }`}
                >
                  {submittingSpeciesId === selectedFish.id
                    ? "Activating..."
                    : "Monitor Species"}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
