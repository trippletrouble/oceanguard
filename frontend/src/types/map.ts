import type { Species } from "./species";

export interface Vessel {
  mmsi: number;
  name: string;
  lat: number;
  lng: number;
  score: number | null;
  level: "CRITICAL" | "WARNING" | "LOW";
  sog?: number;
  distance_km?: number;
  shiptype?: number | string | null;
  category?: string;
  classification_source?: string;
}

export interface RegionData {
  id: string;
  regionNames: string[];
  commonSpeciesName: string;
  scientificSpeciesName: string;
  active: boolean;
  zoom: number;
  fallbackCenter: [number, number];
  links?: Species["links"];
}

export const SEAS = [
  { name: "Global Overview", center: [5.0, 48.0], zoom: 3.2 },
  { name: "Mediterranean Sea", center: [15.0, 38.0], zoom: 4.5 },
  { name: "North Sea", center: [3.0, 56.5], zoom: 4.5 },
  { name: "European Atlantic Coast", center: [-9.5, 40.0], zoom: 5.0 },
];

export const getDistanceKm = (
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

export const getClosestSea = (lng: number, lat: number) => {
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
