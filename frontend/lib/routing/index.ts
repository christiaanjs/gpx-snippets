import { RoutingRequest } from "@shared/routing/types";
import typia from "typia";

export const assertRoutingRequest = typia.createAssert<RoutingRequest>();
