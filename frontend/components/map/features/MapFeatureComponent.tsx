import {
  LineFeature,
  MapFeature,
  SelectablePointLineFeature,
} from "@/lib/types/map-features";
import { LineComponent } from "./LineComponent";
import { ReactNode } from "react";
import { SelectablePointLineComponent } from "./SelectablePointLineComponent";

export function MapFeatureComponent(feature: MapFeature): ReactNode {
  switch (feature.type) {
    case "line":
      return <LineComponent {...(feature as LineFeature)} />;
    case "selectable-point-line":
      return (
        <SelectablePointLineComponent
          {...(feature as SelectablePointLineFeature)}
        />
      );
    default:
      return null;
  }
}
