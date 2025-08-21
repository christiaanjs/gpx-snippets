import type { GPXData, GPXPoint } from './types';

/**
 * Parse a GPX file into a structured data format
 * @param file GPX file to parse
 * @returns Promise resolving to parsed GPX data
 */
export async function parseGPX(file: File): Promise<GPXData> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e: ProgressEvent<FileReader>) => {
			try {
				if (!e.target?.result) {
					reject(new Error('Failed to read file'));
					return;
				}

				const parser = new DOMParser();
				const gpxDoc = parser.parseFromString(e.target.result as string, 'text/xml');

				if (gpxDoc.getElementsByTagName('parsererror').length > 0) {
					reject(new Error('Invalid GPX file format'));
					return;
				}

				const trackPoints: GPXPoint[] = [];
				const trkpts = gpxDoc.getElementsByTagName('trkpt');

				for (let i = 0; i < trkpts.length; i++) {
					const pt = trkpts[i];
					const lat = parseFloat(pt.getAttribute('lat') || '');
					const lon = parseFloat(pt.getAttribute('lon') || '');

					if (!isNaN(lat) && !isNaN(lon)) {
						const point: GPXPoint = { lat, lon };

						// Extract elevation if available
						const eleNode = pt.getElementsByTagName('ele')[0];
						if (eleNode) {
							point.elevation = parseFloat(eleNode.textContent || '');
						}

						// Extract time if available
						const timeNode = pt.getElementsByTagName('time')[0];
						if (timeNode) {
							point.time = new Date(timeNode.textContent || '');
						}

						trackPoints.push(point);
					}
				}

				// Extract track name
				const trackName = gpxDoc.getElementsByTagName('name')[0]?.textContent || 'Unnamed Track';

				resolve({
					name: trackName,
					points: trackPoints
				});
			} catch (error) {
				reject(error instanceof Error ? error : new Error('Unknown error parsing GPX'));
			}
		};
		reader.readAsText(file);
	});
}
