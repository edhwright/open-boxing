<script lang="ts">
	import type { ChampionsCell, Org } from "./home";

	interface Props {
		orgs: Org[];
		rows: { weight: { class: string; lb: string; href: string }; cells: ChampionsCell[] }[];
	}

	let { orgs, rows }: Props = $props();

	const tints: Record<string, string> = { WBA: "bg-wba-tint", WBAS: "bg-wba-tint", WBC: "bg-wbc-tint", IBF: "bg-ibf-tint", WBO: "bg-wbo-tint", RING: "bg-ring-tint" };
</script>

{#snippet holder(cell: ChampionsCell)}
	{#if cell.reign}
		{#if cell.reign.vacant}
			<!-- a vacant title links to no one; "since" is the day it became vacant -->
			<span class="block text-muted italic">Vacant</span>
		{:else}
			<a href="/champions/{cell.reign.championId}/" class="block font-semibold">{cell.reign.name}</a>
		{/if}
		<span class="mt-1.5 block w-max max-w-full">
			<span class="block text-xs text-muted tabular-nums">since {cell.reign.since}</span>
			<span aria-hidden="true" class="mt-1 block h-0.5 bg-ink" style:width="{Math.round(cell.reign.held * 100)}%"></span>
		</span>
	{:else}
		<span class="block text-muted italic">No champion</span>
	{/if}
{/snippet}

<!-- wider screens (the table needs about 820px): a weight class per row, a world title per column -->
<!-- the header row sticks to the top of the screen while the table scrolls past -->
<div class="max-[860px]:hidden">
	<table class="w-full border-collapse text-sm">
		<thead>
			<tr>
				<th scope="col" class="sticky top-0 z-10 w-[15%] bg-cream py-3 pr-3 text-left text-[13px] font-medium text-muted shadow-[inset_0_-1px_0_var(--color-ink)]">Weight class</th>
				{#each orgs as org}
					<th scope="col" class="sticky top-0 z-10 w-[17%] bg-cream p-3 text-left text-[13px] font-normal shadow-[inset_0_-1px_0_var(--color-ink)]">
						<span class={["px-1 italic", tints[org.abbreviation]]}>{org.short}</span>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr class="border-b border-rule">
					<th scope="row" class="py-3 pr-3 text-left align-top font-semibold">
						<a href={row.weight.href}>{row.weight.class}</a>
						<span class="block text-xs font-normal text-muted">{row.weight.lb} lb</span>
					</th>
					{#each row.cells as cell}
						<td class={["p-3 align-top", cell.gold && "bg-gold/40"]}>{@render holder(cell)}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<!-- phones: one block per weight class, a row per world title; the undisputed rows sit together as one gold block -->
<div class="min-[861px]:hidden">
	{#each rows as row}
		<section class="border-b border-rule py-4">
			<h3 class="mb-2 flex items-baseline justify-between gap-3 font-semibold">
				<a href={row.weight.href}>{row.weight.class}</a>
				<span class="text-xs font-normal text-muted">{row.weight.lb} lb</span>
			</h3>
			<ul>
				{#each row.cells as cell}
					<li class={["grid grid-cols-[96px_minmax(0,1fr)] gap-3 p-2", cell.gold && "bg-gold/40"]}>
						<span class="text-[13px]"><span class={["italic", !cell.gold && ["px-1", tints[cell.org.abbreviation]]]}>{cell.org.short}</span></span>
						<span class="min-w-0 text-sm">{@render holder(cell)}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
