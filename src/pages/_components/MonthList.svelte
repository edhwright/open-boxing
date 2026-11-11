<script lang="ts">
	import OrgTags from "../../components/OrgTags.svelte";
	import type { Org, Person } from "./home";

	// Upcoming world title bouts or world title changes: month headings, then a line per day (on phones the days start
	// where the champions table's organisations do), e.g.
	// "28th  Teofimo Lopez beats Josh Taylor via unanimous decision 12/12", and under it the weight class and world titles
	interface Event {
		date: string;
		day: string;
		// a bout's two boxers ("A v B"), or a champion and what they did
		a?: Person;
		b?: Person;
		champion?: Person;
		text?: string;
		weight: { class: string; href: string };
		orgs: Org[];
		// the titles to highlight in gold, if it is for an undisputed title
		gold: string[];
		// e.g. "New champion" or "New IBF champion"
		newChampion?: string | null;
	}

	interface Props {
		months: { month: string; events: Event[] }[];
		empty: string;
	}

	let { months, empty }: Props = $props();
</script>

{#snippet name(p: Person)}
	<!-- champions are bold and link to their page; anyone else is plain text -->
	{#if p.href}<a href={p.href} class="font-semibold">{p.name}</a>{:else}{p.name}{/if}
{/snippet}

{#each months as group}
	<div class="flex flex-wrap gap-x-6 border-b border-rule py-5 last:border-b-0">
		<h3 class="mb-2 shrink-0 grow-0 basis-40 font-heading text-xl font-semibold">{group.month}</h3>
		<ol class="flex min-w-0 shrink grow basis-120 flex-col gap-4">
			{#each group.events as e}
				<li class="flex gap-4 max-[860px]:gap-2">
					<time datetime={e.date} class="shrink-0 basis-10 text-right text-[13px] tabular-nums leading-6 text-muted max-[860px]:basis-11 max-[860px]:pl-2 max-[860px]:text-left">{e.day}</time>
					<div class="min-w-0 grow">
						<p class="text-[15px] leading-6">
							{#if e.champion}{@render name(e.champion)} {e.text}{:else if e.a && e.b}{@render name(e.a)} v {@render name(e.b)}{/if}
						</p>
						<p class="mt-0.5 text-[13px] leading-5.5 text-muted">
							{e.weight.class} · <OrgTags orgs={e.orgs} gold={e.gold} />
							{#if e.newChampion}<span class="ml-2.5 font-semibold text-ink">{e.newChampion}</span>{/if}
						</p>
					</div>
				</li>
			{/each}
		</ol>
	</div>
{:else}
	<p class="py-5 text-muted">{empty}</p>
{/each}
