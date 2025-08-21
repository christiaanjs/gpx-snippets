import type { GPXPoint } from './types';

export type OSRMRoutingProfile = 'driving' | 'walking' | 'cycling';
export type ORSRoutingProfile =
	| 'foot-walking'
	| 'foot-hiking'
	| 'cycling-regular'
	| 'cycling-mountain'
	| 'cycling-road'
	| 'driving-car';
export type ORSPreference = 'fastest' | 'shortest' | 'recommended';

export type RoutingResult = {
	route: GPXPoint[];
	distance: number;
	duration: number;
};

export type ORSRoutingOptions = {
	profile: ORSRoutingProfile;
	preference?: ORSPreference;
	includeElevation?: boolean;
	extraInfo?: Array<'surface' | 'steepness' | 'waytype'>;
	language?: string;
	units?: 'km' | 'm';
};

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
	profile: OSRMRoutingProfile = 'walking'
): Promise<RoutingResult> {
	try {
		// OSRM API expects coordinates in lon,lat order
		const url = `https://router.project-osrm.org/route/v1/${profile}/${startPoint.lon},${startPoint.lat};${endPoint.lon},${endPoint.lat}?overview=full&geometries=geojson`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Routing API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		if (!data.routes || data.routes.length === 0) {
			throw new Error('No route found between the selected points');
		}

		const route = data.routes[0];

		// Convert the GeoJSON coordinates (which are in [lon, lat] format) to GPXPoint format
		const routePoints: GPXPoint[] = route.geometry.coordinates.map((coord: [number, number]) => ({
			lon: coord[0],
			lat: coord[1]
		}));

		return {
			route: routePoints,
			distance: route.distance, // in meters
			duration: route.duration // in seconds
		};
	} catch (error) {
		console.error('Routing error:', error);
		throw new Error(
			`Failed to get route: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Get a route using the server-side OpenRouteService API
 * This function calls the backend API that uses the API key stored in environment variables
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
		const response = await fetch('/api/route', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				startPoint,
				endPoint,
				options
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(`API error (${response.status}): ${errorData.error || response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error('OpenRouteService client routing error:', error);
		throw new Error(
			`Failed to get route from server: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
