import { GPXData } from "@shared/types";
import { Map, Polyline } from "leaflet";
import L from "leaflet";

/**
 * Plot GPX trace on the map
 * @param map Leaflet Map instance
 * @param gpxData GPX data to plot
 * @param existingLayer Optional existing layer to replace
 * @returns The created polyline layer
 */
export async function plotGPXTrace(
  map: Map,
  gpxData: GPXData,
  existingLayer?: Polyline
): Promise<Polyline> {
  if (existingLayer) {
    map.removeLayer(existingLayer);
  }

  // Convert points to Leaflet LatLng format
  const latLngs = gpxData.points.map(
    (point) => [point.lat, point.lon] as [number, number]
  );

  // Create polyline
  const gpxLayer = L.polyline(latLngs, {
    color: "#e74c3c",
    weight: 3,
    opacity: 0.8,
  }).addTo(map);

  // Add markers for start and end
  if (gpxData.points.length > 0) {
    const startPoint = gpxData.points[0];
    const endPoint = gpxData.points[gpxData.points.length - 1];

    L.marker([startPoint.lat, startPoint.lon]).bindPopup("Start").addTo(map);
    L.marker([endPoint.lat, endPoint.lon]).bindPopup("End").addTo(map);
  }

  // Fit map to trace bounds
  map.fitBounds(gpxLayer.getBounds(), { padding: [20, 20] });

  return gpxLayer;
}
