<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Map, Polyline } from 'leaflet';
	import type { GPXData, TraceStats, GPXPoint } from '$lib/types';
	import { getStatsDisplayItems } from '$lib/stats';
	import {
		initializeMap,
		plotGPXTrace,
		createSelectableGPXTrace,
		plotInterpolatedRoute
	} from '$lib/map';
	import { processGPXFile } from '$lib/file';
	import {
		getRouteOSRM,
		getRouteORS,
		type OSRMRoutingProfile,
		type ORSRoutingProfile,
		type ORSPreference,
		type RoutingResult
	} from '$lib/routing';

	let mapContainer: HTMLDivElement;
	let map: Map;
	let gpxLayer: Polyline;
	let routeLayer: Polyline;
	let fileInput: HTMLInputElement;
	let uploadedFile: File | null = null;
	let gpxData: GPXData | null = null;
	let traceStats: TraceStats | null = null;
	let isLocating = false;
	let locationError: string | null = null;

	// Interpolation state
	let selectedPoints: GPXPoint[] = [];
	let pointLabels: string[] = ['First point', 'Second point'];
	let routingService: 'osrm' | 'ors' = 'osrm';
	let osrmProfile: OSRMRoutingProfile = 'walking';
	let orsProfile: ORSRoutingProfile = 'foot-walking';
	let orsPreference: ORSPreference = 'recommended';
	let routeResult: RoutingResult | null = null;
	let isInterpolating = false;
	let interpolationError: string | null = null;

	// Initialize the map
	onMount(async () => {
		if (browser) {
			isLocating = true;

			try {
				const result = await initializeMap({
					container: mapContainer,
					useGeolocation: true
				});

				map = result.map;
				locationError = result.error;
			} catch (error) {
				console.error('Error initializing map:', error);
				locationError = error instanceof Error ? error.message : 'Unknown map error';
			} finally {
				isLocating = false;
			}
		}
	});

	// Handle file upload
	async function handleFileUpload(event: Event): Promise<void> {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const result = await processGPXFile(file);

			uploadedFile = file;
			gpxData = result.gpxData;
			traceStats = result.stats;

			// Reset selection state when a new file is uploaded
			selectedPoints = [];
			routeResult = null;

			// Plot the trace if map is available with point selection
			if (map && gpxData) {
				gpxLayer = await createSelectableGPXTrace(map, gpxData, handlePointSelection, gpxLayer);
			}
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Unknown error processing file');
		}
	}

	// Handle point selection on the map
	function handlePointSelection(point: GPXPoint, index: number): void {
		// We only need two points
		if (selectedPoints.length >= 2) {
			// If we already have two points, reset and start over
			selectedPoints = [point];
		} else {
			// Add the point to our selection
			selectedPoints = [...selectedPoints, point];
		}

		// If we have two points, we can interpolate
		if (selectedPoints.length === 2) {
			// Show UI prompt to interpolate
			console.log('Two points selected, ready to interpolate');
		}
	}

	// Calculate and display the interpolated route
	async function interpolateRoute(): Promise<void> {
		if (!map || selectedPoints.length !== 2) {
			return;
		}

		isInterpolating = true;
		interpolationError = null;

		try {
			// Get route between the two selected points based on selected service
			if (routingService === 'osrm') {
				routeResult = await getRouteOSRM(selectedPoints[0], selectedPoints[1], osrmProfile);
			} else {
				// Use OpenRouteService
				routeResult = await getRouteORS(selectedPoints[0], selectedPoints[1], {
					profile: orsProfile,
					preference: orsPreference
				});
			}

			if (routeResult) {
				// Plot the route on the map
				routeLayer = await plotInterpolatedRoute(
					map,
					routeResult,
					selectedPoints[0],
					selectedPoints[1],
					routeLayer
				);
			}
		} catch (error) {
			console.error('Route interpolation error:', error);
			interpolationError = error instanceof Error ? error.message : 'Unknown interpolation error';
		} finally {
			isInterpolating = false;
		}
	}

	// Reset selection and route
	function resetSelection(): void {
		selectedPoints = [];
		routeResult = null;

		// Replot the original trace
		if (map && gpxData) {
			createSelectableGPXTrace(map, gpxData, handlePointSelection, gpxLayer);
		}

		// Remove the route layer if it exists
		if (routeLayer && map) {
			const L = window.L; // Use the globally loaded Leaflet instance
			map.removeLayer(routeLayer);
		}
	}
</script>

<svelte:head>
	<title>GPX Trace Plotter</title>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div class="container mx-auto p-4">
	<header class="mb-8 text-center">
		<h1 class="mb-2 h1">GPX Trace Plotter</h1>
		<p class="text-surface-500">Upload a GPX file to visualize and interpolate GPS tracks</p>
	</header>

	<main class="space-y-4">
		<div class="variant-soft card p-4">
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

		{#if isLocating}
			<div class="alert variant-filled-primary">
				<span>Locating your position...</span>
			</div>
		{:else if locationError}
			<div class="alert variant-filled-warning">
				<span>Using default location: {locationError}</span>
			</div>
		{/if}

		{#if gpxData && traceStats}
			<div class="variant-soft card p-4">
				<header class="card-header">
					<h3 class="h3">{gpxData.name}</h3>
				</header>
				<section class="p-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						{#each getStatsDisplayItems(traceStats) as item}
							<div class="variant-ghost card p-3">
								<span class="font-bold">{item.label}:</span>
								<span>{item.value}</span>
							</div>
						{/each}
					</div>
				</section>
			</div>

			<!-- Point Selection and Interpolation UI -->
			<div class="variant-soft card p-4">
				<header class="card-header">
					<h3 class="h3">Route Interpolation</h3>
				</header>
				<section class="p-4">
					<p class="mb-4">
						Select two points on the GPX trace to interpolate a route between them.
					</p>

					<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each selectedPoints as point, i}
							<div class="variant-filled-primary card p-3">
								<span class="font-bold">{pointLabels[i]}:</span>
								<span>Lat: {point.lat.toFixed(6)}, Lon: {point.lon.toFixed(6)}</span>
							</div>
						{:else}
							<div class="variant-ghost card p-3">
								<span>No points selected yet. Click on the trace to select points.</span>
							</div>
						{/each}
					</div>

					{#if selectedPoints.length === 2}
						<div class="mb-4">
							<label class="label mb-2">
								<span>Routing Service</span>
								<select class="select" bind:value={routingService}>
									<option value="osrm">OpenStreetMap Routing Machine (OSRM)</option>
									<option value="ors">OpenRouteService (ORS)</option>
								</select>
							</label>

							{#if routingService === 'osrm'}
								<label class="label">
									<span>OSRM Profile</span>
									<select class="select" bind:value={osrmProfile}>
										<option value="walking">Walking</option>
										<option value="cycling">Cycling</option>
										<option value="driving">Driving</option>
									</select>
								</label>
							{:else}
								<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
									<label class="label">
										<span>ORS Profile</span>
										<select class="select" bind:value={orsProfile}>
											<option value="foot-walking">Foot - Walking</option>
											<option value="foot-hiking">Foot - Hiking</option>
											<option value="cycling-regular">Cycling - Regular</option>
											<option value="cycling-mountain">Cycling - Mountain</option>
											<option value="cycling-road">Cycling - Road</option>
											<option value="driving-car">Driving - Car</option>
										</select>
									</label>

									<label class="label">
										<span>Route Preference</span>
										<select class="select" bind:value={orsPreference}>
											<option value="recommended">Recommended</option>
											<option value="fastest">Fastest</option>
											<option value="shortest">Shortest</option>
										</select>
									</label>
								</div>
							{/if}
						</div>

						<div class="flex gap-2">
							<button
								class="variant-filled-primary btn"
								on:click={interpolateRoute}
								disabled={isInterpolating}
							>
								{isInterpolating ? 'Calculating...' : 'Interpolate Route'}
							</button>

							<button
								class="variant-soft-surface btn"
								on:click={resetSelection}
								disabled={isInterpolating}
							>
								Reset Selection
							</button>
						</div>
					{/if}

					{#if interpolationError}
						<div class="alert variant-filled-error mt-4">
							<span>{interpolationError}</span>
						</div>
					{/if}

					{#if routeResult}
						<div class="alert variant-filled-success mt-4">
							<div><strong>Route calculated:</strong></div>
							<div>Distance: {(routeResult.distance / 1000).toFixed(2)} km</div>
							<div>Duration: {Math.round(routeResult.duration / 60)} minutes</div>
						</div>
					{/if}
				</section>
			</div>
		{/if}

		<div class="overflow-hidden card p-0 shadow-lg">
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
