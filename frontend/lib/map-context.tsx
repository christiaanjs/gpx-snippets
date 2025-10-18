"use client";

import { GPXData } from "@shared/types";
import { Map as LeafletMap } from "leaflet";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  JSX,
  useEffect,
} from "react";
import dynamic from "next/dynamic";

const PolylineFromGpx = dynamic(
  () =>
    import("@/components/map/PolylineFromGpx").then(
      (mod) => mod.PolylineFromGpx
    ),
  {
    ssr: false,
  }
);

interface MapContextType {
  gpx: GPXData | null;
  setGpx: (gpx: GPXData | null) => void;
  map: LeafletMap | null;
  mapFeatures: JSX.Element[];
  upsertFeature: (id: string, feature: JSX.Element) => void;
  removeFeature: (id: string) => void;
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
  const [features, setFeatures] = useState<Record<string, JSX.Element>>({});

  const upsertFeature = (id: string, feature: JSX.Element) => {
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
      upsertFeature(
        "gpx-polyline",
        <PolylineFromGpx key="gpx-polyline" gpxData={gpx} />
      );
    } else {
      removeFeature("gpx-polyline");
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
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
