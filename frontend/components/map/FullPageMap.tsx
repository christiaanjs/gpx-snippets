"use client";

import "leaflet/dist/leaflet.css";

import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import dynamic from "next/dynamic";
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

export function FullPageMap() {
  const initialLocation = useCurrentLocation();
  return (
    <MapContainer
      center={initialLocation}
      zoom={6}
      className="absolute inset-0 z-0"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
