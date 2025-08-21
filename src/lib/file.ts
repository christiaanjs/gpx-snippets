import { parseGPX } from './gpx';
import { calculateStats } from './stats';
import type { GPXData, TraceStats } from './types';

export type FileUploadResult = {
	file: File;
	gpxData: GPXData;
	stats: TraceStats | null;
	error?: string;
};

/**
 * Validate if a file is a GPX file based on its extension
 * @param file File to validate
 * @returns True if file has .gpx extension
 */
export function isGPXFile(file: File): boolean {
	return file.name.toLowerCase().endsWith('.gpx');
}

/**
 * Process a GPX file upload
 * @param file The uploaded file
 * @returns Promise resolving to upload result with parsed data and stats
 */
export async function processGPXFile(file: File): Promise<FileUploadResult> {
	if (!isGPXFile(file)) {
		throw new Error('Invalid file type. Please select a GPX file');
	}

	try {
		// Parse the GPX file
		const gpxData = await parseGPX(file);

		// Calculate statistics
		const stats = calculateStats(gpxData.points);

		return {
			file,
			gpxData,
			stats
		};
	} catch (error) {
		throw new Error(
			`Error processing GPX file: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
