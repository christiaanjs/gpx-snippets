export type GPXPoint = {
	lat: number;
	lon: number;
	elevation?: number;
	time?: Date;
};

export function isValidPoint(point: unknown): point is GPXPoint {
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
};

export type GPXData = {
	name: string;
	points: GPXPoint[];
};

export type TraceStats = {
	totalDistance: number;
	totalElevationGain: number;
	totalElevationLoss: number;
	minElevation: number | null;
	maxElevation: number | null;
	duration: number | null;
	startTime: Date | null;
	endTime: Date | null;
	pointCount: number;
};
