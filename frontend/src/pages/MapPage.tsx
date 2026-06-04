import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAllSpecies,
  fetchMigrationZone,
  fetchSpeciesVessels,
} from "../services/api";
import { Map, Popup, config } from "@maptiler/sdk";
import turfCircle from "@turf/circle";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import "@maptiler/sdk/dist/maptiler-sdk.css";

// just to avoid the warning
config.apiKey = ***ENTFERNT***;

interface Vessel {
  mmsi: number;
  name: string;
  lat: number;
  lng: number;
  score: number | null;
  level: "CRITICAL" | "WARNING" | "LOW";
}

interface RegionData {
  id: string;
  regionName: string;
  commonSpeciesName: string;
  scientificSpeciesName: string;
  active: boolean;
  zoom: number;
  fallbackCenter: [number, number];
}

const SEAS = [
  { name: "Global Overview", center: [5.0, 48.0], zoom: 3.2 },
  { name: "Mediterranean Sea", center: [15.0, 38.0], zoom: 4.5 },
  { name: "North Sea", center: [3.0, 56.5], zoom: 4.5 },
  { name: "European Atlantic Coast", center: [-9.5, 40.0], zoom: 5.0 },
];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapRef = useRef<Map | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  const [seaIndex, setSeaIndex] = useState<number>(0);
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
        let matchingSea = SEAS[0];

        // fun fuzzy matching
        if (lowerRegion.includes("north sea")) {
          matchingSea = SEAS.find((s) => s.name === "North Sea") || SEAS[0];
        } else if (
          lowerRegion.includes("atlantic coast") ||
          sp.id === "sardina-pilchardus"
        ) {
          matchingSea =
            SEAS.find((s) => s.name === "European Atlantic Coast") || SEAS[0];
        } else if (lowerRegion.includes("mediterranean")) {
          matchingSea =
            SEAS.find((s) => s.name === "Mediterranean Sea") || SEAS[0];
        } else if (lowerRegion.includes("atlantic")) {
          matchingSea =
            SEAS.find((s) => s.name === "European Atlantic Coast") || SEAS[0];
        }

        return {
          id: sp.id,
          regionName: matchingSea.name,
          commonSpeciesName: sp.common_name,
          scientificSpeciesName: sp.scientific_name,
          active: sp.active,
          zoom: matchingSea.zoom,
          fallbackCenter: matchingSea.center as [number, number],
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

  const { data: vesselsData } = useQuery({
    queryKey: ["live-vessels"],
    queryFn: async () => {
      return await Promise.all(
        REGIONS_DATA.map(async (region) => {
          const vesselData = await fetchSpeciesVessels(region.id).catch(() => ({
            vessels: [],
          }));
          return { region, vessels: vesselData?.vessels || [] };
        }),
      );
    },
    refetchInterval: 10000,
    enabled: REGIONS_DATA.length > 0,
  });

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || REGIONS_DATA.length === 0)
      return;
    let isCancelled = false;

    const initializeMap = async () => {
      try {
        const styleId = "019e79d9-fb71-728c-83cd-3a386798757e";
        const customStyleUrl = `https://api.maptiler.com/maps/${styleId}/style.json?key=${config.apiKey}`;

        const response = await fetch(customStyleUrl);
        const styleJson = await response.json();

        if (isCancelled) return;

        const map = new Map({
          container: mapContainer.current!,
          style: styleJson,
          center: SEAS[0].center as [number, number],
          zoom: SEAS[0].zoom,
          pitch: 0,
          terrain: false,
          maxPitch: 0,
          attributionControl: { compact: true },
          maptilerLogo: false,
        });

        mapRef.current = map;

        map.on("load", () => {
          map.resize();

          map.addSource("fish-migration-zone", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          map.addLayer({
            id: "migration-zone-line",
            type: "line",
            source: "fish-migration-zone",
            paint: {
              "line-color": [
                "case",
                ["boolean", ["get", "isThreatened"], false],
                "#b91c1c",
                "#047857",
              ],
              "line-width": 3,
              "line-dasharray": [2, 2],
            },
          });

          map.addLayer({
            id: "migration-zone-label",
            type: "symbol",
            source: "fish-migration-zone",
            minzoom: 5,
            layout: {
              "text-field": ["get", "zoneLabel"],
              "text-font": ["Merriweather Bold Italic"],
              "text-size": 15,
              "text-anchor": "center",
              "text-justify": "center",
            },
            paint: {
              "text-color": "#052648",
            },
          });

          map.addSource("live-ships", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          map.addLayer({
            id: "ship-layer",
            type: "circle",
            source: "live-ships",
            paint: {
              "circle-radius": 9,
              "circle-blur": 0,
              "circle-color": [
                "step",
                ["get", "overlapScore"],
                "#047857",
                0.4,
                "#ca8a04",
                0.7,
                "#b91c1c",
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": [
                "case",
                ["boolean", ["get", "isHighThreat"], false],
                "#ffffff",
                "#052648",
              ],
            },
          });

          map.on("click", "ship-layer", (e) => {
            if (!e.features || e.features.length === 0) return;

            const coordinates = (
              e.features[0].geometry as any
            ).coordinates.slice();
            const props = e.features[0].properties;

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            const threatLabel = props.isHighThreat
              ? "CRITICAL THREAT"
              : "Monitoring";
            const threatColor = props.isHighThreat ? "#b91c1c" : "#047857";
            const scorePercentage = (props.overlapScore * 100).toFixed(1);

            const popupHTML = `
              <div style="font-family: var(--font-cal); padding: 12px 36px 12px 12px; min-width: 180px;">
                <h3 style="margin: 0 0 2px 0; font-size: 15px; font-weight: 600; color: #052648; line-height: 1.2;">
                  ${props.vesselName || "Unknown Vessel"}
                </h3>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-family: monospace;">
                  MMSI: ${props.mmsi || "N/A"}
                </p>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span style="background-color: ${threatColor}; width: 8px; height: 8px; border-radius: 50%;"></span>
                  <span style="font-size: 12px; font-weight: 600; color: ${threatColor};">${threatLabel}</span>
                </div>
                <p style="margin: 0; font-size: 12px; color: #052648;">
                  Overlap Score: <strong>${scorePercentage}%</strong>
                </p>
              </div>
            `;

            new Popup({ closeButton: true, closeOnClick: true, offset: 12 })
              .setLngLat(coordinates)
              .setHTML(popupHTML)
              .addTo(map);
          });

          map.on("mouseenter", "ship-layer", () => {
            map.getCanvas().style.cursor = "pointer";
          });

          map.on("mouseleave", "ship-layer", () => {
            map.getCanvas().style.cursor = "";
          });
          setIsMapReady(true);
        });
      } catch (error) {
        console.error("Failed to load MapTiler style JSON:", error);
      }
    };

    initializeMap();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, [REGIONS_DATA]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !zonesData) return;

    if (selectedFish) {
      const regionConf = REGIONS_DATA.find((r) => r.id === selectedFish);
      const zonePayload = zonesData.find(
        (z) => z.region.id === selectedFish,
      )?.zoneData;
      const targetLng =
        zonePayload?.center?.lng ??
        zonePayload?.center?.[0] ??
        regionConf?.fallbackCenter[0];
      const targetLat =
        zonePayload?.center?.lat ??
        zonePayload?.center?.[1] ??
        regionConf?.fallbackCenter[1];

      map.flyTo({
        center: [targetLng, targetLat],
        zoom: 5.5,
        essential: true,
        speed: 0.8,
      });
    } else {
      const targetSea = SEAS[seaIndex];
      map.flyTo({
        center: targetSea.center as [number, number],
        zoom: targetSea.zoom,
        essential: true,
        speed: 0.8,
      });
    }
  }, [seaIndex, selectedFish, isMapReady, zonesData, REGIONS_DATA]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !zonesData || !vesselsData) return;

    const allZoneFeatures: any[] = [];
    const allShipFeatures: any[] = [];

    let regionsToProcess = REGIONS_DATA;

    if (selectedFish) {
      regionsToProcess = REGIONS_DATA.filter((r) => r.id === selectedFish);
    } else if (seaIndex !== 0) {
      regionsToProcess = REGIONS_DATA.filter(
        (r) => r.regionName === SEAS[seaIndex].name,
      );
    }

    regionsToProcess.forEach((region) => {
      const zonePayload = zonesData.find(
        (z) => z.region.id === region.id,
      )?.zoneData;
      const centerLng =
        zonePayload?.center?.lng ??
        zonePayload?.center?.[0] ??
        region.fallbackCenter[0];
      const centerLat =
        zonePayload?.center?.lat ??
        zonePayload?.center?.[1] ??
        region.fallbackCenter[1];
      const radiusKm = zonePayload?.radius_km || 100;

      const vesselPayload =
        vesselsData.find((v) => v.region.id === region.id)?.vessels || [];
      const sanitizedVessels = vesselPayload.map((v: Vessel) => ({
        ...v,
        score: v.score ?? 0.0,
      }));
      const maxThreatScore = Math.max(
        ...sanitizedVessels.map((v: Vessel) => v.score || 0),
        0,
      );
      const computedHasThreat = maxThreatScore >= 0.7;

      const accuratePolygon = turfCircle([centerLng, centerLat], radiusKm, {
        steps: 64,
        units: "kilometers",
      });

      allZoneFeatures.push({
        type: "Feature",
        geometry: accuratePolygon.geometry,
        properties: { isThreatened: computedHasThreat },
      });

      allZoneFeatures.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [centerLng, centerLat] },
        properties: {
          isThreatened: computedHasThreat,
          zoneLabel: `${region.commonSpeciesName}\n(${region.scientificSpeciesName})\n~${radiusKm}km`,
        },
      });

      sanitizedVessels.forEach((ship: Vessel) => {
        allShipFeatures.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [ship.lng, ship.lat] },
          properties: {
            mmsi: ship.mmsi,
            vesselName: ship.name,
            overlapScore: ship.score,
            isHighThreat: (ship.score || 0) >= 0.7,
          },
        });
      });
    });

    const zoneSource = map.getSource("fish-migration-zone");
    const shipsSource = map.getSource("live-ships");

    if (zoneSource)
      (zoneSource as any).setData({
        type: "FeatureCollection",
        features: allZoneFeatures,
      });
    if (shipsSource)
      (shipsSource as any).setData({
        type: "FeatureCollection",
        features: allShipFeatures,
      });
  }, [zonesData, vesselsData, isMapReady, seaIndex, selectedFish]);

  const handleNext = () => {
    setSelectedFish(null);
    setSeaIndex((prev) => (prev + 1) % SEAS.length);
  };

  const handlePrev = () => {
    setSelectedFish(null);
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

  const activeTitle = selectedFish
    ? REGIONS_DATA.find((r) => r.id === selectedFish)?.commonSpeciesName
    : SEAS[seaIndex].name;

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
    const fishesInSea = REGIONS_DATA.filter(
      (r) => r.regionName === currentSeaName,
    );

    if (fishesInSea.length === 0) {
      activeSubtitle = "No active zones";
    } else if (fishesInSea.length === 1) {
      activeSubtitle = fishesInSea[0].commonSpeciesName;
    } else if (fishesInSea.length === 2) {
      activeSubtitle = `${fishesInSea[0].commonSpeciesName} & ${fishesInSea[1].commonSpeciesName}`;
    } else {
      activeSubtitle = `${fishesInSea[0].commonSpeciesName}, ${fishesInSea[1].commonSpeciesName} +${fishesInSea.length - 2} more`;
    }
  }

  const getFullSpeciesName = (region: RegionData) => {
    return `${region.commonSpeciesName} (${region.scientificSpeciesName})`;
  };

  return (
    <div className="fixed w-screen h-screen overflow-hidden z-0">
      <div ref={mapContainer} className="fixed inset-0 w-screen h-screen z-0" />

      <div className="pointer-events-none fixed inset-0 z-10 w-screen h-screen">
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
            <div className="tracking-widest text-xl font-semibold text-white">
              {activeTitle}
            </div>
            <div className="text-xs text-slate-200 mt-0.5">
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

        <div
          className={`pointer-events-auto text-white fixed top-25 left-10 w-75 glass-nav rounded-4xl p-2 z-50 transform transition-transform tracking-wide ${isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+50px)]"} shadow-2xl p-6`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg">Filters</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} strokeWidth={3} className="text-slate-200" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <select
              value={seaIndex}
              onChange={(e) => {
                setSelectedFish(null);
                setSeaIndex(Number(e.target.value));
              }}
              className="w-full p-2 border-2 border-slate-200 rounded-xl text-base outline-none cursor-pointer"
            >
              {SEAS.map((sea, index) => (
                <option key={index} value={index}>
                  {sea.name}
                </option>
              ))}
            </select>

            <select
              value={selectedFish || "all"}
              onChange={(e) => {
                if (e.target.value === "all") {
                  setSelectedFish(null);
                } else {
                  setSelectedFish(e.target.value);
                  const fishRegion = REGIONS_DATA.find(
                    (r) => r.id === e.target.value,
                  );
                  const newSeaIndex = SEAS.findIndex(
                    (s) => s.name === fishRegion?.regionName,
                  );
                  if (newSeaIndex !== -1) setSeaIndex(newSeaIndex);
                }
              }}
              className="w-full p-2 border-2 border-slate-200 rounded-xl text-base outline-none cursor-pointer"
            >
              <option value="all">All Fishes</option>
              {REGIONS_DATA.map((r) => (
                <option key={r.id} value={r.id}>
                  {getFullSpeciesName(r)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="absolute w-fit top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full font-cal">
          <div className="pointer-events-auto glass-nav p-2 rounded-full backdrop-blur-md shadow-md">
            <button
              onClick={() => (window.location.href = "/")}
              className="group flex items-center gap-2 p-2 text-white text-sm font-medium hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft
                size={16}
                className=" text-white group-hover:text-slate-600"
              />{" "}
              Back
            </button>
          </div>
          <div className="pointer-events-auto glass-nav p-2 rounded-full backdrop-blur-md shadow-md">
            <button
              onClick={() => setIsSidebarOpen(true)}
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
