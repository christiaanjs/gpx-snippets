"use server";
import { assertRoutingRequest } from "@/lib/routing";
import { getRoute as getRouteLib } from "@shared/routing/index";
import { RoutingResult } from "@shared/routing/types";

export async function getRoute(request: unknown): Promise<RoutingResult> {
  const routingRequest = assertRoutingRequest(request);
  return await getRouteLib(routingRequest);
}
