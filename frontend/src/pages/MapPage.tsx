import { useEffect, useRef, useState } from "react";
import { fetchMigrationZone, fetchSpeciesVessels } from "../services/api";
import { Map, Popup, config } from "@maptiler/sdk";
import turfCircle from "@turf/circle";
import { ChevronLeft, ChevronRight, Menu, X, ArrowLeft } from "lucide-react";
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

interface RegionConfig {
  id: string;
  displayName: string;
  speciesName: string;
  zoom: number;
  fallbackCenter: [number, number];
}

const REGIONS_DATA: RegionConfig[] = [
  {
    id: "thunnus-thynnus",
    displayName: "Mediterranean Sea",
    speciesName: "Bluefin Tuna (Thunnus thynnus)",
    zoom: 5.0,
    fallbackCenter: [15.0, 38.0],
  },
  {
    id: "gadus-morhua",
    displayName: "North Sea",
    speciesName: "Atlantic Cod (Gadus morhua)",
    zoom: 4.5,
    fallbackCenter: [3.0, 56.5],
  },
  {
    id: "sardina-pilchardus",
    displayName: "European Atlantic Coast",
    speciesName: "Sardine (Sardina pilchardus)",
    zoom: 5.0,
    fallbackCenter: [-9.5, 40.0],
  },
  {
    id: "xiphias-gladius",
    displayName: "Mediterranean Sea",
    speciesName: "Swordfish (Xiphias gladius)",
    zoom: 5.2,
    fallbackCenter: [19.0, 57.0],
  },
];

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapRef = useRef<Map | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  const activeRegion = REGIONS_DATA[currentIndex];
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

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
          center: activeRegion.fallbackCenter,
          zoom: activeRegion.zoom,
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
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map) return;

    const synchronizeLiveTracker = async () => {
      try {
        let centerLng = activeRegion.fallbackCenter[0];
        let centerLat = activeRegion.fallbackCenter[1];
        let radiusKm = 100;

        try {
          const zoneData = await fetchMigrationZone(
            activeRegion.id,
            currentMonth,
          );
          if (zoneData) {
            if (zoneData.center) {
              centerLng = zoneData.center.lng ?? zoneData.center[0];
              centerLat = zoneData.center.lat ?? zoneData.center[1];
            }
            if (zoneData.radius_km) {
              radiusKm = zoneData.radius_km;
            }
          }
        } catch (e) {
          console.warn(
            `Could not fetch live migration zone for ${activeRegion.id}`,
          );
        }

        let vesselsList: Vessel[] = [];
        try {
          const vesselData = await fetchSpeciesVessels(activeRegion.id);
          vesselsList = vesselData.vessels || [];
        } catch (e) {
          console.warn(
            `Could not pull live tracking vessels for ${activeRegion.id}.`,
          );
        }

        const sanitizedVessels = vesselsList.map((v) => ({
          ...v,
          score:
            v.score === null || typeof v.score === "undefined" ? 0.0 : v.score,
        }));

        const maxThreatScore = Math.max(
          ...sanitizedVessels.map((v) => v.score),
          0,
        );
        const computedHasThreat = maxThreatScore >= 0.7;

        const accuratePolygon = turfCircle([centerLng, centerLat], radiusKm, {
          steps: 64,
          units: "kilometers",
        });

        const finalZoneGeoJSON = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: accuratePolygon.geometry,
              properties: {
                isThreatened: computedHasThreat,
              },
            },
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [centerLng, centerLat],
              },
              properties: {
                isThreatened: computedHasThreat,
                zoneLabel: `${activeRegion.speciesName}\nMigration Zone (~${radiusKm}km)`,
              },
            },
          ],
        };

        const finalShipsGeoJSON = {
          type: "FeatureCollection",
          features: sanitizedVessels.map((ship) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [ship.lng, ship.lat] },
            properties: {
              mmsi: ship.mmsi,
              vesselName: ship.name,
              overlapScore: ship.score,
              isHighThreat: ship.score >= 0.7,
            },
          })),
        };

        const zoneSource = map.getSource("fish-migration-zone");
        const shipsSource = map.getSource("live-ships");

        if (zoneSource) (zoneSource as any).setData(finalZoneGeoJSON);
        if (shipsSource) (shipsSource as any).setData(finalShipsGeoJSON);

        map.flyTo({
          center: [centerLng, centerLat],
          zoom: activeRegion.zoom,
          essential: true,
          speed: 0.8,
        });
      } catch (error) {
        console.error("Critical error processing map pipeline sync: ", error);
      }
    };

    synchronizeLiveTracker();
  }, [currentIndex, isMapReady, currentMonth]);

  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % REGIONS_DATA.length);
  const handlePrev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + REGIONS_DATA.length) % REGIONS_CONFIG.length,
    );

  return (
    <div className="fixed w-screen h-screen overflow-hidden z-0">
      <div ref={mapContainer} className="fixed inset-0 w-screen h-screen z-0" />

      <div className="pointer-events-none fixed inset-0 z-10 w-screen h-screen">
        <div className="pointer-events-auto absolute! bottom-8 md:bottom-auto top-auto md:top-6 left-1/2 -translate-x-1/2 px-4 md:px-6 py-3 rounded-full flex items-center gap-3 md:gap-5 glass-nav max-w-130 w-[90%] md:w-full justify-between font-cal shadow-md bg-white/80 backdrop-blur-md">
          <button
            onClick={handlePrev}
            className="group text-slate-900 text-lg px-2.5 py-1 select-none transition-transform active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={5} />
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
            className="group text-slate-900 text-lg px-2.5 py-1 select-none transition-transform active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={5} />
          </button>
        </div>

        <div
          className={`pointer-events-auto fixed top-5 bottom-5 left-5 w-75 bg-[#f4f4f5] rounded-4xl py-4 z-50 transform transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+20px)]"} shadow-2xl p-6`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg">Filters</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} className="text-slate-600" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <select
              className="w-full p-2 border border-gray-300 rounded-xl text-base"
              onChange={() => {}}
            >
              <option value="all">All Regions</option>
              {REGIONS_DATA.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName}
                </option>
              ))}
            </select>
            <select
              className="w-full p-2 border border-gray-300 rounded-xl text-base"
              onChange={() => {}}
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

        <div className="absolute w-fit top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full font-cal">
          <div className="pointer-events-auto glass-nav p-2 rounded-full bg-white/80 backdrop-blur-md shadow-md">
            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-2 p-2 text-slate-900 text-sm font-medium hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
          <div className="pointer-events-auto glass-nav p-2 rounded-full bg-white/80 backdrop-blur-md shadow-md">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5 text-slate-900" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
