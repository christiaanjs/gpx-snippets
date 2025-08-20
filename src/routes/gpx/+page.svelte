<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Map, TileLayer, Polyline, Marker } from 'leaflet';

	// Define interfaces for type safety
	interface GPXPoint {
		lat: number;
		lon: number;
		elevation?: number;
		time?: Date;
	}

	interface GPXData {
		name: string;
		points: GPXPoint[];
	}

	interface TraceStats {
		totalDistance: number;
		totalElevationGain: number;
		totalElevationLoss: number;
		minElevation: number | null;
		maxElevation: number | null;
		duration: number | null;
		startTime: Date | null;
		endTime: Date | null;
		pointCount: number;
	}

	let mapContainer: HTMLDivElement;
	let map: Map;
	let gpxLayer: Polyline;
	let fileInput: HTMLInputElement;
	let uploadedFile: File | null = null;
	let gpxData: GPXData | null = null;
	let traceStats: TraceStats | null = null;

	// Initialize the map
	onMount(async () => {
		if (browser) {
			// Dynamically import Leaflet to avoid SSR issues
			const L = await import('leaflet');

			// Initialize map centered on a default location
			map = L.map(mapContainer, {
				center: [40.7128, -74.006], // NYC default
				zoom: 13
			});

			// Add OpenStreetMap tiles
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors'
			}).addTo(map);
		}
	});

	// Parse GPX file
	async function parseGPX(file: File): Promise<GPXData> {
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

					// Check for parsing errors
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

	// Calculate basic statistics
	function calculateStats(points: GPXPoint[]): TraceStats | null {
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

			// Distance calculation (Haversine formula)
			if (i > 0) {
				const prev = points[i - 1];
				const R = 6371000; // Earth's radius in meters
				const φ1 = (prev.lat * Math.PI) / 180;
				const φ2 = (point.lat * Math.PI) / 180;
				const Δφ = ((point.lat - prev.lat) * Math.PI) / 180;
				const Δλ = ((point.lon - prev.lon) * Math.PI) / 180;

				const a =
					Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
					Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				totalDistance += R * c;
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

	// Handle file upload
	async function handleFileUpload(event: Event): Promise<void> {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (!file.name.toLowerCase().endsWith('.gpx')) {
			alert('Please select a GPX file');
			return;
		}

		try {
			uploadedFile = file;
			gpxData = await parseGPX(file);
			traceStats = calculateStats(gpxData.points);
			plotTrace();
		} catch (error) {
			alert(`Error parsing GPX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// Plot the trace on the map
	async function plotTrace(): Promise<void> {
		if (!map || !gpxData) return;

		const L = await import('leaflet');

		// Remove existing layer if present
		if (gpxLayer) {
			map.removeLayer(gpxLayer);
		}

		// Convert points to Leaflet LatLng format
		const latLngs = gpxData.points.map((point) => [point.lat, point.lon] as [number, number]);

		// Create polyline
		gpxLayer = L.polyline(latLngs, {
			color: '#e74c3c',
			weight: 3,
			opacity: 0.8
		}).addTo(map);

		// Add markers for start and end
		const startPoint = gpxData.points[0];
		const endPoint = gpxData.points[gpxData.points.length - 1];

		L.marker([startPoint.lat, startPoint.lon]).bindPopup('Start').addTo(map);

		L.marker([endPoint.lat, endPoint.lon]).bindPopup('End').addTo(map);

		// Fit map to trace bounds
		map.fitBounds(gpxLayer.getBounds(), { padding: [20, 20] });
	}

	// Format duration helper
	function formatDuration(milliseconds: number | null): string {
		if (!milliseconds) return 'N/A';

		const hours = Math.floor(milliseconds / (1000 * 60 * 60));
		const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}
</script>

<svelte:head>
	<title>GPX Trace Plotter</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div class="app">
	<header>
		<h1>GPX Trace Plotter</h1>
		<p>Upload a GPX file to visualize your GPS track</p>
	</header>

	<main>
		<div class="upload-section">
			<input type="file" accept=".gpx" bind:this={fileInput} on:change={handleFileUpload} />

			{#if uploadedFile}
				<div class="file-info">
					<strong>Loaded:</strong>
					{uploadedFile.name}
				</div>
			{/if}
		</div>

		{#if gpxData && traceStats}
			<div class="stats-section">
				<h3>{gpxData.name}</h3>
				<div class="stats-grid">
					<div class="stat">
						<span>Distance:</span>
						<span>{traceStats.totalDistance.toFixed(2)} km</span>
					</div>
					<div class="stat">
						<span>Duration:</span>
						<span>{formatDuration(traceStats.duration)}</span>
					</div>
					<div class="stat">
						<span>Points:</span>
						<span>{traceStats.pointCount.toLocaleString()}</span>
					</div>
					{#if traceStats.minElevation !== null && traceStats.maxElevation !== null}
						<div class="stat">
							<span>Elevation Range:</span>
							<span
								>{traceStats.minElevation.toFixed(0)}m - {traceStats.maxElevation.toFixed(0)}m</span
							>
						</div>
						<div class="stat">
							<span>Elevation Gain:</span>
							<span>+{traceStats.totalElevationGain.toFixed(0)}m</span>
						</div>
						<div class="stat">
							<span>Elevation Loss:</span>
							<span>-{traceStats.totalElevationLoss.toFixed(0)}m</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<div class="map-container" bind:this={mapContainer}></div>
	</main>
</div>

<style>
	.app {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 30px;
	}

	header h1 {
		color: #2c3e50;
		margin-bottom: 10px;
	}

	header p {
		color: #7f8c8d;
		margin: 0;
	}

	.upload-section {
		background: #f8f9fa;
		padding: 20px;
		border-radius: 8px;
		margin-bottom: 20px;
		text-align: center;
	}

	input[type='file'] {
		padding: 10px;
		border: 2px dashed #3498db;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}

	.file-info {
		margin-top: 15px;
		padding: 10px;
		background: #e8f5e8;
		border-radius: 4px;
		color: #27ae60;
	}

	.stats-section {
		background: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	.stats-section h3 {
		margin: 0 0 15px 0;
		color: #2c3e50;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
	}

	.stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 15px;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.stat span {
		font-weight: 500;
		color: #7f8c8d;
	}

	.stat span {
		font-weight: 600;
		color: #2c3e50;
	}

	.map-container {
		height: 600px;
		width: 100%;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.app {
			padding: 10px;
		}

		.map-container {
			height: 400px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
