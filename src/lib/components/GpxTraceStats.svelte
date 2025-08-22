<script lang="ts">
	import { getStatsDisplayItems } from '$lib/stats';
	import type { TraceStats } from '$lib/types';

	let { traceStats, name }: { traceStats: TraceStats; name?: string } = $props();
</script>

<div class="variant-soft card p-4">
	{#if name}
		<header class="card-header">
			<h3 class="h3">{name}</h3>
		</header>
	{/if}
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
