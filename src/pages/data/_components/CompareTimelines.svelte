<script lang="ts">
	import { onMount } from "svelte";
	import { schemeTableau10 } from "d3-scale-chromatic";
	import Picker from "./Picker.svelte";
	import "../../../timeline/timeline.css";
	import { figureHTML, marksNbaToWba, mount, nbaToWba, type Lane, type Model } from "../../../timeline/timeline";
	import { orgTagsHTML, tints } from "../../../components/orgTags";
	import { ageOn, boutText, idsByName, load, longDate, orgName, readAddress, titleLanes, today, wbaSuperMarks, winnerOf, writeAddress, type Data } from "./interactives";

	// The world titles are the rows: every title the boxers added held, by weight class then organisation. Each row
	// shows everyone who held that title, the added boxers in their own colours and the rest in grey, and the added
	// boxers' bouts for it, filled with the winner's colour. Zoom and move through time as on the weight class pages.
	let data: Data | null = $state(null);
	// with none in the address, it starts with the 1970s heavyweights
	let items: number[] = $state(readAddress("show", []).map(Number).filter(Boolean));
	onMount(async () => {
		const loaded = await load();
		if (!new URLSearchParams(location.search).has("show")) items = idsByName(loaded, ["Muhammad Ali", "Joe Frazier", "George Foreman", "Larry Holmes"]);
		data = loaded;
	});
	// once the data is in, the address follows what is chosen
	$effect(() => {
		if (data) writeAddress({ show: items.join(","), by: null });
	});

	// a colour per boxer, in the order they were added, from d3's Tableau 10 scheme: ten colours made to tell apart
	const palette = schemeTableau10;
	const colourOf = (id: number) => palette[items.indexOf(id) % palette.length];
	// a reign's name in white on the darker colours, in ink on the lighter (Tableau's yellow, pink and grey)
	const textOn = (hex: string) => {
		const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
		return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? "var(--color-ink)" : "#fff";
	};
	const others = "#e9e7dc";
	const draw = "#bdbcb2";

	const options = $derived(data ? data.boxers.map((b) => ({ key: String(b.id), label: b.name, swatch: items.includes(b.id) ? colourOf(b.id) : undefined })) : []);

	const now = today();
	const addMonths = (iso: string, n: number) => {
		const d = new Date(`${iso}T00:00:00Z`);
		d.setUTCMonth(d.getUTCMonth() + n);
		return d.toISOString().slice(0, 10);
	};
	const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

	const model: Model | null = $derived.by(() => {
		if (!data || !items.length) return null;
		const d = data;
		const chosen = new Set(items);
		const own = d.reigns.filter((r) => chosen.has(r.championId));
		const bouts = d.bouts.filter((b) => (b.a.id !== null && chosen.has(b.a.id)) || (b.b.id !== null && chosen.has(b.b.id)));
		// a lane per world title the boxers held, the WBA's main line (WBA and WBA Super) as one
		const titles = titleLanes(d.titles).filter((t) => own.some((r) => t.includes.includes(r.org) && r.weight === t.weight));
		if (!titles.length) return null;
		const dates = [...own.flatMap((r) => [r.begins, r.ends ?? now]), ...bouts.map((b) => b.date)].sort();
		const from = `${Number(dates[0].slice(0, 4)) - 1}-01-01`;
		// a couple of months past the boxers' last date, which is today while one of them still holds a title
		const to = addMonths(dates.at(-1)!, 2);
		const first = Number(from.slice(0, 4));
		const step = Number(to.slice(0, 4)) - first > 60 ? 20 : Number(to.slice(0, 4)) - first > 25 ? 10 : 5;
		const overviewYears = [];
		for (let y = Math.ceil(first / step) * step; y <= Number(to.slice(0, 4)); y += step) overviewYears.push(y);
		const hasScheduled = bouts.some((b) => b.result === "S");
		const key = (background: string, label: string, dashed = false) =>
			`<span><i aria-hidden="true" class="tl-key" style="background:${background}${dashed ? ";border-style:dashed" : ""}"></i>${label}</span>`;

		const lanes: Lane[] = titles.map((t, i) => {
			const firstAtWeight = i === 0 || titles[i - 1].weight !== t.weight;
			return {
				heavy: firstAtWeight,
				label: `<span class="flex min-w-0 items-center gap-2 max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-0.5"><span class="w-[134px] shrink-0 text-xs leading-4 font-medium text-ink-soft max-[760px]:w-auto">${firstAtWeight ? t.weight : ""}</span><a href="${t.href}" class="org whitespace-nowrap ${tints[t.org]}">${orgName(t.org)}</a></span>`,
				bars: d.reigns
					.filter((r) => t.includes.includes(r.org) && r.weight === t.weight && (r.ends ?? now) >= from && r.begins <= to)
					.map((r) => {
						const boxer = d.boxerById.get(r.championId)!;
						const mine = chosen.has(r.championId);
						return {
							start: r.begins,
							end: r.ends,
							background: mine ? colourOf(r.championId) : others,
							strong: mine,
							label: boxer.name,
							labelColour: mine ? textOn(colourOf(r.championId)) : "var(--color-muted)",
							mini: mine ? colourOf(r.championId) : "#cfcdbf",
						};
					}),
				markers: wbaSuperMarks(t, d.reigns),
				dots: bouts
					.filter((b) => b.titles.some((x) => t.includes.includes(x.org) && x.weight === t.weight))
					.map((b) => {
						const winner = winnerOf(b);
						const background =
							b.result === "S" ? "var(--color-cream)" : b.result === "D" || b.result === "N" ? draw : winner?.id && chosen.has(winner.id) ? colourOf(winner.id) : "#fff";
						return {
							date: b.date,
							background,
							dashed: b.result === "S",
							who: [b.a.id, b.b.id].filter((id): id is number => id !== null),
							tip: {
									date: longDate(b.date),
									text: boutText(b),
									// the weight class and world titles, then each added boxer's age on the day, a line each, after a
									// small gap (an opponent who isn't being compared has no age)
									detail: (() => {
										const ages = [b.a, b.b].flatMap((side) => {
											const boxer = side.id !== null && chosen.has(side.id) ? d.boxerById.get(side.id) : undefined;
											return boxer?.born ? [`${escape(boxer.name)} age: ${ageOn(boxer.born, b.date)}`] : [];
										});
										const titles = `${b.weight} · ${orgTagsHTML(b.titles.map((x) => ({ abbreviation: x.org, short: orgName(x.org) })), b.gold)}`;
										return ages.length ? `${titles}<span class="mt-1.5 block">${ages.join("\n")}</span>` : titles;
									})(),
								},
						};
					}),
			};
		});
		return {
			full: [from, to],
			today: now,
			lanes,
			laneHeight: 44,
			labelWidth: 242,
			phoneLabelWidth: 112,
			sticky: true,
			overviewYears,
			markers: marksNbaToWba(d.reigns.filter((r) => titles.some((t) => t.includes.includes(r.org) && t.weight === r.weight))) ? [nbaToWba] : [],
			legend: [
				key(colourOf(items[0]), "Won by a selected boxer"),
				key("#fff", "Won by an unselected boxer"),
				key(draw, "Draw or no contest"),
				...(hasScheduled ? [key("var(--color-cream)", "Scheduled", true)] : []),
			].join(""),
		};
	});

	// draw the starting view, then hand it to the timeline's zoom; again whenever the boxers change
	let root: HTMLDivElement | undefined = $state();
	$effect(() => {
		if (!root || !model) return;
		// it starts at the beginning, five years wide
		const end = new Date(Math.min(Date.parse(model.full[1]), Date.parse(model.full[0]) + 5 * 365.25 * 86400000)).toISOString().slice(0, 10);
		const initial: [string, string] = [model.full[0], end];
		root.innerHTML = figureHTML(model, initial, root.clientWidth - model.labelWidth);
		return mount(root, model, initial);
	});
</script>

<Picker
	label="Add world champion"
	placeholder="Search"
	{options}
	chosen={items.map(String)}
	onadd={(key) => (items = [...items, Number(key)])}
	onremove={(key) => (items = items.filter((id) => id !== Number(key)))}
/>

{#if !data}
	<p class="border-t-2 border-b border-t-ink border-b-rule py-12 text-center text-[15px] text-muted">Loading the data…</p>
{:else if !model}
	<p class="border-t-2 border-b border-t-ink border-b-rule py-12 text-center text-[15px] text-muted">Add a world champion to start.</p>
{:else}
	<div bind:this={root}></div>
{/if}
