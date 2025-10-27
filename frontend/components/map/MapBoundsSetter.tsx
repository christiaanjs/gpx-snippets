import { MapBounds } from "@shared/types";
import { ReactNode, useEffect } from "react";
import { useMap } from "react-leaflet";

export function MapBoundsSetter({
  bounds,
}: {
  bounds: MapBounds | null;
}): ReactNode {
  const map = useMap();

  useEffect(() => {
    if (map && bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);

  return null;
}
