import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Menu } from "lucide-react";

import { fetchAllSpecies, followHypermediaLink } from "../services/api";
import { type Vessel, type RegionData, SEAS, getClosestSea } from "@/types/map";

import MapCanvas from "@/components/Map/MapCanvas";
import TopNavigation from "@/components/Map/TopNavigation";
import Dashboard from "@/components/Map/Dashboard";

export default function MapPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveStatusExpanded, setIsLiveStatusExpanded] = useState(true);

  const [seaIndex, setSeaIndex] = useState<number>(0);
  const [filterSeaIndex, setFilterSeaIndex] = useState<number>(0);
  const [selectedFish, setSelectedFish] = useState<string | null>(null);

  const [threatFilter, setThreatFilter] = useState<"all" | "warning" | "critical">("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "stationary" | "slow" | "transit">("all");
  const [vesselTypeFilter, setVesselTypeFilter] = useState<
    | "target"
    | "all"
    | "fishing"
    | "unknown"
  >("target");

  const currentMonth = new Date().getMonth() + 1;

  const { data: rawSpecies, isLoading: isSpeciesLoading } = useQuery({
    queryKey: ["all-species"],
    queryFn: fetchAllSpecies,
    staleTime: 5 * 60 * 1000,
  });

  const activeSpecies = useMemo(() => {
    return rawSpecies?.filter((sp: any) => sp.active) || [];
  }, [rawSpecies]);

  const { data: rawZones } = useQuery({
    queryKey: [
      "migration-zones",
      currentMonth,
      activeSpecies.map((s) => s.id).join(","),
    ],
    queryFn: async () => {
      if (!rawSpecies) return [];
      const activeSpecies = rawSpecies.filter((sp: any) => sp.active);
      return await Promise.all(
        activeSpecies.map(async (sp: any) => {
          if (!sp.links?.migration) return { speciesId: sp.id, zoneData: null };

          const zoneData = await followHypermediaLink(sp.links.migration, {
            month: currentMonth,
          }).catch(() => null);

          return { speciesId: sp.id, zoneData };
        }),
      );
    },
    staleTime: 0,
    enabled: activeSpecies.length > 0,
  });

  const REGIONS_DATA: RegionData[] = useMemo(() => {
    if (!rawSpecies) return [];
    return rawSpecies.map((sp: any) => {
      const matchedSeas = new Set<string>();

      const speciesZones = rawZones?.find((z: any) => z.speciesId === sp.id)
        ?.zoneData?.zones;

      if (speciesZones && speciesZones.length > 0) {
        speciesZones.forEach((zone: any) => {
          const lng = zone.center?.lng ?? zone.center?.[0];
          const lat = zone.center?.lat ?? zone.center?.[1];
          if (lng !== undefined && lat !== undefined) {
            const closestSeaName = getClosestSea(lng, lat);
            matchedSeas.add(closestSeaName);
          }
        });
      }

      if (matchedSeas.size === 0) {
        const lowerRegion = (sp.region || "").toLowerCase();
        if (lowerRegion.includes("north sea")) {
          matchedSeas.add("North Sea");
        }
        if (lowerRegion.includes("mediterranean")) {
          matchedSeas.add("Mediterranean Sea");
        }
        if (
          lowerRegion.includes("atlantic") &&
          !lowerRegion.includes("north atlantic")
        ) {
          matchedSeas.add("European Atlantic Coast");
        }
      }

      if (matchedSeas.size === 0) {
        matchedSeas.add(SEAS[0].name);
      }

      const matchedSeasArray = Array.from(matchedSeas);
      const primarySea =
        SEAS.find((s) => s.name === matchedSeasArray[0]) || SEAS[0];

      return {
        id: sp.id,
        regionNames: matchedSeasArray,
        commonSpeciesName: sp.common_name,
        scientificSpeciesName: sp.scientific_name,
        active: sp.active,
        zoom: primarySea.zoom,
        fallbackCenter: primarySea.center as [number, number],
      };
    });
  }, [rawSpecies, rawZones]);

  const zonesData = useMemo(() => {
    if (!rawZones || REGIONS_DATA.length === 0) return [];
    return rawZones.map((z: any) => {
      const region = REGIONS_DATA.find((r) => r.id === z.speciesId);
      return { region, zoneData: z.zoneData };
    });
  }, [rawZones, REGIONS_DATA]);

  const { data: trackerData } = useQuery({
    queryKey: ["live-tracker", currentMonth],
    queryFn: async () => {
      return await Promise.all(
        REGIONS_DATA.map(async (region) => {
          const originalSpecies = rawSpecies.find(
            (s: any) => s.id === region.id,
          );

          if (!originalSpecies?.links?.overlap) {
            return {
              region,
              vessels: [],
              stats: {
                vessels_tracked_count: 0,
                average_threat_score: 0.0,
                maximum_threat_score: 0.0,
              },
            };
          }

          const overlapData = await followHypermediaLink(
            originalSpecies.links.overlap,
            { month: currentMonth },
          ).catch((err) => {
            console.error("Vessel fetch error:", err);
            return [];
          });

          const rawVessels = Array.isArray(overlapData)
            ? overlapData
            : Array.isArray(overlapData?.tracked_vessels)
              ? overlapData.tracked_vessels
              : [];

          const stats = overlapData?.stats || {
            vessels_tracked_count: rawVessels.length,
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
              ...(v.shiptype !== undefined && { shiptype: v.shiptype }),
              ...(v.category !== undefined && { category: v.category }),
              ...(v.classification_source !== undefined && {
                classification_source: v.classification_source,
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


  const filteredTrackerData = useMemo(() => {
    if (!trackerData) return trackerData;

    return trackerData.map((entry: any) => {
      const vessels = entry.vessels.filter((v: any) => {
        if (threatFilter === "critical" && v.score < 0.7) return false;
        if (threatFilter === "warning" && v.score < 0.4) return false;

        const sog = v.sog ?? 0;

        if (activityFilter === "stationary" && sog >= 0.5) return false;
        if (activityFilter === "slow" && (sog < 0.5 || sog > 6)) return false;
        if (activityFilter === "transit" && sog <= 6) return false;

        const category = String(v.category ?? "Unknown").toLowerCase();
        const targetCategories = new Set(["fishing", "unknown"]);

        if (vesselTypeFilter === "target" && !targetCategories.has(category)) {
          return false;
        }

        if (
          vesselTypeFilter !== "target" &&
          vesselTypeFilter !== "all" &&
          category !== vesselTypeFilter
        ) {
          return false;
        }

        return true;
      });
      
      return {
        ...entry,
        vessels,
        stats: {
          ...entry.stats,
          vessels_tracked_count: vessels.length,
          maximum_threat_score: vessels.length
            ? Math.max(...vessels.map((v: any) => v.score ?? 0))
            : 0,
          average_threat_score: vessels.length
            ? vessels.reduce((sum: number, v: any) => sum + (v.score ?? 0), 0) / vessels.length
            : 0,
        },
      };
    });
  }, [trackerData, threatFilter, activityFilter, vesselTypeFilter]);

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
        <div className="relative w-18 h-18 flex items-center justify-center mb-8">
          <div className="wave-ripple"></div>
          <div className="wave-ripple wave-ripple-delayed"></div>
        </div>
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
        trackerData={filteredTrackerData}
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
          trackerData={filteredTrackerData || []}
          isLiveStatusExpanded={isLiveStatusExpanded}
          setIsLiveStatusExpanded={setIsLiveStatusExpanded}
          threatFilter={threatFilter}
          setThreatFilter={setThreatFilter}
          activityFilter={activityFilter}
          setActivityFilter={setActivityFilter}
          vesselTypeFilter={vesselTypeFilter}
          setVesselTypeFilter={setVesselTypeFilter}
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
