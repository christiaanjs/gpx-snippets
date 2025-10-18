import { LineFeature } from "@/lib/types/map-features";
import { JSX } from "react";
import { PolylineFromGpx } from "../PolylineFromGpx";

export function LineComponent({ points }: LineFeature): JSX.Element {
  return <PolylineFromGpx points={points} />;
}
