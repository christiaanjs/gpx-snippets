import { GPXPoint } from "@shared/types";

export type ORSRoutingProfile =
  | "foot-walking"
  | "foot-hiking"
  | "cycling-regular"
  | "cycling-mountain"
  | "cycling-road"
  | "driving-car";
export type ORSPreference = "fastest" | "shortest" | "recommended";

export type ORSRoutingOptions = {
  profile: ORSRoutingProfile;
  preference?: ORSPreference;
  includeElevation?: boolean;
  extraInfo?: Array<"surface" | "steepness" | "waytype">;
  language?: string;
  units?: "km" | "m";
};

export type BaseRoutingRequest = {
  start: GPXPoint;
  finish: GPXPoint;
};

export type ORSRoutingRequest = BaseRoutingRequest & {
  service: "ors";
  options: ORSRoutingOptions;
};

export type RoutingRequest = ORSRoutingRequest;

export const isORSRoutingRequest = (
  request: ORSRoutingRequest
): request is ORSRoutingRequest => {
  return request.service === "ors";
};

export type RoutingResult = {
  route: GPXPoint[];
  distance: number;
  duration: number;
};
