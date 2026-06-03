import { useEffect, useRef, useState } from "react";
import { Map, config } from "@maptiler/sdk";
import { ChevronLeft, ChevronRight, Menu, X, ArrowLeft } from "lucide-react";
import "@maptiler/sdk/dist/maptiler-sdk.css";

config.apiKey = ***ENTFERNT***;

interface Ship {
  id: string;
  name: string;
  coords: [number, number];
  score: number;
}

interface RegionData {
  id: string;
  displayName: string;
  speciesName: string;
  center: [number, number];
  zoom: number;
  fishCenter: [number, number];
  ships: Ship[];
}

// Mock Data
const REGIONS_DATA: RegionData[] = [
  {
    id: "thunnus-thynnus",
    displayName: "Mediterranean Sea",
    speciesName: "Bluefin Tuna (Thunnus thynnus)",
    center: [15.5, 38.0],
    zoom: 4.5,
    fishCenter: [12.0, 37.5],
    ships: [
      { id: "1", name: "Trawler Alpha", coords: [12.2, 37.6], score: 0.88 },
      { id: "2", name: "Marlin Catcher", coords: [14.1, 39.4], score: 0.45 },
      { id: "3", name: "EcoScan V", coords: [22.0, 35.1], score: 0.92 },
    ],
  },
  {
    id: "gadus-morhua",
    displayName: "North Sea / North Atlantic",
    speciesName: "Atlantic Cod (Gadus morhua)",
    center: [0.0, 58.0],
    zoom: 4.2,
    fishCenter: [-2.0, 59.0],
    ships: [
      { id: "4", name: "Nordic Trawler", coords: [-1.8, 59.1], score: 0.95 },
      { id: "5", name: "Bergen Liner", coords: [4.2, 57.1], score: 0.58 },
    ],
  },
  {
    id: "sardina-pilchardus",
    displayName: "European Atlantic Coast",
    speciesName: "Sardine (Sardina pilchardus)",
    center: [-7.0, 48.0],
    zoom: 4.5,
    fishCenter: [-9.0, 47.0],
    ships: [
      { id: "6", name: "Biscay Predator", coords: [-6.2, 46.5], score: 0.31 },
      { id: "7", name: "Coastal Netter", coords: [-8.0, 49.5], score: 0.22 },
    ],
  },
];

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 * @param coord1 - The longitude and latitude of the first point.
 * @param coord2 - The longitude and latitude of the second point.
 */
function getDistanceKM(
  coord1: [number, number],
  coord2: [number, number],
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Evaluates ship threats and compiles the coordinates into GeoJSON layers for map rendering.
 * @param region - The active marine region containing fish centers and vessel arrays.
 */
function generateMapData(region: RegionData) {
  const hasThreatInVicinity = region.ships.some((ship) => {
    const distance = getDistanceKM(ship.coords, region.fishCenter);
    return ship.score >= 0.7 && distance <= 150;
  });

  return {
    migrationData: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: region.fishCenter },
          properties: { isThreatened: hasThreatInVicinity },
        },
      ],
    },
    shipsData: {
      type: "FeatureCollection",
      features: region.ships.map((ship) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: ship.coords },
        properties: {
          vesselName: ship.name,
          overlapScore: ship.score,
          isHighThreat: ship.score >= 0.7,
        },
      })),
    },
  };
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapRef = useRef<Map | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  const activeRegion = REGIONS_DATA[currentIndex];

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new Map({
      container: mapContainer.current,
      style: "019e79d9-fb71-728c-83cd-3a386798757e",
      center: REGIONS_DATA[0].center,
      zoom: REGIONS_DATA[0].zoom,
      pitch: 0,
      terrain: false,
      maxPitch: 0,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    map.on("load", () => {
      map.resize();

      const { migrationData, shipsData } = generateMapData(REGIONS_DATA[0]);

      map.addSource("fish-migration-zone", {
        type: "geojson",
        data: migrationData as any,
      });

      // case is an if-else
      // step is a switch-case
      map.addLayer({
        id: "migration-zone-layer",
        type: "circle",
        source: "fish-migration-zone",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            5, // At zoom 0, radius is 5px
            4,
            150, // At zoom 4, radius is 150px
            10,
            800, // At zoom 10, radius is 800px
          ],
          "circle-blur": 0.8,
          "circle-opacity": 0.6,
          "circle-color": [
            "case",
            ["boolean", ["get", "isThreatened"], false],
            "#b91c1c",
            "#047857",
          ],
        },
      });

      map.addSource("live-ships", {
        type: "geojson",
        data: shipsData as any,
      });

      map.addLayer({
        id: "ship-layer",
        type: "circle",
        source: "live-ships",
        paint: {
          "circle-radius": 8,
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
          "circle-stroke-width": [
            "case",
            ["boolean", ["get", "isHighThreat"], false],
            2,
            2,
          ],
          "circle-stroke-color": [
            "case",
            ["boolean", ["get", "isHighThreat"], false],
            "#fff",
            "#0f172b",
          ],
        },
      });

      setIsMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map) return;

    map.flyTo({
      center: activeRegion.center,
      zoom: activeRegion.zoom,
      essential: true,
      speed: 0.8,
    });

    const { migrationData, shipsData } = generateMapData(activeRegion);

    const zoneSource = map.getSource("fish-migration-zone");
    const shipsSource = map.getSource("live-ships");

    if (zoneSource) (zoneSource as any).setData(migrationData);
    if (shipsSource) (shipsSource as any).setData(shipsData);
  }, [currentIndex, isMapReady, activeRegion]);

  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % REGIONS_DATA.length);
  const handlePrev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + REGIONS_DATA.length) % REGIONS_DATA.length,
    );

  return (
    <div className="fixed w-screen h-screen overflow-hidden z-0">
      <div
        ref={mapContainer}
        className="fixed inset-0 w-screen h-screen overflow-hidden z-0"
      >
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 rounded-full flex items-center gap-5 glass-nav max-w-130 w-full justify-between font-cal">
          <button
            onClick={handlePrev}
            className="group text-slate-900 text-lg px-2.5 py-1 select-none transition-transform active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 cursor-pointer" strokeWidth={5} />
          </button>

          <div className="text-center flex-1">
            <div className="tracking-widest text-xl font-semibold text-slate-900">
              {activeRegion.displayName}
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              {activeRegion.speciesName}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="group text-slate-900 text-lg px-2.5 py-1 select-none transition-transform active:scale-95"
          >
            <ChevronRight className="w-5 h-5 cursor-pointer" strokeWidth={5} />
          </button>
        </div>

        <div
          className={`fixed top-5 bottom-5 left-5 w-75 bg-[#f4f4f5] rounded-4xl py-4 z-50 transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+20px)]"} shadow-2xl p-6`}
        >
          <div className="flex justify-between items-center mt-4 mb-8">
            <h2 className="font-bold text-lg mb-4">Filters</h2>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="mb-4 cursor-pointer"
            >
              <X />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <select
              className="w-full p-2 border rounded-xl text-base"
              onChange={(e) => {
                /* logic */
              }}
            >
              <option value="all">All Regions</option>
              {REGIONS_DATA.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName}
                </option>
              ))}
            </select>

            <select
              className="w-full p-2 border rounded-xl text-base"
              onChange={(e) => {
                /* logic */
              }}
            >
              <option value="all">All Fishes</option>
              {REGIONS_DATA.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="absolute w-fit top-6 left-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full font-cal">
          <div className="glass-nav p-2 rounded-full">
            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-2 p-2 text-slate-900 text-sm font-medium hover:bg-white/20 rounded-full transition-opacity cursor-pointer"
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>

          <div className="glass-nav p-2 rounded-full">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5 text-slate-900" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
