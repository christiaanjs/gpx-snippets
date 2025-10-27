import { GPXPoint } from "@shared/types";
import { PolylineProps } from "react-leaflet";

type MapFeatureTypes = "line" | "selectable-point-line";

type BaseMapFeature = {
  type: MapFeatureTypes;
  id: string;
};

export type LineFeature = BaseMapFeature & {
  type: "line";
  points: GPXPoint[];
  options?: Omit<PolylineProps, "positions">;
};

export type SelectablePointLineFeature = BaseMapFeature & {
  type: "selectable-point-line";
  points: GPXPoint[];
  selectedPoints?: GPXPoint[];
  onPointSelect: (point: GPXPoint, index: number) => void;
};

export type MapFeature = LineFeature | SelectablePointLineFeature;
