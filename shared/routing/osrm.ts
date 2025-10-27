import { GPXPoint } from "@shared/types";
import { OSRMRoutingProfile, RoutingResult } from "./types";

/**
 * Interpolate a route between two points using OSRM (OpenStreetMap Routing Machine)
 * @param startPoint Start point coordinates
 * @param endPoint End point coordinates
 * @param profile Routing profile (driving, walking, cycling)
 * @returns Promise with the interpolated route and metadata
 */
export async function getRouteOSRM(
  startPoint: GPXPoint,
  endPoint: GPXPoint,
  profile: OSRMRoutingProfile = "walking"
): Promise<RoutingResult> {
  try {
    // OSRM API expects coordinates in lon,lat order
    const url = `https://router.project-osrm.org/route/v1/${profile}/${startPoint.lon},${startPoint.lat};${endPoint.lon},${endPoint.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Routing API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found between the selected points");
    }

    const route = data.routes[0];

    // Convert the GeoJSON coordinates (which are in [lon, lat] format) to GPXPoint format
    const routePoints: GPXPoint[] = route.geometry.coordinates.map(
      (coord: [number, number]) => ({
        lon: coord[0],
        lat: coord[1],
      })
    );

    return {
      route: routePoints,
      distance: route.distance, // in meters
      duration: route.duration, // in seconds
    };
  } catch (error) {
    console.error("Routing error:", error);
    throw new Error(
      `Failed to get route: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
