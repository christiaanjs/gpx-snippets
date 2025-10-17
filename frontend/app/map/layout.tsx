"use client";

import { ReactNode } from "react";
import { FullPageMap } from "@/components/map/FullPageMap";

export default function MapLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FullPageMap />

      <div className="absolute inset-0 z-10 pointer-events-none">
        {children}
      </div>
    </>
  );
}
