"use client";

import { LeafletStaticResources } from "./LeafletStaticResources";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import {
  ZoomControl,
  TileLayer,
  MapContainer,
  ZoomControlProps,
} from "react-leaflet";
import { useMyMap } from "@/lib/map-context";
import { forwardRef, useRef } from "react";
import { Map as LeafletMap } from "leaflet";
import { MapFeatureComponent } from "./features/MapFeatureComponent";
import { MapBoundsSetter } from "./MapBoundsSetter";

export type FullPageMapProps = {
  zoomControlPosition?: ZoomControlProps["position"];
};

export const FullPageMap = forwardRef(
  ({ zoomControlPosition = "bottomright" }: FullPageMapProps, ref) => {
    const mapRef = useRef<LeafletMap | null>(null);

    const initialLocation = useCurrentLocation();
    const { mapFeatures, mapBounds } = useMyMap();

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
          <MapBoundsSetter bounds={mapBounds} />
          {mapFeatures.map((feature) => (
            <MapFeatureComponent key={feature.id} {...feature} />
          ))}
        </MapContainer>
      </>
    );
  }
);
