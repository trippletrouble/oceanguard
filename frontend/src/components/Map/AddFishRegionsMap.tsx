import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSONSource, Map, config } from "@maptiler/sdk";
import turfCircle from "@turf/circle";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import "@maptiler/sdk/dist/maptiler-sdk.css";

config.apiKey = ***ENTFERNT***;

interface Species {
  id: string;
  common_name: string;
}

interface ZonePayload {
  speciesId: string;
  zoneData?: {
    zones?: MigrationZone[];
  };
}

interface ResolvedRegion {
  name: string;
  bbox: [number, number, number, number];
}

interface MigrationZone {
  center?: {
    lng?: number;
    lat?: number;
  } | [number, number];
  radius_km?: number;
}

interface AddFishRegionsMapProps {
  species: Species[];
  zonesData?: ZonePayload[];
  speciesRegionsMap: Record<string, ResolvedRegion[]>;
  selectedSpeciesId: string;
  selectedRegionIndex: number;
}

type RegionFeature = Feature<
  Polygon | Point,
  { color: string; isSelected: boolean; label: string }
>;

const EMPTY_COLLECTION: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const getDisplayName = (commonName: string) => {
  if (commonName.toLowerCase() === "atlantic bluefin tuna") return "Bluefin Tuna";
  if (commonName.toLowerCase() === "european sardine") return "Sardine";
  return commonName;
};

const getSpeciesColor = (commonName: string) => {
  const normalizedName = commonName.toLowerCase();
  if (normalizedName.includes("bluefin")) return "#1d4ed8";
  if (normalizedName.includes("atlantic cod")) return "#15803d";
  if (normalizedName.includes("sardine")) return "#ca8a04";
  if (normalizedName.includes("swordfish")) return "#111827";
  return "#334155";
};

const getBBoxPolygon = ([minLat, minLng, maxLat, maxLng]: ResolvedRegion["bbox"]): Polygon => ({
  type: "Polygon",
  coordinates: [
    [
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ],
  ],
});

const getZoneCenter = (zone: MigrationZone) => {
  if (!zone.center) return null;
  if (Array.isArray(zone.center)) {
    return { lng: zone.center[0], lat: zone.center[1] };
  }
  if (zone.center.lng === undefined || zone.center.lat === undefined) {
    return null;
  }
  return { lng: zone.center.lng, lat: zone.center.lat };
};

export default function AddFishRegionsMap({
  species,
  zonesData,
  speciesRegionsMap,
  selectedSpeciesId,
  selectedRegionIndex,
}: AddFishRegionsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const regionFeatures = useMemo(() => {
    const features: RegionFeature[] = [];
    const bounds = {
      minLng: Infinity,
      minLat: Infinity,
      maxLng: -Infinity,
      maxLat: -Infinity,
    };

    const extendBounds = (lng: number, lat: number) => {
      bounds.minLng = Math.min(bounds.minLng, lng);
      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLng = Math.max(bounds.maxLng, lng);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
    };

    species.forEach((fish) => {
      const displayName = getDisplayName(fish.common_name);
      const color = getSpeciesColor(fish.common_name);
      const zones =
        zonesData?.find((payload) => payload.speciesId === fish.id)?.zoneData?.zones || [];

      if (zones.length > 0) {
        zones.forEach((zone, index) => {
          const center = getZoneCenter(zone);
          if (!center) return;
          const isSelected = fish.id === selectedSpeciesId && index === selectedRegionIndex;

          const radiusKm = zone.radius_km || 100;
          const circle = turfCircle([center.lng, center.lat], radiusKm, {
            steps: 64,
            units: "kilometers",
          });
          const buffer = radiusKm / 111;

          extendBounds(center.lng - buffer, center.lat - buffer);
          extendBounds(center.lng + buffer, center.lat + buffer);

          features.push({
            type: "Feature",
            geometry: circle.geometry,
            properties: { color, isSelected, label: displayName },
          });
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [center.lng, center.lat] },
            properties: { color, isSelected, label: displayName },
          });
        });
        return;
      }

      (speciesRegionsMap[fish.id] || []).forEach((region, index) => {
        const [minLat, minLng, maxLat, maxLng] = region.bbox;
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;
        const isSelected = fish.id === selectedSpeciesId && index === selectedRegionIndex;

        extendBounds(minLng, minLat);
        extendBounds(maxLng, maxLat);

        features.push({
          type: "Feature",
          geometry: getBBoxPolygon(region.bbox),
          properties: { color, isSelected, label: displayName },
        });
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [centerLng, centerLat] },
          properties: { color, isSelected, label: displayName },
        });
      });
    });

    return {
      collection: { type: "FeatureCollection" as const, features },
      bounds: Number.isFinite(bounds.minLng) ? bounds : null,
    };
  }, [selectedRegionIndex, selectedSpeciesId, species, speciesRegionsMap, zonesData]);

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
          center: [5, 48],
          zoom: 3.2,
          pitch: 0,
          terrain: false,
          maxPitch: 0,
          attributionControl: { compact: true },
          maptilerLogo: false,
        });

        mapRef.current = map;

        map.on("load", () => {
          map.resize();
          map.addSource("add-fish-species-regions", {
            type: "geojson",
            data: EMPTY_COLLECTION,
          });
          map.addLayer({
            id: "add-fish-region-fill",
            type: "fill",
            source: "add-fish-species-regions",
            filter: ["==", ["geometry-type"], "Polygon"],
            paint: {
              "fill-color": ["get", "color"],
              "fill-opacity": [
                "case",
                ["boolean", ["get", "isSelected"], false],
                0.26,
                0.08,
              ],
            },
          });
          map.addLayer({
            id: "add-fish-region-outline",
            type: "line",
            source: "add-fish-species-regions",
            filter: ["==", ["geometry-type"], "Polygon"],
            paint: {
              "line-color": ["get", "color"],
              "line-opacity": [
                "case",
                ["boolean", ["get", "isSelected"], false],
                1,
                0.6,
              ],
              "line-width": [
                "case",
                ["boolean", ["get", "isSelected"], false],
                5,
                2.5,
              ],
            },
          });
          map.addLayer({
            id: "add-fish-region-label",
            type: "symbol",
            source: "add-fish-species-regions",
            filter: [
              "all",
              ["==", ["geometry-type"], "Point"],
              ["==", ["get", "isSelected"], true],
            ],
            layout: {
              "text-field": ["get", "label"],
              "text-size": 13,
              "text-font": ["Merriweather Bold Italic"],
              "text-anchor": "center",
              "text-justify": "center",
              "text-allow-overlap": false,
            },
            paint: {
              "text-color": ["get", "color"],
              "text-halo-color": "#ffffff",
              "text-halo-width": 2,
            },
          });

          setIsMapReady(true);
        });
      } catch (error) {
        console.error("Failed to load add fish regions map:", error);
      }
    };

    initializeMap();
    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map) return;

    const source = map.getSource("add-fish-species-regions");
    if (source) {
      (source as GeoJSONSource).setData(regionFeatures.collection);
    }

    if (regionFeatures.bounds) {
      map.fitBounds(
        [
          [regionFeatures.bounds.minLng, regionFeatures.bounds.minLat],
          [regionFeatures.bounds.maxLng, regionFeatures.bounds.maxLat],
        ],
        { padding: 56, duration: 700, maxZoom: 5.6 },
      );
    }
  }, [isMapReady, regionFeatures]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl">
      <div ref={mapContainer} className="h-[48vh] min-h-[320px] w-full" />
    </div>
  );
}
