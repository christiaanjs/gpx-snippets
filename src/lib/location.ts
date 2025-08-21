import { browser } from '$app/environment';
import type { GPXPoint } from './types';

/**
 * Get current location from browser
 * @returns Promise that resolves to [latitude, longitude]
 */
export function getCurrentLocation(): Promise<[number, number]> {
	return new Promise((resolve, reject) => {
		if (!browser || !navigator.geolocation) {
			reject(new Error('Geolocation is not supported by this browser'));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve([position.coords.latitude, position.coords.longitude]);
			},
			(error) => {
				reject(new Error(`Geolocation error: ${error.message}`));
			},
			{ timeout: 1000, enableHighAccuracy: true }
		);
	});
}

/**
 * Calculate distance between two points using Haversine formula
 * @param p1 First point
 * @param p2 Second point
 * @returns Distance in meters
 */
export function calculateDistance(p1: GPXPoint, p2: GPXPoint): number {
	const R = 6371000; // Earth's radius in meters
	const φ1 = (p1.lat * Math.PI) / 180;
	const φ2 = (p2.lat * Math.PI) / 180;
	const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
	const Δλ = ((p2.lon - p1.lon) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}
