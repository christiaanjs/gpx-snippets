export type GPXPoint = {
	lat: number;
	lon: number;
	elevation?: number;
	time?: Date;
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
