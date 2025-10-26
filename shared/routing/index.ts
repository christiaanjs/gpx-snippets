import { getRouteORS } from "./ors";
import { isORSRoutingRequest, RoutingRequest } from "./types";

export function getRoute(routingRequest: RoutingRequest) {
  if (isORSRoutingRequest(routingRequest)) {
    return getRouteORS(
      routingRequest.start,
      routingRequest.finish,
      routingRequest.options
    );
  } else {
    throw new Error("Unsupported routing service");
  }
}
