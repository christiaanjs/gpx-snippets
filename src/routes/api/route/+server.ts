import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRouteORS } from '$lib/server/routing';
import type { GPXPoint } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get request data
		const data = await request.json();
		const { startPoint, endPoint, options } = data;

		// Validate request data
		if (!startPoint || !endPoint || !isValidPoint(startPoint) || !isValidPoint(endPoint)) {
			return json({ error: 'Invalid start or end point' }, { status: 400 });
		}

		// Get route using server-side API with key
		const result = await getRouteORS(startPoint, endPoint, options);

		return json(result);
	} catch (error) {
		console.error('Route API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown routing error' },
			{ status: 500 }
		);
	}
};

// Helper function to validate point data
function isValidPoint(point: unknown): point is GPXPoint {
	if (!point || typeof point !== 'object') return false;

	const maybePoint = point as Record<string, unknown>;

	return (
		'lat' in maybePoint &&
		'lon' in maybePoint &&
		typeof maybePoint.lat === 'number' &&
		typeof maybePoint.lon === 'number' &&
		!isNaN(maybePoint.lat) &&
		!isNaN(maybePoint.lon)
	);
}
