"use server";
import { parseRoutingRequest } from "@/lib/routing";
import { getRoute as getRouteLib } from "@shared/routing/index";
import { RoutingRequest, RoutingResult } from "@shared/routing/types";

export async function getRoute(
  request: RoutingRequest
): Promise<RoutingResult> {
  const routingRequest = parseRoutingRequest(request);
  return await getRouteLib(routingRequest);
}
