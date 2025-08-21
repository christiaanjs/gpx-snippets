import { calculateDistance } from './location';
import type { TraceStats, GPXPoint } from './types';

/**
 * Calculate statistics for a GPX trace
 * @param points Array of GPX points
 * @returns Statistics for the trace or null if insufficient points
 */
export function calculateStats(points: GPXPoint[]): TraceStats | null {
	if (points.length < 2) return null;

	let totalDistance = 0;
	let totalElevationGain = 0;
	let totalElevationLoss = 0;
	let minElevation = Infinity;
	let maxElevation = -Infinity;
	let startTime: Date | null = null;
	let endTime: Date | null = null;

	for (let i = 0; i < points.length; i++) {
		const point = points[i];

		// Elevation stats
		if (point.elevation !== undefined) {
			minElevation = Math.min(minElevation, point.elevation);
			maxElevation = Math.max(maxElevation, point.elevation);

			if (i > 0 && points[i - 1].elevation !== undefined) {
				const elevDiff = point.elevation - (points[i - 1].elevation || 0);
				if (elevDiff > 0) {
					totalElevationGain += elevDiff;
				} else {
					totalElevationLoss += Math.abs(elevDiff);
				}
			}
		}

		// Time stats
		if (point.time) {
			if (!startTime) startTime = point.time;
			endTime = point.time;
		}

		// Distance calculation
		if (i > 0) {
			const prev = points[i - 1];
			totalDistance += calculateDistance(prev, point);
		}
	}

	const duration = startTime && endTime ? endTime.getTime() - startTime.getTime() : null;

	return {
		totalDistance: totalDistance / 1000, // Convert to km
		totalElevationGain,
		totalElevationLoss,
		minElevation: minElevation === Infinity ? null : minElevation,
		maxElevation: maxElevation === -Infinity ? null : maxElevation,
		duration,
		startTime,
		endTime,
		pointCount: points.length
	};
}

/**
 * Format duration in milliseconds to a human-readable string
 * @param milliseconds Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(milliseconds: number | null): string {
	if (!milliseconds) return 'N/A';

	const hours = Math.floor(milliseconds / (1000 * 60 * 60));
	const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
}

export function getStatsDisplayItems(stats: TraceStats | null): { label: string; value: string }[] {
	if (!stats) return [];

	const items = [
		{ label: 'Distance', value: `${stats.totalDistance.toFixed(2)} km` },
		{ label: 'Duration', value: formatDuration(stats.duration) },
		{ label: 'Points', value: stats.pointCount.toLocaleString() }
	];

	// Add elevation items if available
	if (stats.minElevation !== null && stats.maxElevation !== null) {
		items.push(
			{
				label: 'Elevation Range',
				value: `${stats.minElevation.toFixed(0)}m - ${stats.maxElevation.toFixed(0)}m`
			},
			{
				label: 'Elevation Gain',
				value: `+${stats.totalElevationGain.toFixed(0)}m`
			},
			{
				label: 'Elevation Loss',
				value: `-${stats.totalElevationLoss.toFixed(0)}m`
			}
		);
	}

	return items;
}
