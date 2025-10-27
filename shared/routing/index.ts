import { getRouteORS } from "./ors";
import { getRouteOSRM } from "./osrm";
import { isRoutingRequestFor, RoutingRequest } from "./types";

export function getRoute(routingRequest: RoutingRequest) {
  if (isRoutingRequestFor("ors", routingRequest)) {
    return getRouteORS(
      routingRequest.start,
      routingRequest.finish,
      routingRequest.options
    );
  } else if (isRoutingRequestFor("osrm", routingRequest)) {
    return getRouteOSRM(
      routingRequest.start,
      routingRequest.finish,
      routingRequest.options.profile
    );
  } else {
    throw new Error("Unsupported routing service");
  }
}
