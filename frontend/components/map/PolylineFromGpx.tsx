"use client";

import { GPXData } from "@shared/types";
import { forwardRef } from "react";
import { Polyline as LeafletPolyline } from "leaflet";
import { Polyline } from "react-leaflet";

export const PolylineFromGpx = forwardRef<
  LeafletPolyline,
  { gpxData: GPXData }
>(({ gpxData }, ref) => {
  const latLngs = gpxData.points.map(
    (point) => [point.lat, point.lon] as [number, number]
  );

  return (
    <Polyline
      positions={latLngs}
      pathOptions={{ color: "#e74c3c" }}
      ref={ref}
    />
  );
});
