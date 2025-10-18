import { GPXPoint } from "@shared/types";

type MapFeatureTypes = "line" | "selectable-point-line";

type BaseMapFeature = {
  type: MapFeatureTypes;
  id: string;
};

export type LineFeature = BaseMapFeature & {
  type: "line";
  points: GPXPoint[];
};

export type SelectablePointLineFeature = BaseMapFeature & {
  type: "selectable-point-line";
  points: GPXPoint[];
  onPointSelect: (point: GPXPoint, index: number) => void;
};

export type MapFeature = LineFeature | SelectablePointLineFeature;
