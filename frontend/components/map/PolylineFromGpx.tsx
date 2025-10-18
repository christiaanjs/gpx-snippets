"use client";

import { GPXData, GPXPoint } from "@shared/types";
import { forwardRef } from "react";
import { Polyline, PolylineProps } from "react-leaflet";

type Props = { points: GPXPoint[] } & Omit<PolylineProps, "positions">;

export const PolylineFromGpx = forwardRef(
  ({ points, ...props }: Props, ref) => {
    const latLngs = points.map(
      (point) => [point.lat, point.lon] as [number, number]
    );

    return (
      <Polyline
        positions={latLngs}
        pathOptions={{ color: "#e74c3c" }}
        {...props}
      />
    );
  }
);
