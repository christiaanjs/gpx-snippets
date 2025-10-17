"use client";

import { LeafletStaticResources } from "./LeafletStaticResources";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import {
  ZoomControl,
  TileLayer,
  MapContainer,
  ZoomControlProps,
} from "react-leaflet";
import { useGpx } from "@/lib/gpx-context";
import { useEffect, useRef } from "react";
import { plotGPXTrace } from "@/lib/plot-trace";

export type FullPageMapProps = {
  zoomControlPosition?: ZoomControlProps["position"];
};

export function FullPageMap({
  zoomControlPosition = "bottomright",
}: FullPageMapProps = {}) {
  const mapRef = useRef<L.Map | null>(null);
  const initialLocation = useCurrentLocation();
  const { gpx } = useGpx();

  useEffect(() => {
    if (gpx && mapRef.current) {
      plotGPXTrace(mapRef.current, gpx);
    }
  }, [gpx, mapRef.current]);

  return (
    <>
      <LeafletStaticResources />
      <MapContainer
        center={initialLocation}
        zoom={6}
        className="absolute inset-0 z-0"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position={zoomControlPosition} />
      </MapContainer>
    </>
  );
}
