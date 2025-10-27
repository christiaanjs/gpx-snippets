import * as z from "zod";

const GPXPoint = z.object({
  lat: z.number(),
  lon: z.number(),
  ele: z.number().optional(),
  time: z.date().optional(),
});

const ORSRoutingOptions = z.object({
  profile: z.enum([
    "foot-walking",
    "foot-hiking",
    "cycling-regular",
    "cycling-mountain",
    "cycling-road",
    "driving-car",
  ]),
  preference: z.enum(["fastest", "shortest", "recommended"]).optional(),
  includeElevation: z.boolean().optional(),
  extraInfo: z.array(z.enum(["surface", "steepness", "waytype"])).optional(),
  language: z.string().optional(),
  units: z.enum(["km", "m"]).optional(),
});

const ORSRoutingRequest = z.object({
  service: z.literal("ors"),
  start: GPXPoint,
  finish: GPXPoint,
  options: ORSRoutingOptions,
});

const OSRMRoutingRequest = z.object({
  service: z.literal("osrm"),
  start: GPXPoint,
  finish: GPXPoint,
  options: z.object({
    profile: z.enum(["driving", "walking", "cycling"]),
  }),
});

const RoutingRequest = z.union([ORSRoutingRequest, OSRMRoutingRequest]);
type RoutingRequest = z.infer<typeof RoutingRequest>;

export const parseRoutingRequest: (data: unknown) => RoutingRequest =
  RoutingRequest.parse;
