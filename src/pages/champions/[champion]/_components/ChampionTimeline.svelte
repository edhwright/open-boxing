<script lang="ts">
	import dayjs from "dayjs";
	import OrgTags from "../../../../components/OrgTags.svelte";
	import { orgOrder, type ChampionBout, type ChampionReign, type Org, type Part } from "./champion";
	import { nearerEnd, type PageReference } from "../../../../references";

	// The champion's world title events and places in The Ring's annual ratings: a heading for each year, then a row per
	// date. On wider screens a column per organisation on the left shows the world titles held, its bar running from the
	// day a reign begins to the day it ends (inclusive) and on through the year headings. The WBA's titles (single, Super,
	// Regular) share a column, and holding two of an organisation's world titles at once is still one plain bar. The bars
	// show where reigns begin and end, so only a scheduled bout gets a note. Rendered at build time only: both orders are
	// in the page, and the Oldest first / Newest first choice (two radio buttons) shows one with CSS, so no JavaScript is sent.
	// The sources (news reports, being added) are hidden until "Show references" is ticked, also with CSS; without any,
	// there's no switch. The Ring's annual ratings show until "Show rankings" is unticked: a date, or a whole year, with
	// nothing else goes with them.
	interface Props {
		name: string;
		reigns: ChampionReign[];
		bouts: ChampionBout[];
		// bout articles by bout date: where to read them and how many there are
		articles: Record<string, { href: string; count: number }>;
		// The Ring's annual ratings; position 0 is The Ring's champion
		rankings: { date: string; weightClass: string; position: number }[];
	}

	let { name, reigns, bouts, articles, rankings }: Props = $props();

	const tints: Record<string, string> = {
		IBU: "bg-ibu-tint",
		NYSAC: "bg-nysac-tint",
		WBA: "bg-wba-tint",
		WBAS: "bg-wba-tint",
		WBAR: "bg-wba-tint",
		WBC: "bg-wbc-tint",
		IBF: "bg-ibf-tint",
		WBO: "bg-wbo-tint",
		RING: "bg-ring-tint",
	};

	interface Event {
		date: string;
		text: Part[];
		weight: string;
		orgs: Org[];
		begins: string[];
		ends: string[];
		isBout: boolean;
		scheduled: boolean;
		gold: string[];
		// a place in The Ring's annual ratings: the text alone, with no weight class or titles under it
		rating?: boolean;
		references: PageReference[];
	}

	// the WBA's titles share a column
	const column = (org: string) => (org === "WBAS" || org === "WBAR" ? "WBA" : org);

	const key = (org: string, weight: string) => `${org}:${weight}`;

	const events = $derived.by(() => {
		const list: Event[] = bouts.map((b) => {
			const keys = b.titles.map((t) => key(t.org.abbreviation, t.weight));
			const has = (k: string, field: "begins" | "ends") => reigns.some((r) => key(r.org.abbreviation, r.weight) === k && r[field] === b.date);
			return {
				date: b.date,
				text: b.parts,
				weight: b.weight,
				orgs: b.titles.map((t) => t.org),
				begins: keys.filter((k) => has(k, "begins")),
				ends: keys.filter((k) => has(k, "ends")),
				isBout: true,
				scheduled: b.result === "scheduled",
				gold: b.gold,
				references: b.references,
			};
		});
		// reigns that start or end away from a bout for that title get their own entry
		for (const r of reigns) {
			const k = key(r.org.abbreviation, r.weight);
			const title = `${r.org.short} ${r.weight.toLowerCase()}`;
			const self: Part = { text: name, bold: true };
			if (!list.some((e) => e.date === r.begins && e.begins.includes(k))) {
				list.push({
					date: r.begins,
					text: [self, { text: ` becomes ${title} champion` }],
					weight: r.weight,
					orgs: [r.org],
					begins: [k],
					ends: [],
					isBout: false,
					scheduled: false,
					gold: [],
					references: r.references.filter((ref) => nearerEnd(ref, r.begins, r.ends) === "begins"),
				});
			}
			if (r.ends && !list.some((e) => e.date === r.ends && e.ends.includes(k))) {
				list.push({
					date: r.ends,
					text: [self, { text: `’s ${title} world title reign ends` }],
					weight: r.weight,
					orgs: [r.org],
					begins: [],
					ends: [k],
					isBout: false,
					scheduled: false,
					gold: [],
					references: r.references.filter((ref) => nearerEnd(ref, r.begins, r.ends) === "ends"),
				});
			}
		}
		// a weight class rating comes before a pound for pound one on the same day
		const p4p = (r: Props["rankings"][number]) => r.weightClass === "Pound for Pound";
		for (const r of [...rankings].sort((a, b) => a.date.localeCompare(b.date) || Number(p4p(a)) - Number(p4p(b)))) {
			const rating = p4p(r)
				? `No. ${r.position} pound for pound`
				: r.position === 0
					? `the ${r.weightClass.toLowerCase()} champion`
					: `No. ${r.position} at ${r.weightClass.toLowerCase()}`;
			const text = [{ text: "The Ring magazine rates " }, { text: name, bold: true }, { text: ` ${rating} in its annual ratings` }];
			list.push({ date: r.date, text, weight: r.weightClass, orgs: [], begins: [], ends: [], isBout: false, scheduled: false, gold: [], rating: true, references: [] });
		}
		return list.sort((a, b) => a.date.localeCompare(b.date));
	});

	// the timeline's switches; unticking Show rankings hides the ratings (CSS, as the radio buttons)
	const switchClass = "inline-flex min-h-9 cursor-pointer items-center gap-2.5 px-2.5 text-sm hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,var(--color-cream))]";
	const hideRatings = "group-has-[[data-show-rankings]:not(:checked)]/timeline:hidden";
	const referenced = $derived(events.some((e) => e.references.length > 0));
	const longDate = (iso: string) => `${ordinal(dayjs(iso).date())} ${dayjs(iso).format("MMM YYYY")}`;

	const heldOrgs = $derived(orgOrder.filter((org) => reigns.some((r) => column(r.org.abbreviation) === org)));

	type BarState = "held" | "begins" | "ends" | null;
	// a year heading sits between two dates: a bar runs through it if its reign carries on past the date before.
	// Newest first turns the bars over: a reign's start is drawn where its end would be, and the other way round
	const belts = (date: string, heading: boolean, newest: boolean): BarState[] =>
		heldOrgs.map((org) => {
			const states = reigns
				.filter((r) => column(r.org.abbreviation) === org && r.begins <= date && (!r.ends || (heading ? r.ends > date : r.ends >= date)))
				.map((r) => (heading ? "held" : r.begins === date ? "begins" : r.ends === date ? "ends" : "held"));
			if (states.length === 0) return null;
			// the bar only starts or stops in this row if every title it stands for does
			const chrono = states.every((s) => s === "begins") ? "begins" : states.every((s) => s === "ends") ? "ends" : "held";
			return chrono === "held" || !newest ? chrono : chrono === "begins" ? "ends" : "begins";
		});

	const ordinal = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

	// ratingsOnly: the row holds nothing but The Ring's ratings, so it hides with them
	type Row =
		| { kind: "year"; label: string; belts: BarState[]; ratingsOnly: boolean }
		| { kind: "date"; label: string; belts: BarState[]; items: Event[]; date: string; ratingsOnly: boolean };

	const rowsFor = (newest: boolean) => {
		const dates = [...new Set(events.map((e) => e.date))];
		const years = [...new Set(dates.map((d) => d.slice(0, 4)))];
		const list: Row[] = [];
		for (const year of newest ? [...years].reverse() : years) {
			const inYear = dates.filter((d) => d.slice(0, 4) === year);
			// oldest first: bars carry on through the heading from the date before it (none above the first year);
			// newest first: from the year's last date, so current reigns run up through the latest heading
			const before = dates[dates.indexOf(inYear[0]) - 1];
			const headingBelts = newest ? belts(inYear.at(-1)!, true, true) : before ? belts(before, true, false) : heldOrgs.map(() => null);
			list.push({ kind: "year", label: year, belts: headingBelts, ratingsOnly: events.filter((e) => e.date.slice(0, 4) === year).every((e) => e.rating) });
			for (const date of newest ? [...inYear].reverse() : inYear) {
				const onDate = events.filter((e) => e.date === date);
				// a reign ending is only listed on a date with no bout and no new world title; otherwise the bars show it
				const main = onDate.filter((e) => !(e.begins.length === 0 && e.ends.length > 0 && !e.isBout));
				const items = main.length ? main : onDate;
				list.push({ kind: "date", label: `${ordinal(dayjs(date).date())} ${dayjs(date).format("MMM")}`, belts: belts(date, false, newest), items, date, ratingsOnly: items.every((e) => e.rating) });
			}
		}
		return list;
	};
	const orders = $derived([
		{ id: "oldest", label: "Oldest first", rows: rowsFor(false) },
		{ id: "newest", label: "Newest first", rows: rowsFor(true) },
	]);

	// 10px bars 4px apart
	const beltsWidth = $derived(`${Math.max(0, heldOrgs.length * 14 - 4)}px`);
</script>

{#snippet text(parts: Part[])}
	{#each parts as part}{#if part.href}<a href={part.href} class="font-semibold">{part.text}</a>{:else if part.bold}<span class="font-semibold">{part.text}</span>{:else}{part.text}{/if}{/each}
{/snippet}

<section aria-labelledby="timeline" class="group/timeline">
	<div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b-2 border-ink pb-1.5">
		<h2 id="timeline" class="mb-1 font-heading text-[28px] leading-8 font-semibold">Timeline of world title events</h2>
		<!-- which way the timeline runs: the chosen order is underlined in gold, and CSS shows its list -->
		<div role="radiogroup" aria-label="Order" class="-mr-2.5 flex text-sm">
			{#each orders as order}
				<label
					class="relative flex min-h-11 cursor-pointer items-center px-2.5 text-muted hover:bg-ink/6 has-checked:font-semibold has-checked:text-ink has-checked:underline has-checked:decoration-gold has-checked:decoration-3 has-checked:underline-offset-6 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
				>
					<input type="radio" name="timeline-order" value={order.id} checked={order.id === "oldest"} class="sr-only" />{order.label}
				</label>
			{/each}
		</div>
	</div>
	<!-- the switches for the rankings and the sources: laid over the right of the first year's heading, as on the weight
	     class and world title pages -->
	{#if referenced || rankings.length > 0}
		<div class="relative z-1">
			<div class="absolute top-4.5 -right-2.5 flex bg-cream">
				{#if rankings.length > 0}
					<label class={switchClass}>
						<input type="checkbox" data-show-rankings checked class="size-4 accent-ink" />
						Show rankings
					</label>
				{/if}
				{#if referenced}
					<label class={switchClass}>
						<input type="checkbox" data-show-refs class="size-4 accent-ink" />
						Show references
					</label>
				{/if}
			</div>
		</div>
	{/if}
	{#each orders as order}
		<ol
			class={["[--belts:0px]", order.id === "oldest" ? "group-has-[[value=newest]:checked]/timeline:hidden" : "hidden group-has-[[value=newest]:checked]/timeline:block"]}
			style:--belts={beltsWidth}
		>
			{#each order.rows as row}
				<!-- the divider runs under the belt columns too; phones leave the belt columns out -->
				<li
					class={[
						"grid grid-cols-[var(--belts)_72px_minmax(0,1fr)] gap-x-4 border-b border-rule max-[760px]:grid-cols-[72px_minmax(0,1fr)] max-[760px]:gap-x-3",
						row.ratingsOnly && hideRatings,
					]}
				>
					<span aria-hidden="true" class="flex items-stretch gap-1 max-[760px]:hidden">
						{#each row.belts as state, i}
							<span class="flex shrink-0 basis-2.5 items-start">
								{#if state}
									{@const tint = tints[heldOrgs[i]]}
									<!-- outlined like the chart's reign bars: sides all the way down, a top where it begins, a bottom where it ends.
									     While a reign carries on the bar reaches 1px past the row, so it sits on top of the divider -->
									<span
										class={[
											"w-2.5 shrink-0",
											tint,
											state === "held" && "relative z-1 -mb-px self-stretch shadow-[inset_1px_0_0_rgb(26_26_23/0.25),inset_-1px_0_0_rgb(26_26_23/0.25)]",
											state === "begins" &&
												"relative z-1 -mb-px mt-3 self-stretch rounded-t-[3px] shadow-[inset_1px_0_0_rgb(26_26_23/0.25),inset_-1px_0_0_rgb(26_26_23/0.25),inset_0_1px_0_rgb(26_26_23/0.25)]",
											state === "ends" && "h-5.5 rounded-b-[3px] shadow-[inset_1px_0_0_rgb(26_26_23/0.25),inset_-1px_0_0_rgb(26_26_23/0.25),inset_0_-1px_0_rgb(26_26_23/0.25)]",
										]}
									></span>
								{/if}
							</span>
						{/each}
					</span>
					{#if row.kind === "year"}
						<!-- the year heading takes the date and text columns; the bars carry on beside it -->
						<h3 class="col-span-2 pt-7 pb-2 font-heading text-2xl leading-7 font-semibold">{row.label}</h3>
					{:else}
						<time datetime={row.date} class="py-3 text-right text-[13px] tabular-nums leading-5 text-muted">{row.label}</time>
						<div class="flex min-w-0 flex-col gap-3 py-3">
							{#each row.items as item}
								<div class={[item.rating && hideRatings]}>
									<p class="text-[15px] leading-5">{@render text(item.text)}</p>
									{#if !item.rating}
										<p class="mt-1 text-[13px] leading-5.5 text-muted">
											{item.weight} · <OrgTags orgs={item.orgs} gold={item.gold} />
											{#if item.scheduled}<span class="ml-2.5 font-semibold whitespace-nowrap">Scheduled</span>{/if}
											{#if item.isBout && articles[row.date]}
												<a href={articles[row.date].href} class="ml-2.5 whitespace-nowrap text-ink underline decoration-gold decoration-2 underline-offset-4"
													>Read {articles[row.date].count} {articles[row.date].count === 1 ? "article" : "articles"}</a
												>
											{/if}
										</p>
									{/if}
									{#if item.references.length > 0}
										<ul class="mt-1.5 hidden text-[13px] leading-5.5 text-ink-soft group-has-[[data-show-refs]:checked]/timeline:block">
											{#each item.references as ref}
												<li>
													Source: <a href={ref.url} target="_blank" rel="noopener" class="underline decoration-gold decoration-2 underline-offset-4"
														><cite class="not-italic">{ref.headline}</cite><span class="sr-only"> (opens in a new tab)</span></a
													>, {ref.publication}{ref.author ? `, ${ref.author}` : ""}{#if ref.date}, <time datetime={ref.date}>{longDate(ref.date)}</time>{/if}
												</li>
											{/each}
										</ul>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</li>
			{/each}
		</ol>
	{/each}
</section>
