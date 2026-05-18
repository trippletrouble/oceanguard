import { useEffect, useRef } from "react";
import { Map, MapStyle, config } from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

config.apiKey = ***ENTFERNT***;

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new Map({
      container: mapContainer.current,
      style: MapStyle.OCEAN,
      center: [-15, 55],
      zoom: 4,
      pitch: 0,
      terrain: false,
      maxPitch: 0,
    });

    mapRef.current.on("load", () => {
      const map = mapRef.current;
      if (!map) return;

      map.addSource("ships", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [-10.5, 56.2] },
              properties: { vesselName: "Trawler One" },
            },
          ],
        },
      });

      map.addLayer({
        id: "ship-layer",
        type: "circle",
        source: "ships",
        paint: {
          "circle-radius": 8,
          "circle-color": "#ff3333",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div
        ref={mapContainer}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
    </div>
  );
}
