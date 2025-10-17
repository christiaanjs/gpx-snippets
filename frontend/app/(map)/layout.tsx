"use client";

import { ReactNode } from "react";
import { GpxProvider } from "@/lib/gpx-context";
import { SidebarUpload } from "@/components/map/SidebarUpload";
import dynamic from "next/dynamic";
const FullPageMap = dynamic(
  () => import("@/components/map/FullPageMap").then((mod) => mod.FullPageMap),
  {
    ssr: false,
  }
);

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <GpxProvider>
      <SidebarUpload />
      <FullPageMap />
      <div className="absolute inset-0 z-10 pointer-events-none">
        {children}
      </div>
    </GpxProvider>
  );
}
