"use client";

import { ReactNode, useRef } from "react";
import { MapContextProvider } from "@/lib/map-context";
import { SidebarUpload } from "@/components/map/SidebarUpload";
import dynamic from "next/dynamic";
const FullPageMap = dynamic(
  () => import("@/components/map/FullPageMap").then((mod) => mod.FullPageMap),
  {
    ssr: false,
  }
);
import type { Map as LeafletMap } from "leaflet";

export default function MapLayout({ children }: { children: ReactNode }) {
  const mapRef = useRef<LeafletMap | null>(null);
  return (
    <MapContextProvider map={mapRef.current}>
      <SidebarUpload />
      <FullPageMap ref={mapRef} />
      {children}
    </MapContextProvider>
  );
}
