"use client";

import { GPXData } from "@shared/types";
import { Map as LeafletMap } from "leaflet";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { MapFeature } from "./types/map-features";
import { MapBounds } from "./types/map";
import { getBounds } from "@shared/math";

interface MapContextType {
  gpx: GPXData | null;
  setGpx: (gpx: GPXData | null) => void;
  map: LeafletMap | null;
  mapFeatures: MapFeature[];
  upsertFeature: (id: string, feature: MapFeature) => void;
  removeFeature: (id: string) => void;
  mapBounds: MapBounds | null;
  setMapBounds: (bounds: MapBounds | null) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function useMyMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useGpx must be used within a GpxProvider");
  return ctx;
}

export function MapContextProvider({
  map,
  children,
}: {
  map: LeafletMap | null;
  children: ReactNode;
}) {
  const [gpx, setGpx] = useState<GPXData | null>(null);
  const [features, setFeatures] = useState<Record<string, MapFeature>>({});
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  const upsertFeature = (id: string, feature: MapFeature) => {
    setFeatures((prev) => ({
      ...prev,
      [id]: feature,
    }));
  };

  const removeFeature = (id: string) => {
    setFeatures((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  useEffect(() => {
    if (gpx) {
      upsertFeature("gpx", {
        id: "gpx",
        type: "line",
        points: gpx.points,
      });
      setMapBounds(getBounds(gpx.points));
    } else {
      removeFeature("gpx");
    }
  }, [gpx]);

  const mapFeatures = Object.values(features);

  return (
    <MapContext.Provider
      value={{
        gpx,
        setGpx,
        map,
        mapFeatures,
        upsertFeature,
        removeFeature,
        mapBounds,
        setMapBounds,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
