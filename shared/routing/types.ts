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

export type OSRMRoutingProfile = "driving" | "walking" | "cycling";

export type OSRMRoutingRequest = BaseRoutingRequest & {
  service: "osrm";
  options: {
    profile: OSRMRoutingProfile;
  };
};

export type RoutingRequest = ORSRoutingRequest | OSRMRoutingRequest;

type RoutingRequestTypes = { ors: ORSRoutingRequest; osrm: OSRMRoutingRequest };

export const isRoutingRequestFor = <Service extends keyof RoutingRequestTypes>(
  type: Service,
  request: RoutingRequest
): request is RoutingRequestTypes[Service] => {
  return request.service === type;
};



export type RoutingResult = {
  route: GPXPoint[];
  distance: number;
  duration: number;
};
