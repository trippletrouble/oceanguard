export interface Vessel {
  mmsi: number;
  name: string;
  lat: number;
  lng: number;
  score: number | null;
  level: "CRITICAL" | "WARNING" | "LOW";
}

export interface RegionData {
  id: string;
  regionNames: string[];
  commonSpeciesName: string;
  scientificSpeciesName: string;
  active: boolean;
  zoom: number;
  fallbackCenter: [number, number];
}

export const SEAS = [
  { name: "Global Overview", center: [5.0, 48.0], zoom: 3.2 },
  { name: "Mediterranean Sea", center: [15.0, 38.0], zoom: 4.5 },
  { name: "North Sea", center: [3.0, 56.5], zoom: 4.5 },
  { name: "European Atlantic Coast", center: [-9.5, 40.0], zoom: 5.0 },
];
