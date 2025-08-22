import type { Map, Polyline } from 'leaflet';
import type { GPXData, GPXPoint } from './types';
import { browser } from '$app/environment';
import { getCurrentLocation } from './location';
import type { RoutingResult } from './routing';

export type MapInitOptions = {
	container: HTMLElement;
	defaultLocation?: [number, number];
	defaultZoom?: number;
	useGeolocation?: boolean;
};

export type MapInitResult = {
	map: Map;
	location: [number, number];
	error: string | null;
};

/**
 * Initialize Leaflet map with optional geolocation
 * @param options Map initialization options
 * @returns Promise with the initialized map and location information
 */
export async function initializeMap(options: MapInitOptions): Promise<MapInitResult> {
	if (!browser) {
		throw new Error('Map can only be initialized in browser environment');
	}

	// Default values
	const defaultLocation = options.defaultLocation || [40.7128, -74.006]; // NYC
	const defaultZoom = options.defaultZoom || 13;
	const useGeolocation = options.useGeolocation !== false; // Default to true

	let center = defaultLocation;
	let zoom = defaultZoom;
	let error: string | null = null;

	// Try to get current location if enabled
	if (useGeolocation) {
		try {
			center = await getCurrentLocation();
			zoom = 14; // Zoom a bit closer when we have user's location
		} catch (err) {
			console.warn('Could not get current location:', err);
			error = err instanceof Error ? err.message : 'Unknown location error';
		}
	}

	// Import Leaflet dynamically to avoid SSR issues
	const L = await import('leaflet');

	// Initialize map centered on determined location
	const map = L.map(options.container, {
		center,
		zoom
	});

	// Add default tile layer
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© OpenStreetMap contributors'
	}).addTo(map);

	return {
		map,
		location: center,
		error
	};
}

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
	// Import Leaflet dynamically
	const L = await import('leaflet');

	// Remove existing layer if present
	if (existingLayer) {
		map.removeLayer(existingLayer);
	}

	// Convert points to Leaflet LatLng format
	const latLngs = gpxData.points.map((point) => [point.lat, point.lon] as [number, number]);

	// Create polyline
	const gpxLayer = L.polyline(latLngs, {
		color: '#e74c3c',
		weight: 3,
		opacity: 0.8
	}).addTo(map);

	// Add markers for start and end
	if (gpxData.points.length > 0) {
		const startPoint = gpxData.points[0];
		const endPoint = gpxData.points[gpxData.points.length - 1];

		L.marker([startPoint.lat, startPoint.lon]).bindPopup('Start').addTo(map);
		L.marker([endPoint.lat, endPoint.lon]).bindPopup('End').addTo(map);
	}

	// Fit map to trace bounds
	map.fitBounds(gpxLayer.getBounds(), { padding: [20, 20] });

	return gpxLayer;
}

/**
 * Plot an interpolated route on the map
 * @param map Leaflet Map instance
 * @param routeData Route data to plot
 * @param startPoint The starting point
 * @param endPoint The ending point
 * @param existingLayer Optional existing layer to replace
 * @returns The created polyline layer
 */
export async function plotInterpolatedRoute(
	map: Map,
	routeData: RoutingResult,
	startPoint: GPXPoint,
	endPoint: GPXPoint,
	existingLayer?: Polyline
): Promise<Polyline> {
	// Import Leaflet dynamically
	const L = await import('leaflet');

	// Remove existing layer if present
	if (existingLayer) {
		map.removeLayer(existingLayer);
	}

	// Convert points to Leaflet LatLng format
	const latLngs = routeData.route.map((point) => [point.lat, point.lon] as [number, number]);

	// Create polyline with a different style than the GPX trace
	const routeLayer = L.polyline(latLngs, {
		color: '#3498db', // Blue color for interpolated route
		weight: 5,
		opacity: 0.9,
		dashArray: '10, 10' // Dashed line to distinguish from original trace
	}).addTo(map);

	// Add markers for the selected points
	L.marker([startPoint.lat, startPoint.lon]).bindPopup('Route Start').addTo(map);

	L.marker([endPoint.lat, endPoint.lon]).bindPopup('Route End').addTo(map);

	// Fit map to route bounds
	map.fitBounds(routeLayer.getBounds(), { padding: [20, 20] });

	return routeLayer;
}

/**
 * Create a clickable GPX trace that allows point selection
 * @param map Leaflet Map instance
 * @param gpxData GPX data
 * @param onPointSelected Callback function when a point is selected
 * @param existingLayer Optional existing layer to replace
 * @returns The created polyline layer
 */
export async function createSelectableGPXTrace(
	map: Map,
	gpxData: GPXData,
	onPointSelected: (point: GPXPoint, index: number) => void,
	existingLayer?: Polyline
): Promise<Polyline> {
	// Import Leaflet dynamically
	const L = await import('leaflet');

	// Remove existing layer if present
	if (existingLayer) {
		map.removeLayer(existingLayer);
	}

	// Convert points to Leaflet LatLng format
	const latLngs = gpxData.points.map((point) => [point.lat, point.lon] as [number, number]);

	// Create polyline
	const gpxLayer = L.polyline(latLngs, {
		color: '#e74c3c',
		weight: 3,
		opacity: 0.8
	}).addTo(map);

	// Add markers for start and end
	if (gpxData.points.length > 0) {
		const startPoint = gpxData.points[0];
		const endPoint = gpxData.points[gpxData.points.length - 1];

		L.marker([startPoint.lat, startPoint.lon]).bindPopup('Start').addTo(map);
		L.marker([endPoint.lat, endPoint.lon]).bindPopup('End').addTo(map);
	}

	// Create clickable points along the trace
	gpxData.points.forEach((point, index) => {
		// Create a small circle marker at each point
		const circleMarker = L.circleMarker([point.lat, point.lon], {
			radius: 4,
			color: '#e74c3c',
			fillColor: '#e74c3c',
			fillOpacity: 0.8,
			opacity: 0.8
		}).addTo(map);

		// Add click handler
		circleMarker.on('click', () => {
			onPointSelected(point, index);
		});

		// Add hover effect
		circleMarker.on('mouseover', () => {
			circleMarker.setStyle({
				radius: 6,
				fillOpacity: 1
			});
		});

		circleMarker.on('mouseout', () => {
			circleMarker.setStyle({
				radius: 4,
				fillOpacity: 0.8
			});
		});
	});

	// Fit map to trace bounds
	map.fitBounds(gpxLayer.getBounds(), { padding: [20, 20] });

	return gpxLayer;
}
