<script lang="ts">
	import { onMount } from "svelte";
	import "../../../timeline/timeline.css";
	import { figureHTML, marksNbaToWba, mount, nbaToWba, type Lane, type Model } from "../../../timeline/timeline";
	import { orgTagsHTML, tints } from "../../../components/orgTags";
	import { boutText, load, longDate, orgName, orgOrder, readAddress, titleLanes, today, wbaSuperMarks, writeAddress, type Bout, type Data } from "./interactives";

	// Every world title on one time axis: a lane per title, by weight class then organisation, with its reigns and a
	// circle for each of its bouts. The data is a large file, so the page loads it in the browser behind a loading
	// message, then opens on the latest years; the controls and the overview stay on screen while the lanes scroll.
	let data: Data | null = $state(null);
	let failed = $state(false);
	onMount(async () => {
		try {
			data = await load();
		} catch {
			failed = true;
		}
	});

	// world titles can be left out by organisation or weight class, e.g. "org:WBAR" or "weight:Bridgerweight"; it
	// starts without the shorter-lived and secondary ones, and the address keeps what is chosen
	const defaults = ["org:IBU", "org:NYSAC", "org:WBAR", "weight:Bridgerweight"];
	let hidden: string[] = $state(readAddress("hide", defaults));
	$effect(() => {
		if (data) writeAddress({ hide: [...hidden].sort().join(",") === [...defaults].sort().join(",") ? null : hidden.join(",") || "none" });
	});
	const toggle = (key: string) => (hidden = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);
	// a lane per world title, the WBA's main line (WBA and WBA Super) as one
	const lanesAll = $derived(data ? titleLanes(data.titles) : []);
	const orgs = $derived(orgOrder.filter((o) => lanesAll.some((t) => t.org === o)));
	const weights = $derived(data ? [...new Set(data.titles.map((t) => t.weight))] : []);
	const shown = $derived(lanesAll.filter((t) => !hidden.includes(`org:${t.org}`) && !hidden.includes(`weight:${t.weight}`)));

	const bout = "#2f6db3";
	const now = today();
	const tint = (org: string) => `var(--color-${(tints[org] ?? "bg-wba-tint").slice(3)})`;
	const addMonths = (iso: string, n: number) => {
		const d = new Date(`${iso}T00:00:00Z`);
		d.setUTCMonth(d.getUTCMonth() + n);
		return d.toISOString().slice(0, 10);
	};

	const model: Model | null = $derived.by(() => {
		if (!data) return null;
		const d = data;
		const keyOf = (org: string, weight: string) => `${org}:${weight}`;
		const boutsByTitle = new Map<string, Bout[]>();
		for (const b of d.bouts) for (const t of b.titles) boutsByTitle.set(keyOf(t.org, t.weight), [...(boutsByTitle.get(keyOf(t.org, t.weight)) ?? []), b]);
		const first = [...d.reigns.map((r) => r.begins), ...d.bouts.map((b) => b.date)].sort()[0].slice(0, 4);
		const last = [now, ...d.bouts.map((b) => b.date)].sort().at(-1)!;
		// a couple of months past the last bout, or today
		const end = addMonths(last, 2);
		const decades = [];
		for (let y = Math.ceil(Number(first) / 10) * 10; y <= Number(end.slice(0, 4)); y += 10) decades.push(y);
		const titles = shown;
		if (!titles.length) return null;
		const lanes: Lane[] = titles.map((t, i) => {
			const firstAtWeight = i === 0 || titles[i - 1].weight !== t.weight;
			return {
				heavy: firstAtWeight,
				label: `<span class="flex min-w-0 items-center gap-2 max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-0.5"><span class="w-[134px] shrink-0 text-xs leading-4 font-medium text-ink-soft max-[760px]:w-auto">${firstAtWeight ? t.weight : ""}</span><a href="${t.href}" class="org whitespace-nowrap ${tints[t.org]}">${orgName(t.org)}</a></span>`,
				bars: d.reigns
					.filter((r) => t.includes.includes(r.org) && r.weight === t.weight)
					.map((r) => ({ start: r.begins, end: r.ends, background: tint(r.org), mini: "#a39e92", label: d.boxerById.get(r.championId)?.name })),
				markers: wbaSuperMarks(t, d.reigns),
				// a bout for both of the lane's world titles shows once
				dots: [...new Map(t.includes.flatMap((org) => boutsByTitle.get(keyOf(org, t.weight)) ?? []).map((b) => [b.id, b])).values()].sort((a, b) => a.date.localeCompare(b.date)).map((b) => ({
					date: b.date,
					background: b.result === "S" ? "var(--color-cream)" : bout,
					dashed: b.result === "S",
					tip: { date: longDate(b.date), text: boutText(b), detail: `${b.result === "S" ? "Scheduled · " : ""}${b.weight} · ${orgTagsHTML(b.titles.map((x) => ({ abbreviation: x.org, short: orgName(x.org) })), b.gold)}` },
				})),
			};
		});
		const key = (scheduled: boolean, label: string) =>
			`<span><i aria-hidden="true" class="tl-key" style="background:${scheduled ? "var(--color-cream);border-style:dashed" : bout}"></i>${label}</span>`;
		return {
			full: [`${first}-01-01`, end],
			today: now,
			lanes,
			laneHeight: 32,
			phoneLaneHeight: 44,
			labelWidth: 242,
			phoneLabelWidth: 112,
			sticky: true,
			overviewYears: decades,
			markers: titles.some((t) => t.org === "WBA") && marksNbaToWba(d.reigns) ? [nbaToWba] : [],
			legend: [key(false, "World title bout"), ...(d.bouts.some((b) => b.result === "S") ? [key(true, "Scheduled")] : [])].join(""),
		};
	});

	// draw the latest years, then hand them to the timeline's zoom; when the world titles shown change, it is drawn
	// again where it was
	let root: HTMLDivElement | undefined = $state();
	let view: [string, string] | null = null;
	$effect(() => {
		if (!root || !model) return;
		const start = new Date(Date.parse(model.full[1]) - 5 * 365.25 * 86400000).toISOString().slice(0, 10);
		const initial: [string, string] = view ?? [start, model.full[1]];
		root.innerHTML = figureHTML(model, initial, root.clientWidth - model.labelWidth);
		return mount(root, model, initial, (d) => (view = d));
	});
</script>

{#snippet chip(key: string, label: string, org?: string)}
	<label class="flex min-h-9 cursor-pointer items-center gap-2 border border-ink bg-cream px-2.5 text-sm has-[:not(:checked)]:border-rule has-[:not(:checked)]:text-muted">
		<input type="checkbox" class="size-4 accent-ink" checked={!hidden.includes(key)} onchange={() => toggle(key)} />
		<span class={org ? `org ${tints[org]}` : ""}>{label}</span>
	</label>
{/snippet}

{#if data}
	<details class="mb-6 border-t-2 border-ink">
		<summary class="flex min-h-12 cursor-pointer items-center gap-2 text-[15px] font-medium">
			<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="transition-transform [details[open]_&]:rotate-90"><path d="M9 6l6 6-6 6"></path></svg>
			World titles <span class="font-normal text-muted">{shown.length} of {lanesAll.length} shown</span>
		</summary>
		<div class="grid gap-4 pt-1 pb-5">
			<fieldset>
				<legend class="mb-2 text-[13px] font-medium text-ink-soft">Organisations</legend>
				<div class="flex flex-wrap gap-2">
					{#each orgs as org}{@render chip(`org:${org}`, orgName(org), org)}{/each}
				</div>
			</fieldset>
			<fieldset>
				<legend class="mb-2 text-[13px] font-medium text-ink-soft">Weight classes</legend>
				<div class="flex flex-wrap gap-2">
					{#each weights as weight}{@render chip(`weight:${weight}`, weight)}{/each}
				</div>
			</fieldset>
			<p><button type="button" class="tl-link -ml-2" onclick={() => (hidden = [...defaults])}>Reset</button></p>
		</div>
	</details>
{/if}

{#if failed}
	<p class="border-t-2 border-b border-t-ink border-b-rule py-16 text-center text-[15px] text-muted">The data didn’t load. Try reloading the page.</p>
{:else if data && !model}
	<p class="border-t-2 border-b border-t-ink border-b-rule py-16 text-center text-[15px] text-muted">Choose at least one organisation and weight class.</p>
{:else if !model}
	<!-- a stand-in for the lanes while the data loads -->
	<div role="status" class="relative border-t-2 border-ink">
		<div aria-hidden="true" class="grid grid-cols-[242px_minmax(0,1fr)] max-[760px]:grid-cols-[112px_minmax(0,1fr)]">
			{#each Array(14) as _, i}
				<span class="h-8 border-b border-rule"><span class="mt-2.5 block h-3 w-16 bg-rule/50" style:margin-left="{i % 4 ? 128 : 0}px"></span></span>
				<span class="h-8 border-b border-rule"></span>
			{/each}
		</div>
		<p class="absolute inset-x-0 top-24 mx-auto w-fit border border-ink bg-cream px-5 py-3 text-[15px]">Loading data…</p>
	</div>
{:else}
	<div bind:this={root}></div>
{/if}
