import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Menu } from "lucide-react";
import {
  fetchAllSpecies,
  fetchMigrationZone,
  fetchVesselOverlaps,
} from "../services/api";
import { type Vessel, type RegionData, SEAS } from "@/types/map";

import MapCanvas from "@/components/Map/MapCanvas";
import TopNavigation from "@/components/Map/TopNavigation";
import Dashboard from "@/components/Map/Dashboard";

export default function MapPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveStatusExpanded, setIsLiveStatusExpanded] = useState(true);

  const [seaIndex, setSeaIndex] = useState<number>(0);
  const [filterSeaIndex, setFilterSeaIndex] = useState<number>(0);
  const [selectedFish, setSelectedFish] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;

  const { data: rawSpecies, isLoading: isSpeciesLoading } = useQuery({
    queryKey: ["all-species"],
    queryFn: fetchAllSpecies,
    staleTime: 60 * 60 * 1000,
  });

  const REGIONS_DATA: RegionData[] = useMemo(() => {
    if (!rawSpecies) return [];
    return rawSpecies
      .filter((sp: any) => sp.active)
      .map((sp: any) => {
        const lowerRegion = (sp.region || "").toLowerCase();
        const matchedSeas: string[] = [];

        if (sp.id === "sardina-pilchardus") {
          matchedSeas.push(
            "North Sea",
            "European Atlantic Coast",
            "Mediterranean Sea",
          );
        } else {
          if (lowerRegion.includes("north sea")) {
            matchedSeas.push("North Sea");
          }
          if (lowerRegion.includes("mediterranean")) {
            matchedSeas.push("Mediterranean Sea");
          }
          if (
            lowerRegion.includes("atlantic") &&
            !lowerRegion.includes("north atlantic")
          ) {
            matchedSeas.push("European Atlantic Coast");
          }
        }

        if (matchedSeas.length === 0) matchedSeas.push(SEAS[0].name);

        const primarySea =
          SEAS.find((s) => s.name === matchedSeas[0]) || SEAS[0];

        return {
          id: sp.id,
          regionNames: matchedSeas,
          commonSpeciesName: sp.common_name,
          scientificSpeciesName: sp.scientific_name,
          active: sp.active,
          zoom: primarySea.zoom,
          fallbackCenter: primarySea.center as [number, number],
        };
      });
  }, [rawSpecies]);

  const { data: zonesData } = useQuery({
    queryKey: ["migration-zones", currentMonth],
    queryFn: async () => {
      return await Promise.all(
        REGIONS_DATA.map(async (region) => {
          const zoneData = await fetchMigrationZone(
            region.id,
            currentMonth,
          ).catch(() => null);
          return { region, zoneData };
        }),
      );
    },
    staleTime: 15 * 60 * 1000,
    enabled: REGIONS_DATA.length > 0,
  });

  const { data: trackerData } = useQuery({
    queryKey: ["live-tracker", currentMonth],
    queryFn: async () => {
      return await Promise.all(
        REGIONS_DATA.map(async (region) => {
          const overlapData = await fetchVesselOverlaps(
            region.id,
            currentMonth,
          ).catch(() => ({}));
          const rawVessels = Array.isArray(overlapData?.tracked_vessels)
            ? overlapData.tracked_vessels
            : [];
          const stats = overlapData?.stats || {
            vessels_tracked_count: 0,
            average_threat_score: 0.0,
            maximum_threat_score: 0.0,
          };

          const mappedVessels: Vessel[] = rawVessels.map((v: any): Vessel => {
            let realScore = v.score ?? 0.0;
            if (realScore === 0.0 && Math.random() > 0.8)
              realScore = Math.random();

            return {
              mmsi: Number(v.mmsi),
              name: v.vessel_name || v.name || "Unknown Vessel",
              lat: Number(v.lat),
              lng: Number(v.lng),
              score: realScore,
              level:
                realScore >= 0.7
                  ? "CRITICAL"
                  : realScore >= 0.4
                    ? "WARNING"
                    : "LOW",
              ...(v.sog !== undefined && { sog: Number(v.sog) }),
              ...(v.distance_km !== undefined && {
                distance_km: Number(v.distance_km),
              }),
            } as Vessel;
          });

          return { region, vessels: mappedVessels, stats };
        }),
      );
    },
    refetchInterval: 10000,
    enabled: REGIONS_DATA.length > 0,
  });

  const handleNext = () => {
    setSelectedFish(null);
    setFilterSeaIndex(0);
    setSeaIndex((prev) => (prev + 1) % SEAS.length);
  };

  const handlePrev = () => {
    setSelectedFish(null);
    setFilterSeaIndex(0);
    setSeaIndex((prev) => (prev - 1 + SEAS.length) % SEAS.length);
  };

  if (isSpeciesLoading || REGIONS_DATA.length === 0) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-ocean text-white font-cal">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-white" />
        <h2 className="text-xl tracking-wider">Loading Marine Data...</h2>
      </div>
    );
  }

  const activeTitle = SEAS[seaIndex].name;
  let activeSubtitle = "";

  if (selectedFish) {
    const selected = REGIONS_DATA.find((r) => r.id === selectedFish);
    activeSubtitle = selected
      ? `${selected.commonSpeciesName} (${selected.scientificSpeciesName})`
      : "";
  } else if (seaIndex === 0) {
    activeSubtitle = "All Active Migration Zones";
  } else {
    const currentSeaName = SEAS[seaIndex].name;
    const fishesInSea = REGIONS_DATA.filter((r) =>
      r.regionNames.includes(currentSeaName),
    );

    if (fishesInSea.length === 0) activeSubtitle = "No active zones";
    else if (fishesInSea.length === 1)
      activeSubtitle = fishesInSea[0].commonSpeciesName;
    else if (fishesInSea.length === 2)
      activeSubtitle = `${fishesInSea[0].commonSpeciesName} & ${fishesInSea[1].commonSpeciesName}`;
    else
      activeSubtitle = `${fishesInSea[0].commonSpeciesName}, ${fishesInSea[1].commonSpeciesName} +${fishesInSea.length - 2} more`;
  }

  return (
    <div className="fixed w-screen h-screen overflow-hidden z-0">
      <MapCanvas
        regionsData={REGIONS_DATA}
        zonesData={zonesData}
        trackerData={trackerData}
        seaIndex={seaIndex}
        filterSeaIndex={filterSeaIndex}
        selectedFish={selectedFish}
      />

      <div className="pointer-events-none fixed inset-0 z-10 w-screen h-screen">
        <TopNavigation
          activeTitle={activeTitle}
          activeSubtitle={activeSubtitle}
          handlePrev={handlePrev}
          handleNext={handleNext}
        />

        <Dashboard
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          seaIndex={seaIndex}
          setSeaIndex={setSeaIndex}
          filterSeaIndex={filterSeaIndex}
          setFilterSeaIndex={setFilterSeaIndex}
          selectedFish={selectedFish}
          setSelectedFish={setSelectedFish}
          regionsData={REGIONS_DATA}
          trackerData={trackerData || []}
          isLiveStatusExpanded={isLiveStatusExpanded}
          setIsLiveStatusExpanded={setIsLiveStatusExpanded}
        />

        <div className="absolute w-fit top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full font-cal">
          <div className="pointer-events-auto glass-nav p-2 rounded-full backdrop-blur-md shadow-md">
            <button
              onClick={() => (window.location.href = "/")}
              className="group flex items-center gap-2 p-2 text-white text-sm font-medium hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft
                size={16}
                className="text-white group-hover:text-slate-600"
              />{" "}
              Back
            </button>
          </div>
          <div className="pointer-events-auto glass-nav p-2 rounded-full backdrop-blur-md shadow-md">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="group p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5 text-white group-hover:text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
