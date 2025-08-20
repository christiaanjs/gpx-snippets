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

<div class="container mx-auto p-4">
	<header class="text-center mb-8">
		<h1 class="h1 mb-2">GPX Trace Plotter</h1>
		<p class="text-surface-500">Upload a GPX file to visualize your GPS track</p>
	</header>

	<main class="space-y-4">
		<div class="card p-4 variant-soft">
			<label class="label">
				<span>Upload GPX File</span>
				<input
					class="input"
					type="file"
					accept=".gpx"
					bind:this={fileInput}
					on:change={handleFileUpload}
				/>
			</label>

			{#if uploadedFile}
				<div class="alert variant-filled-success mt-4">
					<strong>Loaded:</strong>
					{uploadedFile.name}
				</div>
			{/if}
		</div>

		{#if gpxData && traceStats}
			<div class="card p-4 variant-soft">
				<header class="card-header">
					<h3 class="h3">{gpxData.name}</h3>
				</header>
				<section class="p-4">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="card p-3 variant-ghost">
							<span class="font-bold">Distance:</span>
							<span>{traceStats.totalDistance.toFixed(2)} km</span>
						</div>
						<div class="card p-3 variant-ghost">
							<span class="font-bold">Duration:</span>
							<span>{formatDuration(traceStats.duration)}</span>
						</div>
						<div class="card p-3 variant-ghost">
							<span class="font-bold">Points:</span>
							<span>{traceStats.pointCount.toLocaleString()}</span>
						</div>
						{#if traceStats.minElevation !== null && traceStats.maxElevation !== null}
							<div class="card p-3 variant-ghost">
								<span class="font-bold">Elevation Range:</span>
								<span>{traceStats.minElevation.toFixed(0)}m - {traceStats.maxElevation.toFixed(0)}m</span>
							</div>
							<div class="card p-3 variant-ghost">
								<span class="font-bold">Elevation Gain:</span>
								<span>+{traceStats.totalElevationGain.toFixed(0)}m</span>
							</div>
							<div class="card p-3 variant-ghost">
								<span class="font-bold">Elevation Loss:</span>
								<span>-{traceStats.totalElevationLoss.toFixed(0)}m</span>
							</div>
						{/if}
					</div>
				</section>
			</div>
		{/if}

		<div class="card p-0 overflow-hidden shadow-lg">
			<div class="map-container h-[600px]" bind:this={mapContainer}></div>
		</div>
	</main>
</div>

<style>
	/* Map container specific styles */
	@media (max-width: 768px) {
		.map-container {
			height: 400px !important;
		}
	}
</style>

