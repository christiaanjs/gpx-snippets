<script lang="ts">
	import { getContext } from 'svelte';
	import type { Map, Polyline } from 'leaflet';
	import type { GPXData, TraceStats, GPXPoint } from '$lib/types';
	import { createSelectableGPXTrace, plotInterpolatedRoute } from '$lib/map';
	import {
		getRouteOSRM,
		getRouteORS,
		type OSRMRoutingProfile,
		type ORSRoutingProfile,
		type ORSPreference,
		type RoutingResult
	} from '$lib/routing';
	import { GPX_LAYOUT_CONTEXT_KEY, type GpxLayoutContext } from '../+layout.svelte';
	
	const layoutContext = getContext<GpxLayoutContext>(GPX_LAYOUT_CONTEXT_KEY);

	// Access reactive values directly from context - these will be reactive
	const map = $derived(layoutContext.map);
	const gpxData = $derived(layoutContext.gpxData);
	const gpxLayer = $derived(layoutContext.gpxLayer);

	// State variables with proper reactivity
	let selectedPoints = $state<GPXPoint[]>([]);
	let pointLabels = $state<string[]>(['First point', 'Second point']);
	let routingService = $state<'osrm' | 'ors'>('osrm');
	let osrmProfile = $state<OSRMRoutingProfile>('walking');
	let orsProfile = $state<ORSRoutingProfile>('foot-walking');
	let orsPreference = $state<ORSPreference>('recommended');
	let routeResult = $state<RoutingResult | null>(null);
	let isInterpolating = $state(false);
	let interpolationError = $state<string | null>(null);
	let routeLayer = $state<Polyline | undefined>(undefined);

	// Set up selectable points when map and gpxData change using $effect
	$effect(() => {
		if (map && gpxData) {
			console.log('Setting up selectable GPX trace');
			createSelectableGPXTrace(map, gpxData, handlePointSelection, gpxLayer);
		}
	});

	// Handle point selection on the map
	function handlePointSelection(point: GPXPoint, index: number): void {
		console.log(`Point selected: ${point.lat}, ${point.lon} at index ${index}`);
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

<!-- Point Selection and Interpolation UI -->
<div class="variant-soft card p-4">
	<header class="card-header">
		<h3 class="h3">Route Interpolation</h3>
	</header>
	<section class="p-4">
		<p class="mb-4">Select two points on the GPX trace to interpolate a route between them.</p>

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
					onclick={interpolateRoute}
					disabled={isInterpolating}
				>
					{isInterpolating ? 'Calculating...' : 'Interpolate Route'}
				</button>

				<button
					class="variant-soft-surface btn"
					onclick={resetSelection}
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