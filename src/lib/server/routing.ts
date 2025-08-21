import type { GPXPoint } from '$lib/types';
import { env } from '$env/dynamic/private';
import type { RoutingResult } from '$lib/routing';

// Base URL for OpenRouteService API
const orsApiBaseUrl = 'https://api.openrouteservice.org/v2/directions';

export type ORSRoutingProfile =
	| 'foot-walking'
	| 'foot-hiking'
	| 'cycling-regular'
	| 'cycling-mountain'
	| 'cycling-road'
	| 'driving-car';
export type ORSPreference = 'fastest' | 'shortest' | 'recommended';

export type ORSRoutingOptions = {
	profile: ORSRoutingProfile;
	preference?: ORSPreference;
	includeElevation?: boolean;
	extraInfo?: Array<'surface' | 'steepness' | 'waytype'>;
	language?: string;
	units?: 'km' | 'm';
};

/**
 * Get a route between two points using the OpenRouteService API (server-side only)
 * @param startPoint Starting point coordinates
 * @param endPoint Ending point coordinates
 * @param options Routing options
 * @returns Promise with routing result
 */
export async function getRouteORS(
	startPoint: GPXPoint,
	endPoint: GPXPoint,
	options: Partial<ORSRoutingOptions> = {}
): Promise<RoutingResult> {
	try {
		// Get API key from environment variable
		const apiKey = env.OPENROUTESERVICE_API_KEY;

		if (!apiKey) {
			throw new Error('OPENROUTESERVICE_API_KEY environment variable is not set');
		}

		// Set default options
		const defaultOptions: ORSRoutingOptions = {
			profile: 'foot-walking',
			preference: 'recommended',
			includeElevation: true,
			extraInfo: ['surface', 'steepness', 'waytype'],
			language: 'en',
			units: 'km'
		};

		// Merge default options with provided options
		const mergedOptions = { ...defaultOptions, ...options };

		// Create payload according to API requirements
		const payload = {
			coordinates: [
				[startPoint.lon, startPoint.lat],
				[endPoint.lon, endPoint.lat]
			],
			elevation: mergedOptions.includeElevation,
			instructions_format: 'html',
			extra_info: mergedOptions.extraInfo,
			language: mergedOptions.language,
			units: mergedOptions.units,
			preference: mergedOptions.preference
		};

		// Construct URL with the selected profile
		const url = `${orsApiBaseUrl}/${mergedOptions.profile}/geojson`;

		// Make API request
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: apiKey,
				Accept: 'application/json, application/geo+json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				`OpenRouteService API error (${response.status}): ${
					errorData?.error?.message || response.statusText
				}`
			);
		}

		// Parse response
		const data = await response.json();

		// Extract route information from GeoJSON response
		if (!data.features || data.features.length === 0) {
			throw new Error('No route found between the selected points');
		}

		const routeFeature = data.features[0];
		const summary = routeFeature.properties.summary;

		// Extract coordinates from GeoJSON (they're in [lon, lat, elevation?] format)
		const routePoints: GPXPoint[] = routeFeature.geometry.coordinates.map(
			(coord: [number, number, number?]) => ({
				lon: coord[0],
				lat: coord[1],
				elevation: coord[2]
			})
		);

		return {
			route: routePoints,
			distance: summary.distance, // in meters (or km based on units param)
			duration: summary.duration // in seconds
		};
	} catch (error) {
		console.error('OpenRouteService routing error:', error);
		throw new Error(
			`Failed to get route from OpenRouteService: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}
}
