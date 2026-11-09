<script lang="ts">
	import { onMount } from "svelte";
	import Picker from "./Picker.svelte";
	import OrgTags from "../../../components/OrgTags.svelte";
	import { ageOn, fullDate, idsByName, load, longDate, methods, orgName, plural, readAddress, winnerOf, loserOf, writeAddress, type Bout, type Data } from "./interactives";

	// A row per boxer: who they are, then the opponents they met in world title bouts, as cards in date order on a strip
	// that scrolls sideways, each with the world titles at stake. Head to head shows only the bouts between the boxers
	// added; All opponents, everything. Like the timelines, a strip
// moves with its arrows, a drag or a sideways swipe, and once it has moved on from the start a shadow at its left edge
// shows it running under the boxer's details.
	let data: Data | null = $state(null);
	// with none in the address, it starts with the Four Kings: Leonard, Duran, Hagler and Hearns
	let items: number[] = $state(readAddress("show", []).map(Number));
	onMount(async () => {
		const loaded = await load();
		if (!new URLSearchParams(location.search).has("show"))
			items = idsByName(loaded, ["Sugar Ray Leonard", "Roberto Duran", "Marvin Hagler", "Thomas Hearns"]);
		data = loaded;
	});
	type View = "h2h" | "all";
	let view: View = $state(readAddress("view", ["h2h"])[0] === "all" ? "all" : "h2h");
	// once the data is in, the address follows what is chosen
	$effect(() => {
		if (data) writeAddress({ show: items.join(","), view: view === "all" ? "all" : null });
	});

	const options = $derived(data ? data.boxers.map((b) => ({ key: String(b.id), label: b.name })) : []);
	const views: [View, string][] = [
		["h2h", "Head to head"],
		["all", "All opponents"],
	];
	const opponent = (b: Bout, id: number) => (b.a.id === id ? b.b : b.a);
	const boutsOf = (id: number) => (data ? data.bouts.filter((b) => b.result !== "S" && (b.a.id === id || b.b.id === id)) : []);
	const tooFew = $derived(view !== "all" && items.length < 2);

	const rows = $derived.by(() => {
		if (!data || tooFew) return [];
		const d = data;
		return items.flatMap((id) => {
			const boxer = d.boxerById.get(id);
			if (!boxer) return [];
			const shown = boutsOf(id).filter((b) => {
				const o = opponent(b, id);
				return view === "all" || (o.id !== null && items.includes(o.id));
			});
			const won = shown.filter((b) => winnerOf(b)?.id === id).length;
			const lost = shown.filter((b) => loserOf(b)?.id === id).length;
			const drawn = shown.length - won - lost;
			return [
				{
					boxer,
					summary: shown.length ? plural(shown.length, "world title bout") : "No world title bouts here",
					record: shown.length ? `Won ${won}, lost ${lost}${drawn ? `, drawn ${drawn}` : ""}` : "",
					cards: shown.map((b) => {
						const o = opponent(b, id);
						const result = b.result === "D" || b.result === "N" ? "draw" : winnerOf(b)?.id === id ? "won" : "lost";
						// the method as boxing writes it, e.g. UD or KO, spelt out for screen readers
						const how = b.method && b.method !== "NC" ? b.method : "";
						return {
							b,
							o,
							// a bout against another of the boxers added: outlined in bold among all the opponents
							meeting: view === "all" && o.id !== null && items.includes(o.id),
							result,
							label: result === "won" ? "Won" : result === "lost" ? "Lost" : b.result === "N" ? "No contest" : "Drawn",
							how: b.result === "N" ? "" : how,
							howLong: methods[how] ?? how,
							age: ageOn(boxer.born, b.date),
						};
					}),
				},
			];
		});
	});

	// as on the champion pages: blue won, orange lost, grey drawn
	const dots: Record<string, string> = { won: "bg-[#2f6db3]", lost: "bg-[#f08a24]", draw: "bg-[#bdbcb2]" };

	// strips move with the arrows, or by dragging with a mouse; each knows whether it is at its start or its end
	const strips: HTMLElement[] = $state([]);
	const ends: { start: boolean; end: boolean }[] = $state([]);
	// a mouse drag moves the strip freely; on letting go it glides on in the direction it was thrown and settles with a
	// card at its left edge. The browser's own snapping is off while dragging, or it would pull at every card
	let justDragged = false;
	let gliding = 0;
	let drag: { strip: HTMLElement; x: number; left: number; lastX: number; lastT: number; v: number; moved: boolean } | null = null;
	const startDrag = (e: PointerEvent, strip: HTMLElement) => {
		if (e.pointerType !== "mouse" || e.button) return;
		cancelAnimationFrame(gliding);
		drag = { strip, x: e.clientX, left: strip.scrollLeft, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: false };
		strip.style.scrollSnapType = "none";
	};
	const moveDrag = (e: PointerEvent) => {
		if (!drag) return;
		if (!drag.moved && Math.abs(e.clientX - drag.x) > 4) {
			drag.moved = true;
			drag.strip.setPointerCapture(e.pointerId);
		}
		drag.strip.scrollLeft = drag.left - (e.clientX - drag.x);
		const dt = e.timeStamp - drag.lastT;
		// the speed, smoothed, in pixels a millisecond
		if (dt > 0) drag.v = 0.7 * ((e.clientX - drag.lastX) / dt) + 0.3 * drag.v;
		drag.lastX = e.clientX;
		drag.lastT = e.timeStamp;
	};
	const endDrag = (e: PointerEvent) => {
		if (!drag) return;
		const { strip, moved } = drag;
		// a pause before letting go stops the throw, and a throw goes at most a few cards
		const v = e.timeStamp - drag.lastT > 80 ? 0 : Math.max(-3, Math.min(3, drag.v));
		drag = null;
		if (!moved) {
			strip.style.scrollSnapType = "";
			return;
		}
		// the click that ends a drag is not a click on a card's link
		justDragged = true;
		setTimeout(() => (justDragged = false), 0);
		glideTo(strip, strip.scrollLeft - v * 220);
	};
	// glides a strip to the card nearest `aim`, never past either end. Eased here, frame by frame, rather than left to
	// the browser's smooth scrolling: its end can't be told apart from a drag's own scroll events, and Safari's, with the
	// cards' snapping on, can carry the strip past its start. Snapping comes back only once it has settled, and only if
	// no new drag has begun
	const glideTo = (strip: HTMLElement, aim: number) => {
		cancelAnimationFrame(gliding);
		strip.style.scrollSnapType = "none";
		const base = strip.getBoundingClientRect().left - strip.scrollLeft;
		const starts = [...strip.children].map((c) => c.getBoundingClientRect().left - base);
		const max = strip.scrollWidth - strip.clientWidth;
		const target = Math.max(0, Math.min(max, starts.reduce((best, x) => (Math.abs(x - aim) < Math.abs(best - aim) ? x : best), 0)));
		const from = strip.scrollLeft;
		const started = performance.now();
		const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : Math.min(600, 260 + Math.abs(target - from) * 0.6);
		const step = (now: number) => {
			const p = duration ? Math.min(1, (now - started) / duration) : 1;
			strip.scrollLeft = from + (target - from) * (1 - (1 - p) ** 3);
			if (p < 1) gliding = requestAnimationFrame(step);
			else if (!drag) strip.style.scrollSnapType = "";
		};
		gliding = requestAnimationFrame(step);
	};
	// the arrows: most of a screen's width earlier or later, settling on a card
	const scroll = (i: number, by: number) => strips[i] && glideTo(strips[i], strips[i].scrollLeft + strips[i].clientWidth * 0.8 * by);
	const update = (i: number) => {
		const s = strips[i];
		if (s) ends[i] = { start: s.scrollLeft < 2, end: s.scrollLeft + s.clientWidth > s.scrollWidth - 2 };
	};
	// the arrows start right once the strips are drawn, and when the window changes size
	$effect(() => {
		void rows;
		const all = () => strips.forEach((_, i) => update(i));
		requestAnimationFrame(all);
		addEventListener("resize", all);
		return () => removeEventListener("resize", all);
	});
</script>

{#snippet arrows(i: number)}
	<button type="button" aria-label="Earlier opponents" disabled={ends[i]?.start ?? true} onclick={() => scroll(i, -1)} class="zoom-button">
		<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"></path></svg>
	</button>
	<button type="button" aria-label="Later opponents" disabled={ends[i]?.end ?? false} onclick={() => scroll(i, 1)} class="zoom-button">
		<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"></path></svg>
	</button>
{/snippet}

<Picker
	label="Add world champion"
	placeholder="Search"
	{options}
	chosen={items.map(String)}
	onadd={(key) => (items = [...items, Number(key)])}
	onremove={(key) => {
		items = items.filter((id) => id !== Number(key));
	}}
/>

<div role="radiogroup" aria-label="Show" class="-ml-2.5 flex flex-wrap border-b-2 border-ink">
	{#each views as [value, label]}
		<button
			type="button"
			role="radio"
			aria-checked={view === value}
			onclick={() => (view = value)}
			class={["min-h-11 cursor-pointer px-2.5 text-[15px] whitespace-nowrap hover:bg-ink/6", view === value ? "font-semibold text-ink underline decoration-gold decoration-3 underline-offset-6" : "text-muted"]}
			>{label}</button
		>
	{/each}
</div>

{#if !data}
	<p class="mt-4 border-y border-rule py-12 text-center text-[15px] text-muted">Loading the data…</p>
{:else if tooFew}
	<p class="mt-4 border-y border-rule py-12 text-center text-[15px] text-muted">Add at least two boxers to compare.</p>
{:else}
	<ol class="mt-4">
		{#each rows as row, i}
			<li class="grid grid-cols-[240px_minmax(0,1fr)] border-b border-rule py-6 max-[760px]:flex max-[760px]:flex-col max-[760px]:gap-3 max-[760px]:py-5">
				<div class="min-w-0 pr-6">
					<p class="font-heading text-2xl leading-7 font-semibold"><a href="/champions/{row.boxer.id}/">{row.boxer.name}</a></p>
					<p class="mt-1.5 text-[13px] text-muted">Born {fullDate(row.boxer.born)}</p>
					<p class="mt-2 text-[13px] leading-5 text-ink-soft">{row.summary}{#if row.record}<br />{row.record}{/if}</p>
					{#if row.cards.length > 2}
						<div class="mt-3 flex gap-2 max-[760px]:hidden">
							{@render arrows(i)}
						</div>
					{/if}
				</div>
				<div class="min-w-0">
					{#if row.cards.length === 0}
						<p class="py-6 text-sm text-muted">No world title bouts against the others.</p>
					{:else}
						<div class="relative">
						<ol
							bind:this={strips[i]}
							onscroll={() => update(i)}
							onpointerdown={(e) => startDrag(e, strips[i])}
							onpointermove={moveDrag}
							onpointerup={endDrag}
							onpointercancel={endDrag}
							ondragstart={(e) => e.preventDefault()}
							onclickcapture={(e) => {
								if (justDragged) e.preventDefault();
							}}
							class="flex cursor-grab snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						>
							{#each row.cards as card}
								<li class={["flex min-h-37 shrink-0 basis-44 snap-start flex-col bg-cream max-[760px]:basis-40", card.meeting ? "border-[1.5px] border-ink p-[11.5px]" : "border border-rule p-3"]}>
									<p class="flex items-center gap-1.5 text-xs leading-4 text-ink-soft">
										<span aria-hidden="true" class={["size-3 shrink-0 rounded-full border-[1.5px] border-ink", dots[card.result]]}></span>{card.label}{#if card.how}, <abbr title={card.howLong} class="no-underline">{card.how}</abbr>{/if}
									</p>
									<p class="mt-2 text-[15px] leading-[19px] font-semibold">
										{#if card.o.id}<a href="/champions/{card.o.id}/">{card.o.name}</a>{:else}{card.o.name}{/if}
									</p>
									<p class="mt-auto pt-2.5 text-xs leading-4 text-muted">{card.b.weight}</p>
									<p class="mt-1 text-xs leading-5 text-muted">
										<OrgTags orgs={card.b.titles.map((t) => ({ abbreviation: t.org, short: orgName(t.org) }))} gold={card.b.gold} />
									</p>
									<p class="mt-1.5 text-xs leading-4 text-muted">{longDate(card.b.date)}</p>
									<p class="mt-0.5 text-xs leading-4 text-muted">Age {card.age}</p>
								</li>
							{/each}
						</ol>
						<!-- once the strip has moved on from its start, it runs under this shadow, beside the boxer's name; on phones,
						     where the name is above and the cards run off the screen's edge, it fades out there as on the right -->
						<span aria-hidden="true" class={["pointer-events-none absolute inset-y-0 left-0 w-3 bg-linear-to-r from-ink/16 to-transparent transition-opacity duration-200 max-[760px]:w-8 max-[760px]:from-cream", ends[i]?.start === false ? "opacity-100" : "opacity-0"]}></span>
						<!-- and while there are cards past its right edge, it fades out there -->
						<span aria-hidden="true" class={["pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-cream max-[760px]:w-8 to-transparent transition-opacity duration-200", ends[i]?.end === false ? "opacity-100" : "opacity-0"]}></span>
						</div>
						{#if row.cards.length > 2}
							<div class="mt-2 hidden justify-end gap-2 max-[760px]:flex">
								{@render arrows(i)}
							</div>
						{/if}
					{/if}
				</div>
			</li>
		{/each}
	</ol>
	<p class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-muted">
		<span><span aria-hidden="true" class="mr-1.5 inline-block size-3 rounded-full border-[1.5px] border-ink bg-[#2f6db3] align-[-1px]"></span>Won</span>
		<span><span aria-hidden="true" class="mr-1.5 inline-block size-3 rounded-full border-[1.5px] border-ink bg-[#f08a24] align-[-1px]"></span>Lost</span>
		<span><span aria-hidden="true" class="mr-1.5 inline-block size-3 rounded-full border-[1.5px] border-ink bg-[#bdbcb2] align-[-1px]"></span>Drawn or no contest</span>
	</p>
{/if}
