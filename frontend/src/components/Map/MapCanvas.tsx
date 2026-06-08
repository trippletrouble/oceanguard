import { useEffect, useRef, useState } from "react";
import { Map, Popup, config } from "@maptiler/sdk";
import turfCircle from "@turf/circle";
import { SEAS } from "@/types/map";
import { type RegionData } from "@/types/map";
import "@maptiler/sdk/dist/maptiler-sdk.css";

config.apiKey = ***ENTFERNT***;

// Lightning-fast utility for Geographic Math
const getDistanceKm = (
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number,
) => {
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
};

// NEAREST NEIGHBOR FILTER: Perfectly assigns a zone to its rightful Sea
const getClosestSea = (lng: number, lat: number) => {
  let minD = Infinity;
  let closestSea = SEAS[0];
  // Start loop at 1 to skip "Global Overview"
  for (let i = 1; i < SEAS.length; i++) {
    const d = getDistanceKm(lng, lat, SEAS[i].center[0], SEAS[i].center[1]);
    if (d < minD) {
      minD = d;
      closestSea = SEAS[i];
    }
  }
  return closestSea.name;
};

interface MapCanvasProps {
  regionsData: RegionData[];
  zonesData: any;
  trackerData: any;
  seaIndex: number;
  filterSeaIndex: number;
  selectedFish: string | null;
}

export default function MapCanvas({
  regionsData,
  zonesData,
  trackerData,
  seaIndex,
  filterSeaIndex,
  selectedFish,
}: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || regionsData.length === 0)
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
            minzoom: 4,
            layout: {
              "text-field": ["get", "zoneLabel"],
              "text-font": ["Merriweather Bold Italic"],
              "text-size": 15,
              "text-anchor": "center",
              "text-justify": "center",
            },
            paint: { "text-color": "#052648" },
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

            map.flyTo({
              center: [coordinates[0], coordinates[1]],
              zoom: Math.max(map.getZoom(), 7.5),
              duration: 1800,
              curve: 1.2,
              essential: true,
            });

            const threatLabel =
              props.overlapScore >= 0.7
                ? "CRITICAL THREAT"
                : props.overlapScore >= 0.4
                  ? "ELEVATED RISK"
                  : "Monitoring";
            const threatColor =
              props.overlapScore >= 0.7
                ? "#b91c1c"
                : props.overlapScore >= 0.4
                  ? "#ca8a04"
                  : "#047857";
            const scorePercentage = (props.overlapScore * 100).toFixed(3);
            const speed =
              props.sog !== undefined ? `${props.sog} knots` : "Unknown";
            const dist =
              props.distance_km !== undefined
                ? `${Number(props.distance_km).toFixed(2)} km`
                : "N/A";

            const popupHTML = `
              <div style="font-family: var(--font-cal); padding: 12px 36px 12px 12px; min-width: 200px;">
                <h3 style="margin: 0 0 2px 0; font-size: 15px; font-weight: 500; color: #052648; line-height: 1.2;">${props.vesselName || "Unknown Vessel"}</h3>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-family: monospace;">MMSI: ${props.mmsi || "N/A"}</p>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                  <span style="background-color: ${threatColor}; width: 8px; height: 8px; border-radius: 50%;"></span>
                  <span style="font-size: 12px; font-weight: 500; color: ${threatColor};">${threatLabel}</span>
                </div>
                <p style="margin: 0 0 2px 0; font-size: 12px; color: #052648;">Speed: <span style="font-weight: 500;">${speed}</span></p>
                <p style="margin: 0 0 2px 0; font-size: 12px; color: #052648;">Dist. to Center: <span style="font-weight: 500;">${dist}</span></p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #052648;">Overlap Score: <span style="font-weight: 500;">${scorePercentage}%</span></p>
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
        console.error("Failed to load map:", error);
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
  }, [regionsData]);

  // CAMERA CONTROLLER
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !zonesData) return;

    if (selectedFish) {
      const regionConf = regionsData.find((r) => r.id === selectedFish);
      const zonePayload = zonesData.find(
        (z: any) => z.region.id === selectedFish,
      )?.zoneData;
      let zones = zonePayload?.zones || [];

      // STRICT CAMERA FILTER: Only frame zones that belong to the active sea
      if (filterSeaIndex !== 0) {
        const activeSeaName = SEAS[filterSeaIndex].name;
        zones = zones.filter((z: any) => {
          const cLng =
            z.center?.lng ?? z.center?.[0] ?? regionConf?.fallbackCenter[0];
          const cLat =
            z.center?.lat ?? z.center?.[1] ?? regionConf?.fallbackCenter[1];
          return getClosestSea(cLng, cLat) === activeSeaName;
        });
      }

      if (zones.length > 1) {
        const lngs = zones.map(
          (z: any) =>
            z.center?.lng ?? z.center?.[0] ?? regionConf?.fallbackCenter[0],
        );
        const lats = zones.map(
          (z: any) =>
            z.center?.lat ?? z.center?.[1] ?? regionConf?.fallbackCenter[1],
        );
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 120, duration: 1000, maxZoom: 6 },
        );
      } else if (zones.length === 1) {
        const firstZone = zones[0];
        const targetLng =
          firstZone?.center?.lng ??
          firstZone?.center?.[0] ??
          regionConf?.fallbackCenter[0];
        const targetLat =
          firstZone?.center?.lat ??
          firstZone?.center?.[1] ??
          regionConf?.fallbackCenter[1];
        map.flyTo({
          center: [targetLng, targetLat],
          zoom: 5.5,
          essential: true,
          speed: 0.8,
        });
      }
    } else {
      const targetSea = SEAS[seaIndex];
      map.flyTo({
        center: targetSea.center as [number, number],
        zoom: targetSea.zoom,
        essential: true,
        speed: 0.8,
      });
    }
  }, [
    seaIndex,
    selectedFish,
    isMapReady,
    zonesData,
    regionsData,
    filterSeaIndex,
  ]);

  // DRAWING CONTROLLER
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !zonesData || !trackerData) return;

    const allZoneFeatures: any[] = [];
    const allShipFeatures: any[] = [];

    let regionsToProcess = regionsData;
    if (selectedFish) {
      regionsToProcess = regionsData.filter((r) => r.id === selectedFish);
    } else if (filterSeaIndex !== 0) {
      regionsToProcess = regionsData.filter((r) =>
        r.regionNames.includes(SEAS[filterSeaIndex].name),
      );
    }

    regionsToProcess.forEach((region) => {
      const zonePayload = zonesData.find(
        (z: any) => z.region.id === region.id,
      )?.zoneData;

      let zonesToRender =
        zonePayload?.zones && zonePayload.zones.length > 0
          ? zonePayload.zones
          : [{ center: region.fallbackCenter, radius_km: 100 }];

      const regionTracker = trackerData.find(
        (t: any) => t.region.id === region.id,
      );
      const vessels = regionTracker?.vessels || [];

      // STRICT GEOGRAPHIC FILTER: Absolute isolation of zones based on nearest body of water
      if (filterSeaIndex !== 0) {
        const activeSeaName = SEAS[filterSeaIndex].name;
        zonesToRender = zonesToRender.filter((zone: any) => {
          const cLng =
            zone.center?.lng ?? zone.center?.[0] ?? region.fallbackCenter[0];
          const cLat =
            zone.center?.lat ?? zone.center?.[1] ?? region.fallbackCenter[1];
          return getClosestSea(cLng, cLat) === activeSeaName;
        });
      }

      // Track ships that physically intersect our retained zones
      const validShipsForThisRegion = new Set();

      zonesToRender.forEach((zone: any) => {
        const centerLng =
          zone.center?.lng ?? zone.center?.[0] ?? region.fallbackCenter[0];
        const centerLat =
          zone.center?.lat ?? zone.center?.[1] ?? region.fallbackCenter[1];
        const radiusKm = zone.radius_km || 100;

        const vesselsInZone = vessels.filter((v: any) => {
          const dist = getDistanceKm(centerLng, centerLat, v.lng, v.lat);
          if (dist <= radiusKm) {
            validShipsForThisRegion.add(v);
            return true;
          }
          return false;
        });

        const maxZoneThreatScore = Math.max(
          ...vesselsInZone.map((v: any) => v.score || 0),
          0,
        );
        const zoneHasThreat = maxZoneThreatScore >= 0.7;

        const accuratePolygon = turfCircle([centerLng, centerLat], radiusKm, {
          steps: 64,
          units: "kilometers",
        });

        allZoneFeatures.push({
          type: "Feature",
          geometry: accuratePolygon.geometry,
          properties: { isThreatened: zoneHasThreat },
        });

        allZoneFeatures.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [centerLng, centerLat] },
          properties: {
            isThreatened: zoneHasThreat,
            zoneLabel: `${region.commonSpeciesName}\n(${region.scientificSpeciesName})\n~${radiusKm}km`,
          },
        });
      });

      // ONLY render ships mapped to our isolated zones
      Array.from(validShipsForThisRegion).forEach((ship: any) => {
        allShipFeatures.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [ship.lng, ship.lat] },
          properties: {
            mmsi: ship.mmsi,
            vesselName: ship.name,
            overlapScore: ship.score,
            isHighThreat: (ship.score || 0) >= 0.7,
            sog: ship.sog,
            distance_km: ship.distance_km,
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
  }, [
    zonesData,
    trackerData,
    isMapReady,
    filterSeaIndex,
    selectedFish,
    regionsData,
  ]);

  return (
    <div ref={mapContainer} className="fixed inset-0 w-screen h-screen z-0" />
  );
}
