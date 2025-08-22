<script module lang="ts">
	export interface GpxLayoutContext {
		readonly map: import('leaflet').Map | undefined;
		readonly gpxData: import('$lib/types').GPXData | null;
		readonly traceStats: import('$lib/types').TraceStats | null;
		readonly gpxLayer: import('leaflet').Polyline | undefined;
		readonly uploadedFile: File | null;
	}

	// Create a context key for GPX layout data
	export const GPX_LAYOUT_CONTEXT_KEY = Symbol('gpx-layout-context');
</script>

<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import type { Map, Polyline } from 'leaflet';
	import type { GPXData, TraceStats } from '$lib/types';
	import { initializeMap, plotGPXTrace } from '$lib/map';
	import { processGPXFile } from '$lib/file';
	import GpxTraceStats from '$lib/components/GpxTraceStats.svelte';

	// Props for the layout
	let { children } = $props();

	// Shared state that will be passed to child components
	let mapContainer: HTMLDivElement;
	let map = $state<Map | undefined>(undefined);
	let gpxLayer = $state<Polyline | undefined>(undefined);
	let fileInput: HTMLInputElement;
	let uploadedFile = $state<File | null>(null);
	let gpxData = $state<GPXData | null>(null);
	let traceStats = $state<TraceStats | null>(null);
	let isLocating = $state(false);
	let locationError = $state<string | null>(null);

	// Create context object with getters to maintain reactivity
	const layoutContext = {
		get map() { return map; },
		set map(value) { map = value; },
		get gpxData() { return gpxData; },
		set gpxData(value) { gpxData = value; },
		get traceStats() { return traceStats; },
		set traceStats(value) { traceStats = value; },
		get gpxLayer() { return gpxLayer; },
		set gpxLayer(value) { gpxLayer = value; },
		get uploadedFile() { return uploadedFile; },
		set uploadedFile(value) { uploadedFile = value; }
	};

	// Set the context once during component initialization
	setContext(GPX_LAYOUT_CONTEXT_KEY, layoutContext);

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

	async function handleFileUpload(event: Event): Promise<void> {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const result = await processGPXFile(file);

			uploadedFile = file;
			gpxData = result.gpxData;
			traceStats = result.stats;

			// Plot the trace if map is available
			if (map && gpxData) {
				gpxLayer = await plotGPXTrace(map, gpxData, gpxLayer);
			}
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Unknown error processing file');
		}
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div class="container mx-auto p-4">
	<header class="mb-8 text-center">
		<h1 class="mb-2 h1">GPX Tools</h1>
		<p class="text-surface-500">Upload a GPX file to visualize and work with GPS tracks</p>
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
					onchange={handleFileUpload}
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
			<GpxTraceStats {traceStats} name={uploadedFile?.name} />

			<!-- Child components can access context data instead of props -->
			{@render children?.()}
		{:else}
			<!-- Display placeholder when no GPX file is loaded -->
			<div class="variant-ghost card p-4 text-center">
				<p>Upload a GPX file to get started</p>
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