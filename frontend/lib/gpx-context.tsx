import { GPXData } from "@shared/types";
import { createContext, useContext, useState, ReactNode } from "react";

interface GpxContextType {
  gpx: GPXData | null;
  setGpx: (gpx: GPXData | null) => void;
}

const GpxContext = createContext<GpxContextType | undefined>(undefined);

export function useGpx() {
  const ctx = useContext(GpxContext);
  if (!ctx) throw new Error("useGpx must be used within a GpxProvider");
  return ctx;
}

export function GpxProvider({ children }: { children: ReactNode }) {
  const [gpx, setGpx] = useState<GPXData | null>(null);
  return (
    <GpxContext.Provider value={{ gpx, setGpx }}>
      {children}
    </GpxContext.Provider>
  );
}
