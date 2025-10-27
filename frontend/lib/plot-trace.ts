import { GPXData, GPXPoint } from "@shared/types";
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

export async function plotSelectableGPXTrace(
  map: Map,
  gpxData: GPXData,
  onPointSelected: (point: GPXPoint, index: number) => void,
  existingLayer?: Polyline
): Promise<Polyline> {
  // Remove existing layer if present
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

  // Create clickable points along the trace
  gpxData.points.forEach((point, index) => {
    // Create a small circle marker at each point
    const circleMarker = L.circleMarker([point.lat, point.lon], {
      radius: 4,
      color: "#e74c3c",
      fillColor: "#e74c3c",
      fillOpacity: 0.8,
      opacity: 0.8,
    }).addTo(map);

    // Add click handler
    circleMarker.on("click", () => {
      onPointSelected(point, index);
    });

    // Add hover effect
    circleMarker.on("mouseover", () => {
      circleMarker.setStyle({
        radius: 6,
        fillOpacity: 1,
      });
    });

    circleMarker.on("mouseout", () => {
      circleMarker.setStyle({
        radius: 4,
        fillOpacity: 0.8,
      });
    });
  });

  // Fit map to trace bounds
  map.fitBounds(gpxLayer.getBounds(), { padding: [20, 20] });

  return gpxLayer;
}
